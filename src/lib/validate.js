import { NextResponse } from 'next/server';
import { cleanPhone, isValidBdPhone } from './phone';
import { isIsoDate, parseLocalDate } from './dateUtils';

/**
 * Request-body validation shared by the API routes.
 *
 *   const { data, error } = validate(body, { title: { type: 'string', required: true, max: 120 }, ... });
 *   if (error) return badRequest(error);
 *
 * Only fields declared in the schema are returned (unknown keys are dropped, which prevents mass assignment).
 * With { partial: true } (PATCH) absent fields are simply left out and no defaults are applied.
 *
 * Types: string, text (multi-line), number, int, money, bool, date (YYYY-MM-DD), month (YYYY-MM),
 *        enum (values: []), email, url (http(s) or site-relative), phone (BD mobile), stringArray (maxItems, itemMax).
 */

const MAX_MONEY = 10000000;
const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export const badRequest = (message, extra = {}) => NextResponse.json({ error: message, ...extra }, { status: 400 });

/** Parse the JSON body; a missing or invalid body becomes a 400 instead of a 500. */
export async function readJson(request) {
    try {
        const body = await request.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: badRequest('Request body must be a JSON object.') };
        return { body };
    } catch {
        return { error: badRequest('Request body must be valid JSON.') };
    }
}

function check(value, rule, label) {
    const t = rule.type || 'string';
    switch (t) {
        case 'string':
        case 'text': {
            if (typeof value !== 'string' && typeof value !== 'number') return { error: `${label} must be text.` };
            let s = String(value).trim();
            if (t === 'string') s = s.replace(/\s+/g, ' ');
            if (rule.min && s.length < rule.min) return { error: `${label} must be at least ${rule.min} characters.` };
            const max = rule.max || (t === 'text' ? 1000 : 200);
            if (s.length > max) return { error: `${label} must be at most ${max} characters.` };
            return { value: s };
        }
        case 'number':
        case 'int':
        case 'money': {
            if (typeof value === 'string' && value.trim() === '') return { error: `${label} must be a number.` };
            const n = Number(value);
            if (!Number.isFinite(n)) return { error: `${label} must be a number.` };
            if (t === 'int' && !Number.isInteger(n)) return { error: `${label} must be a whole number.` };
            const min = rule.min ?? (t === 'money' ? 0 : -Infinity);
            const max = rule.max ?? (t === 'money' ? MAX_MONEY : Infinity);
            if (n < min) return { error: `${label} must be ${min === 0 ? 'zero or more' : `at least ${min}`}.` };
            if (n > max) return { error: `${label} must be at most ${max}.` };
            return { value: t === 'money' ? Math.round(n * 100) / 100 : n };
        }
        case 'bool':
            if (typeof value === 'boolean') return { value };
            if (value === 'true' || value === 'false') return { value: value === 'true' };
            return { error: `${label} must be true or false.` };
        case 'date': {
            const s = String(value).trim();
            if (!isIsoDate(s)) return { error: `${label} must be a date like 2026-10-30.` };
            const d = parseLocalDate(s);
            const [y, m, day] = s.split('-').map(Number);
            if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return { error: `${label} is not a real calendar date.` };
            return { value: s };
        }
        case 'month': {
            const s = String(value).trim();
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) return { error: `${label} must look like 2026-10.` };
            return { value: s };
        }
        case 'enum': {
            const s = String(value).trim();
            if (!rule.values.includes(s)) return { error: `${label} must be one of: ${rule.values.join(', ')}.` };
            return { value: s };
        }
        case 'url': {
            const s = String(value).trim();
            if (s.length > 2000) return { error: `${label} is too long.` };
            if (!/^https?:\/\/\S+$/i.test(s) && !/^\/(?!\/)\S*$/.test(s)) return { error: `${label} must be a valid http(s) link.` };
            return { value: s };
        }
        case 'email': {
            const s = String(value).trim().toLowerCase();
            if (s.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { error: `${label} must be a valid email address.` };
            return { value: s };
        }
        case 'phone': {
            if (!isValidBdPhone(value)) return { error: `${label} must be a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).` };
            return { value: cleanPhone(value) };
        }
        case 'stringArray': {
            if (!Array.isArray(value)) return { error: `${label} must be a list.` };
            const maxItems = rule.maxItems || 30;
            if (value.length > maxItems) return { error: `${label} can have at most ${maxItems} items.` };
            const itemMax = rule.itemMax || 200;
            const out = [];
            for (const item of value) {
                if (typeof item !== 'string' && typeof item !== 'number') return { error: `${label} items must be text.` };
                const s = String(item).trim();
                if (s.length > itemMax) return { error: `${label} items must be at most ${itemMax} characters.` };
                if (s) out.push(s);
            }
            return { value: out };
        }
        default:
            return { error: `${label} has an unsupported type.` };
    }
}

export function validate(body, schema, { partial = false } = {}) {
    const data = {};
    for (const [key, rule] of Object.entries(schema)) {
        const label = rule.label || key;
        const raw = body[key];
        const isList = rule.type === 'stringArray' && Array.isArray(raw);
        if (isBlank(raw) && !isList) {
            if (rule.required && !partial) return { error: `${label} is required.` };
            if (rule.required && partial && raw !== undefined) return { error: `${label} cannot be empty.` };
            if (!partial && rule.default !== undefined) data[key] = typeof rule.default === 'function' ? rule.default() : rule.default;
            // an explicitly blank optional text field clears the value on PATCH
            else if (partial && raw !== undefined && ['string', 'text', 'url'].includes(rule.type || 'string')) data[key] = '';
            continue;
        }
        const res = check(raw, rule, label);
        if (res.error) return { error: res.error };
        data[key] = res.value;
    }
    return { data };
}

/** Map thrown errors to safe responses: validation problems are 400, duplicates 409, everything else a generic 500. */
export function errorResponse(err, tag = 'API') {
    if (err?.name === 'ValidationError') {
        const first = Object.values(err.errors || {})[0];
        return badRequest(first?.message || 'Some fields are invalid.');
    }
    if (err?.name === 'CastError') return badRequest(`Invalid value for ${err.path || 'a field'}.`);
    if (err?.code === 11000) return NextResponse.json({ error: 'That record already exists.' }, { status: 409 });
    console.error(`${tag} error:`, err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}
