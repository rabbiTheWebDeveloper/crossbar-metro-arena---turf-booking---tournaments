import { cleanPhone, isValidBdPhone } from './phone.js';

/**
 * Pure SMS helpers shared by server routes and client components (no server-only imports).
 */

// GSM 03.38 basic character set (1 septet each) and extension table (2 septets each)
const GSM7_BASIC = new Set(
    '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'.split('')
);
const GSM7_EXT = new Set('^{}\\[~]|€\f'.split(''));

/**
 * Parse raw manual phone input (comma, semicolon, newline, or space separated) into
 * deduplicated valid 11-digit BD numbers (`01XXXXXXXXX`), invalid tokens, and `8801XXXXXXXXX` CSV.
 */
export function parsePhoneTokens(raw) {
    const items = Array.isArray(raw)
        ? raw.flatMap(entry => String(entry ?? '').split(/[,;\n\r]+/))
        : String(raw ?? '').split(/[,;\n\r]+/);

    const validSet = new Set();
    const invalid = [];

    for (const chunk of items) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;

        const cleaned = cleanPhone(trimmed);
        if (isValidBdPhone(cleaned)) {
            validSet.add(cleaned);
            continue;
        }

        // Support space-separated lists like "01711223344 01811223344" without breaking "+880 1812-345678"
        if (/\s/.test(trimmed)) {
            const parts = trimmed.split(/\s+/).filter(Boolean);
            if (parts.length > 1 && parts.some(p => isValidBdPhone(p))) {
                for (const p of parts) {
                    const cp = cleanPhone(p);
                    if (isValidBdPhone(cp)) validSet.add(cp);
                    else invalid.push(p);
                }
                continue;
            }
        }

        invalid.push(trimmed);
    }

    const valid = [...validSet];
    return {
        valid,
        invalid,
        formatted: valid.map(p => `88${p}`).join(',')
    };
}

/**
 * Calculate SMS encoding (GSM-7 vs Unicode/UCS-2 for Bangla & emojis) and multi-part segment count.
 */
export function estimateSmsParts(text) {
    const str = String(text ?? '');
    if (!str.length) {
        return {
            encoding: 'GSM-7',
            length: 0,
            units: 0,
            parts: 0,
            singleLimit: 160,
            multiLimit: 153,
            remainingInPart: 160
        };
    }

    let isGsm7 = true;
    let septets = 0;

    for (const ch of str) {
        if (GSM7_BASIC.has(ch)) {
            septets += 1;
        } else if (GSM7_EXT.has(ch)) {
            septets += 2;
        } else {
            isGsm7 = false;
            break;
        }
    }

    if (isGsm7) {
        const singleLimit = 160;
        const multiLimit = 153;
        const parts = septets <= singleLimit ? 1 : Math.ceil(septets / multiLimit);
        const cap = parts === 1 ? singleLimit : parts * multiLimit;
        return {
            encoding: 'GSM-7',
            length: str.length,
            units: septets,
            parts,
            singleLimit,
            multiLimit,
            remainingInPart: Math.max(0, cap - septets)
        };
    }

    // UCS-2 uses UTF-16 code units (str.length in JS)
    const units = str.length;
    const singleLimit = 70;
    const multiLimit = 67;
    const parts = units <= singleLimit ? 1 : Math.ceil(units / multiLimit);
    const cap = parts === 1 ? singleLimit : parts * multiLimit;
    return {
        encoding: 'Unicode',
        length: str.length,
        units,
        parts,
        singleLimit,
        multiLimit,
        remainingInPart: Math.max(0, cap - units)
    };
}

/**
 * Normalize an admin schedule input (either `YYYY-MM-DD HH:mm:ss` or HTML datetime-local `YYYY-MM-DDTHH:mm`)
 * into `YYYY-MM-DD HH:mm:ss` as required by api.sms.net.bd.
 */
export function normalizeScheduleInput(raw) {
    const s = String(raw ?? '').trim();
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}$/.test(s)) {
        return `${s.replace('T', ' ')}:00`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) {
        return s.replace('T', ' ');
    }
    return s;
}
