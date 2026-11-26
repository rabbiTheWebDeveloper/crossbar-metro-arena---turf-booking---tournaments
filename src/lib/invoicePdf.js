import { extractTokenSlipFields } from './invoice';

/**
 * Pure, zero-dependency A4 & 80mm POS Token Slip Vector PDF 1.4 Generator & Clean Print Utility
 * for Crossbar Metro Arena.
 */

const PAGE_W = 595.28; // A4 width in pt
const PAGE_H = 841.89; // A4 height in pt
const MARGIN = 38;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function pdfSafeText(input) {
    return String(input ?? '')
        .replace(/৳/g, 'BDT ')
        .replace(/[–—]/g, '-')
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/•|·/g, ' | ')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapePdfString(str) {
    return pdfSafeText(str)
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
}

export function fmtBdtPdf(n) {
    const val = Math.round(Number(n) || 0);
    const sign = val < 0 ? '-' : '';
    return `${sign}BDT ${Math.abs(val).toLocaleString('en-US')}`;
}

function fmtBdtHtml(n) {
    const val = Math.round(Number(n) || 0);
    const sign = val < 0 ? '-' : '';
    return `${sign}৳${Math.abs(val).toLocaleString('en-US')}`;
}

function wrapText(text, maxChars) {
    const clean = pdfSafeText(text);
    if (!clean) return [];
    if (clean.length <= maxChars) return [clean];
    const words = clean.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxChars) {
            current = candidate;
        } else {
            if (current) lines.push(current);
            if (word.length > maxChars) {
                lines.push(word.slice(0, maxChars));
                current = word.slice(maxChars);
            } else {
                current = word;
            }
        }
    }
    if (current) lines.push(current);
    return lines;
}

// Real Helvetica / Helvetica-Bold AFM advance widths (1/1000 em) for ASCII 32..126
const HELV_W = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const HELV_BOLD_W = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

function approxTextWidth(str, fontSize, isMono = false, isBold = false) {
    const s = pdfSafeText(str);
    if (isMono) return s.length * fontSize * 0.6;
    const table = isBold ? HELV_BOLD_W : HELV_W;
    let w = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i) - 32;
        w += table[c] ?? 556;
    }
    return (w * fontSize) / 1000;
}

const TONE_RGB = {
    emerald: [0.08, 0.44, 0.22],
    amber: [0.71, 0.33, 0.04],
    rose: [0.76, 0.15, 0.17],
    sky: [0.08, 0.46, 0.72],
    violet: [0.45, 0.24, 0.76],
    slate: [0.32, 0.38, 0.45]
};

function assemblePdf(pages, pageW, pageH) {
    const f = (n) => Number(n).toFixed(2);
    // Obj 1: Catalog, Obj 2: Pages, Obj 3: F1 Helvetica, Obj 4: F2 Helvetica-Bold, Obj 5: F3 Helvetica-Bold, Obj 6: F4 Helvetica-Oblique
    const objects = [];
    const addObj = (body) => {
        objects.push(body);
        return objects.length;
    };

    const catalogId = addObj('');
    const pagesId = addObj('');
    const f1Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const f2Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const f3Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const f4Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

    const utf8Len = (s) => new TextEncoder().encode(s).length;
    const pageIds = [];
    for (const streamContent of pages) {
        const streamBytesLen = utf8Len(streamContent);
        const contentId = addObj(`<< /Length ${streamBytesLen} >>\nstream\n${streamContent}\nendstream`);
        const pageId = addObj(
            `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${f(pageW)} ${f(pageH)}] ` +
            `/Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R /F3 ${f3Id} 0 R /F4 ${f4Id} 0 R >> >> ` +
            `/Contents ${contentId} 0 R >>`
        );
        pageIds.push(pageId);
    }

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let i = 0; i < objects.length; i++) {
        offsets.push(utf8Len(pdf));
        pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefOffset = utf8Len(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new TextEncoder().encode(pdf);
}

function shouldUseTokenFormat(invoice, options = {}) {
    if (options?.format === 'token' || options?.format === 'pos') return true;
    if (options?.format === 'a4') return false;
    return invoice?.defaultFormat === 'token' || invoice?.kind === 'token';
}

/**
 * Generates a complete, valid multi-page A4 PDF 1.4 binary (`Uint8Array`) OR 80mm POS Token Slip PDF.
 */
export function generateInvoicePdfBytes(invoice, options = {}) {
    if (shouldUseTokenFormat(invoice, options)) return generateReceiptPdfBytes(invoice);
    const inv = invoice || {};
    const venue = inv.venue || {};
    const recipient = inv.recipient || {};
    const items = Array.isArray(inv.items) && inv.items.length ? inv.items : [{ description: 'Arena Charge', meta: '', quantity: 1, unitPrice: 0, amount: 0 }];
    const highlights = Array.isArray(inv.highlights) ? inv.highlights.slice(0, 4) : [];
    const badgeRgb = TONE_RGB[inv.statusTone] || TONE_RGB.emerald;

    const pages = [];
    let ops = [];
    let y = PAGE_H - MARGIN;

    const f = (n) => Number(n).toFixed(2);
    const push = (cmd) => ops.push(cmd);

    const fillRect = (x, topY, w, h, rgb) => {
        push(`${f(rgb[0])} ${f(rgb[1])} ${f(rgb[2])} rg`);
        push(`${f(x)} ${f(topY - h)} ${f(w)} ${f(h)} re f`);
    };

    const strokeRect = (x, topY, w, h, rgb, lineW = 0.7) => {
        push(`${f(lineW)} w`);
        push(`${f(rgb[0])} ${f(rgb[1])} ${f(rgb[2])} RG`);
        push(`${f(x)} ${f(topY - h)} ${f(w)} ${f(h)} re S`);
    };

    const drawLine = (x1, y1, x2, y2, rgb = [0.88, 0.91, 0.94], lineW = 0.6) => {
        push(`${f(lineW)} w`);
        push(`${f(rgb[0])} ${f(rgb[1])} ${f(rgb[2])} RG`);
        push(`${f(x1)} ${f(y1)} m ${f(x2)} ${f(y2)} l S`);
    };

    const drawText = (str, x, baselineY, { font = 'F1', size = 9.5, color = [0.1, 0.14, 0.18], align = 'left' } = {}) => {
        const clean = escapePdfString(str);
        if (!clean) return;
        let drawX = x;
        const isBold = font === 'F2' || font === 'F3';
        if (align === 'right') {
            drawX = x - approxTextWidth(str, size, false, isBold);
        } else if (align === 'center') {
            drawX = x - approxTextWidth(str, size, false, isBold) / 2;
        }
        push('BT');
        push(`/${font} ${f(size)} Tf`);
        push(`${f(color[0])} ${f(color[1])} ${f(color[2])} rg`);
        push(`1 0 0 1 ${f(drawX)} ${f(baselineY)} Tm`);
        push(`(${clean}) Tj`);
        push('ET');
    };

    const drawPageHeader = (isContinuation = false) => {
        const bannerH = isContinuation ? 54 : 88;
        fillRect(0, PAGE_H, PAGE_W, bannerH, [0.05, 0.08, 0.11]);
        fillRect(0, PAGE_H - bannerH, PAGE_W, 3.5, [0.52, 0.80, 0.09]);

        drawText(venue.name || 'CROSSBAR METRO ARENA', MARGIN, PAGE_H - 28, {
            font: 'F2',
            size: isContinuation ? 13 : 16,
            color: [1, 1, 1]
        });

        if (!isContinuation) {
            drawText(venue.tagline || 'Dhaka Premier Floodlit Outdoor Turf', MARGIN, PAGE_H - 43, {
                font: 'F1',
                size: 8.5,
                color: [0.58, 0.88, 0.35]
            });
            drawText(venue.address || 'Uttara Metro Center, Sector 17, Dhaka', MARGIN, PAGE_H - 57, {
                font: 'F1',
                size: 8,
                color: [0.72, 0.78, 0.84]
            });
            const contactLine = [venue.phone, venue.email, venue.website].filter(Boolean).join('  |  ');
            drawText(contactLine, MARGIN, PAGE_H - 70, {
                font: 'F1',
                size: 8,
                color: [0.64, 0.71, 0.78]
            });
        }

        drawText(inv.docTypeLabel || 'OFFICIAL INVOICE', PAGE_W - MARGIN, PAGE_H - 27, {
            font: 'F2',
            size: isContinuation ? 10.5 : 12,
            color: [0.64, 0.94, 0.25],
            align: 'right'
        });
        drawText(`# ${inv.invoiceNumber || 'CMA-INV'}`, PAGE_W - MARGIN, PAGE_H - 43, {
            font: 'F3',
            size: 9.5,
            color: [1, 1, 1],
            align: 'right'
        });

        if (!isContinuation && inv.statusBadge) {
            const badgeText = pdfSafeText(inv.statusBadge);
            const pillW = Math.max(82, approxTextWidth(badgeText, 7.8, false, true) + 22);
            fillRect(PAGE_W - MARGIN - pillW, PAGE_H - 52, pillW, 18, badgeRgb);
            drawText(badgeText, PAGE_W - MARGIN - pillW / 2, PAGE_H - 64, {
                font: 'F2',
                size: 7.8,
                color: [1, 1, 1],
                align: 'center'
            });
        }

        y = PAGE_H - bannerH - 22;
    };

    const drawTableHeader = () => {
        const thH = 24;
        fillRect(MARGIN, y, CONTENT_W, thH, [0.08, 0.12, 0.16]);
        drawText('#', MARGIN + 10, y - 15.5, { font: 'F2', size: 8, color: [0.75, 0.82, 0.88] });
        drawText('DESCRIPTION & DETAILS', MARGIN + 30, y - 15.5, { font: 'F2', size: 8, color: [0.75, 0.82, 0.88] });
        drawText('QTY', MARGIN + 335, y - 15.5, { font: 'F2', size: 8, color: [0.75, 0.82, 0.88], align: 'right' });
        drawText('RATE', MARGIN + 420, y - 15.5, { font: 'F2', size: 8, color: [0.75, 0.82, 0.88], align: 'right' });
        drawText('AMOUNT', PAGE_W - MARGIN - 10, y - 15.5, { font: 'F2', size: 8, color: [0.64, 0.94, 0.25], align: 'right' });
        y -= thH;
    };

    const startNewPage = (withTableHeader = false) => {
        if (ops.length > 0) pages.push(ops.join('\n'));
        ops = [];
        drawPageHeader(pages.length > 0);
        if (withTableHeader) drawTableHeader();
    };

    startNewPage(false);

    const boxH = 78;
    const leftW = CONTENT_W * 0.56;
    const rightW = CONTENT_W * 0.41;
    const rightX = MARGIN + CONTENT_W - rightW;

    fillRect(MARGIN, y, leftW, boxH, [0.97, 0.98, 0.99]);
    strokeRect(MARGIN, y, leftW, boxH, [0.86, 0.90, 0.93]);
    drawText(inv.partyLabel || 'BILLED TO', MARGIN + 12, y - 15, { font: 'F2', size: 7.5, color: [0.06, 0.52, 0.36] });
    drawText(recipient.name || 'Customer', MARGIN + 12, y - 31, { font: 'F2', size: 11.5, color: [0.07, 0.1, 0.14] });
    let ry = y - 45;
    if (recipient.subtitle) {
        const subLines = wrapText(recipient.subtitle, 48).slice(0, 2);
        for (const sl of subLines) {
            drawText(sl, MARGIN + 12, ry, { font: 'F1', size: 8.3, color: [0.32, 0.38, 0.45] });
            ry -= 11;
        }
    }
    const contactParts = [recipient.phone, recipient.email].filter(Boolean).join('  |  ');
    if (contactParts && ry >= y - boxH + 8) {
        drawText(contactParts, MARGIN + 12, ry, { font: 'F3', size: 8.2, color: [0.22, 0.28, 0.35] });
    }

    fillRect(rightX, y, rightW, boxH, [0.97, 0.98, 0.99]);
    strokeRect(rightX, y, rightW, boxH, [0.86, 0.90, 0.93]);
    const metaRows = [
        ['Issue Date', inv.issueDate || '-'],
        ['Reference', inv.referenceCode || inv.invoiceNumber || '-'],
        ['Method', inv.paymentMethod || '-'],
        inv.transactionRef ? ['Txn / Note', String(inv.transactionRef).slice(0, 24)] : (inv.dueDate ? ['Due / Slot Date', inv.dueDate] : null)
    ].filter(Boolean);

    let my = y - 17;
    for (const [k, v] of metaRows) {
        drawText(k.toUpperCase(), rightX + 11, my, { font: 'F2', size: 7.3, color: [0.42, 0.48, 0.55] });
        drawText(String(v), rightX + rightW - 11, my, { font: 'F2', size: 8.3, color: [0.08, 0.12, 0.16], align: 'right' });
        my -= 16;
    }

    y -= boxH + 14;

    if (highlights.length > 0) {
        const stripH = 38;
        fillRect(MARGIN, y, CONTENT_W, stripH, [0.94, 0.98, 0.95]);
        strokeRect(MARGIN, y, CONTENT_W, stripH, [0.76, 0.90, 0.81]);
        const colW = CONTENT_W / highlights.length;
        highlights.forEach((h, idx) => {
            const hx = MARGIN + idx * colW + 10;
            if (idx > 0) {
                drawLine(MARGIN + idx * colW, y - 6, MARGIN + idx * colW, y - stripH + 6, [0.80, 0.90, 0.84], 0.5);
            }
            drawText(String(h.label || '').toUpperCase(), hx, y - 14, { font: 'F2', size: 7, color: [0.28, 0.45, 0.36] });
            drawText(String(h.value || '-').slice(0, 24), hx, y - 28, { font: 'F2', size: 8.6, color: [0.06, 0.14, 0.10] });
        });
        y -= stripH + 16;
    }

    drawTableHeader();

    items.forEach((it, index) => {
        const descLines = wrapText(it.description || 'Item', 52);
        const metaLines = it.meta ? wrapText(it.meta, 58).slice(0, 2) : [];
        const rowH = Math.max(28, 12 + descLines.length * 12 + metaLines.length * 10.5);

        if (y - rowH < 175) {
            startNewPage(true);
        }

        if (index % 2 === 1) {
            fillRect(MARGIN, y, CONTENT_W, rowH, [0.98, 0.985, 0.99]);
        }
        drawLine(MARGIN, y - rowH, PAGE_W - MARGIN, y - rowH, [0.89, 0.92, 0.95], 0.5);

        drawText(String(index + 1), MARGIN + 10, y - 16, { font: 'F1', size: 8.5, color: [0.42, 0.48, 0.55] });

        let ty = y - 15.5;
        for (const dl of descLines) {
            drawText(dl, MARGIN + 30, ty, { font: 'F2', size: 9, color: [0.08, 0.12, 0.16] });
            ty -= 12;
        }
        for (const ml of metaLines) {
            drawText(ml, MARGIN + 30, ty, { font: 'F1', size: 7.8, color: [0.40, 0.46, 0.53] });
            ty -= 10.5;
        }

        drawText(String(it.quantity ?? 1), MARGIN + 335, y - 16, { font: 'F3', size: 8.5, color: [0.18, 0.22, 0.28], align: 'right' });
        drawText(fmtBdtPdf(it.unitPrice), MARGIN + 420, y - 16, { font: 'F3', size: 8.5, color: [0.18, 0.22, 0.28], align: 'right' });
        drawText(fmtBdtPdf(it.amount), PAGE_W - MARGIN - 10, y - 16, { font: 'F3', size: 9, color: [0.06, 0.12, 0.16], align: 'right' });

        y -= rowH;
    });

    if (y < 210) {
        startNewPage(false);
    }

    y -= 14;
    const totalsW = 225;
    const totalsX = PAGE_W - MARGIN - totalsW;
    const notesW = CONTENT_W - totalsW - 18;
    let ty = y;

    const drawTotalRow = (label, valStr, { bold = false, highlight = false, color = [0.15, 0.20, 0.26] } = {}) => {
        if (highlight) {
            fillRect(totalsX, ty + 4, totalsW, 24, [0.06, 0.11, 0.15]);
            drawText(label, totalsX + 10, ty - 11.5, { font: 'F2', size: 9, color: [1, 1, 1] });
            drawText(valStr, totalsX + totalsW - 10, ty - 11.5, { font: 'F3', size: 10, color: [0.64, 0.94, 0.25], align: 'right' });
            ty -= 28;
        } else {
            drawText(label, totalsX + 8, ty - 10, { font: bold ? 'F2' : 'F1', size: 8.6, color });
            drawText(valStr, totalsX + totalsW - 8, ty - 10, { font: 'F3', size: bold ? 9.2 : 8.6, color, align: 'right' });
            drawLine(totalsX, ty - 15, totalsX + totalsW, ty - 15, [0.90, 0.93, 0.95], 0.5);
            ty -= 19;
        }
    };

    drawTotalRow('Subtotal', fmtBdtPdf(inv.subtotal ?? inv.totalAmount));
    if (Number(inv.discount) > 0) {
        drawTotalRow('Discount', `-${fmtBdtPdf(inv.discount)}`, { color: [0.06, 0.55, 0.38] });
    }
    if (Number(inv.tax) > 0) {
        drawTotalRow('VAT / Tax', fmtBdtPdf(inv.tax));
    }
    drawTotalRow('Total Amount', fmtBdtPdf(inv.totalAmount), { highlight: true });
    drawTotalRow(inv.paidLabel || 'Amount Paid', fmtBdtPdf(inv.paidAmount), { bold: true, color: [0.05, 0.52, 0.35] });
    drawTotalRow(
        inv.dueLabel || 'Balance Due',
        fmtBdtPdf(inv.dueAmount),
        { bold: true, color: Number(inv.dueAmount) > 0 ? [0.78, 0.45, 0.04] : [0.35, 0.42, 0.48] }
    );

    let ny = y - 10;
    if (inv.transactionRef) {
        drawText('TRANSACTION / REFERENCE', MARGIN, ny, { font: 'F2', size: 7.5, color: [0.38, 0.44, 0.51] });
        ny -= 12;
        drawText(String(inv.transactionRef).slice(0, 52), MARGIN, ny, { font: 'F3', size: 8.5, color: [0.10, 0.14, 0.18] });
        ny -= 18;
    }
    if (inv.notes) {
        drawText('NOTES & TERMS', MARGIN, ny, { font: 'F2', size: 7.5, color: [0.38, 0.44, 0.51] });
        ny -= 12;
        const noteLines = wrapText(inv.notes, Math.max(36, Math.floor(notesW / 4.8))).slice(0, 4);
        for (const nl of noteLines) {
            drawText(nl, MARGIN, ny, { font: 'F1', size: 8, color: [0.32, 0.38, 0.45] });
            ny -= 11;
        }
    }

    const footerY = 58;
    drawLine(MARGIN + 360, footerY + 26, PAGE_W - MARGIN, footerY + 26, [0.72, 0.78, 0.84], 0.7);
    drawText(inv.authorizedBy || 'Authorized Arena Signatory', PAGE_W - MARGIN, footerY + 14, {
        font: 'F2',
        size: 8,
        color: [0.22, 0.28, 0.35],
        align: 'right'
    });
    drawText('Authorized Signature / Issued By', PAGE_W - MARGIN, footerY + 4, {
        font: 'F1',
        size: 7.2,
        color: [0.48, 0.54, 0.60],
        align: 'right'
    });

    drawLine(MARGIN, footerY - 8, PAGE_W - MARGIN, footerY - 8, [0.88, 0.91, 0.94], 0.6);
    drawText(
        `Computer-generated official document from ${venue.name || 'Crossbar Metro Arena'} (${venue.website || 'bookcrossbar.com'}).`,
        MARGIN,
        footerY - 21,
        { font: 'F1', size: 7.4, color: [0.48, 0.54, 0.60] }
    );

    pages.push(ops.join('\n'));

    return assemblePdf(pages, PAGE_W, PAGE_H);
}

function wrapByWidth(text, size, bold, maxW) {
    const words = pdfSafeText(text).split(' ').filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
        const cand = cur ? `${cur} ${w}` : w;
        if (approxTextWidth(cand, size, false, bold) <= maxW || !cur) cur = cand;
        else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
}

/**
 * 2nd Invoice — Exact Image-Matched Crossbar Metro Arena Serrated POS / Token Receipt PDF!
 * Features:
 *   - Top & bottom serrated zigzag paper edges
 *   - Vector soccer-ball & forest-green swoosh emblem + bold title + italic tagline + centered address
 *   - Dark forest-green (#173a22) rounded "TOKEN / PAYMENT INVOICE" banner
 *   - Centered receipt code + outlined rounded status stamp (FAILED / PAID / ADVANCE PAID / PENDING)
 *   - Dotted horizontal dividers & colon-aligned Key : Value metadata blocks
 *   - Forest-green 5-column item bar (#, DESCRIPTION & DETAILS, QTY, RATE, AMOUNT) with BDT formatting
 *   - Subtotal + Forest-green rounded "Total Amount" pill bar
 *   - Colon-aligned Amount Verified & Unsettled Amount rows, Transaction/Reference, and italic footer
 */
export function generateReceiptPdfBytes(invoice) {
    const inv = invoice || {};
    const venue = inv.venue || {};
    const tf = extractTokenSlipFields(inv);
    const items = Array.isArray(inv.items) && inv.items.length
        ? inv.items
        : [{ description: 'Turf Booking Payment', quantity: 1, unitPrice: inv.totalAmount || 0, amount: inv.totalAmount || 0 }];

    const W = 286;          // ~101mm outer frame so 88mm paper sits with crisp serrated edges visible
    const PAPER_X = 10;
    const PAPER_W = W - 20; // 266pt paper width
    const M = PAPER_X + 14; // 24pt content left
    const RIGHT = PAPER_X + PAPER_W - 14; // 262pt content right
    const CW = RIGHT - M;   // 238pt content width
    const TOP = 2200;

    const f = (n) => Number(n).toFixed(2);
    const bodyOps = [];
    let y = TOP - 26;

    const forest = [0.09, 0.23, 0.13]; // #173a22
    const ink = [0.06, 0.09, 0.08];
    const mute = [0.22, 0.26, 0.24];

    const roundedRectPath = (x, topY, w, h, r) => {
        const rad = Math.min(r, w / 2, h / 2);
        const k = 0.55228475 * rad;
        const yb = topY - h;
        const xr = x + w;
        return [
            `${f(x + rad)} ${f(yb)} m`,
            `${f(xr - rad)} ${f(yb)} l`,
            `${f(xr - rad + k)} ${f(yb)} ${f(xr)} ${f(yb + rad - k)} ${f(xr)} ${f(yb + rad)} c`,
            `${f(xr)} ${f(topY - rad)} l`,
            `${f(xr)} ${f(topY - rad + k)} ${f(xr - rad + k)} ${f(topY)} ${f(xr - rad)} ${f(topY)} c`,
            `${f(x + rad)} ${f(topY)} l`,
            `${f(x + rad - k)} ${f(topY)} ${f(x)} ${f(topY - rad + k)} ${f(x)} ${f(topY - rad)} c`,
            `${f(x)} ${f(yb + rad)} l`,
            `${f(x)} ${f(yb + rad - k)} ${f(x + rad - k)} ${f(yb)} ${f(x + rad)} ${f(yb)} c`,
            'h'
        ].join(' ');
    };

    const fillRounded = (x, topY, w, h, r, rgb) => {
        bodyOps.push(`${f(rgb[0])} ${f(rgb[1])} ${f(rgb[2])} rg`, roundedRectPath(x, topY, w, h, r), 'f');
    };

    const strokeRounded = (x, topY, w, h, r, strokeRgb, fillRgb = null, lineW = 1.6) => {
        bodyOps.push(`${f(lineW)} w`, `${f(strokeRgb[0])} ${f(strokeRgb[1])} ${f(strokeRgb[2])} RG`);
        if (fillRgb) {
            bodyOps.push(`${f(fillRgb[0])} ${f(fillRgb[1])} ${f(fillRgb[2])} rg`, roundedRectPath(x, topY, w, h, r), 'B');
        } else {
            bodyOps.push(roundedRectPath(x, topY, w, h, r), 'S');
        }
    };

    const text = (str, x, baseY, { font = 'F1', size = 8.5, color = ink, align = 'left' } = {}) => {
        const clean = escapePdfString(str);
        if (!clean) return;
        const isBold = font === 'F2' || font === 'F3';
        const w = approxTextWidth(str, size, false, isBold);
        const dx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
        bodyOps.push(
            'BT',
            `/${font} ${f(size)} Tf`,
            `${f(color[0])} ${f(color[1])} ${f(color[2])} rg`,
            `1 0 0 1 ${f(dx)} ${f(baseY)} Tm`,
            `(${clean}) Tj`,
            'ET'
        );
    };

    const center = (str, opt = {}) => text(str, W / 2, y, { ...opt, align: 'center' });

    const solidGreenRule = () => {
        bodyOps.push('1.5 w', `${f(forest[0])} ${f(forest[1])} ${f(forest[2])} RG`, `${f(M)} ${f(y)} m ${f(RIGHT)} ${f(y)} l S`);
        y -= 9;
    };

    const dotted = () => {
        bodyOps.push('0.9 w', '0.18 0.21 0.19 RG', '[1.1 2.2] 0 d', `${f(M)} ${f(y)} m ${f(RIGHT)} ${f(y)} l S`, '[] 0 d');
        y -= 11;
    };

    const drawSoccerCrest = (cx, cy, r) => {
        const k = 0.55228475 * r;
        // Left dynamic forest-green swoosh arc + wedge
        bodyOps.push(
            `${f(forest[0])} ${f(forest[1])} ${f(forest[2])} rg`,
            `${f(cx - r * 1.48)} ${f(cy - r * 0.78)} m`,
            `${f(cx - r * 1.15)} ${f(cy - r * 0.05)} ${f(cx - r * 0.85)} ${f(cy + r * 0.65)} ${f(cx - r * 0.25)} ${f(cy + r * 0.92)} c`,
            `${f(cx - r * 0.62)} ${f(cy + r * 0.35)} ${f(cx - r * 0.78)} ${f(cy - r * 0.25)} ${f(cx - r * 0.72)} ${f(cy - r * 0.78)} c`,
            'h f'
        );
        // Outer white soccer ball circle + dark border
        bodyOps.push(
            '1 1 1 rg',
            `${f(forest[0])} ${f(forest[1])} ${f(forest[2])} RG`,
            '1.2 w',
            `${f(cx + r)} ${f(cy)} m`,
            `${f(cx + r)} ${f(cy + k)} ${f(cx + k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c`,
            `${f(cx - k)} ${f(cy + r)} ${f(cx - r)} ${f(cy + k)} ${f(cx - r)} ${f(cy)} c`,
            `${f(cx - r)} ${f(cy - k)} ${f(cx - k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c`,
            `${f(cx + k)} ${f(cy - r)} ${f(cx + r)} ${f(cy - k)} ${f(cx + r)} ${f(cy)} c`,
            'B'
        );
        // Center pentagon + outer patches + seams
        const pts = [];
        for (let i = 0; i < 5; i++) {
            const ang = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
            pts.push([cx + Math.cos(ang) * (r * 0.38), cy + Math.sin(ang) * (r * 0.38)]);
        }
        bodyOps.push('0.08 0.14 0.10 rg', `${f(pts[0][0])} ${f(pts[0][1])} m`);
        for (let i = 1; i < 5; i++) bodyOps.push(`${f(pts[i][0])} ${f(pts[i][1])} l`);
        bodyOps.push('h f');

        bodyOps.push('0.75 w', '0.08 0.14 0.10 RG');
        for (let i = 0; i < 5; i++) {
            const ang = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
            const ox = cx + Math.cos(ang) * (r * 0.92);
            const oy = cy + Math.sin(ang) * (r * 0.92);
            bodyOps.push(`${f(pts[i][0])} ${f(pts[i][1])} m ${f(ox)} ${f(oy)} l S`);
            // Small dark edge patch at rim
            const a1 = ang - 0.22;
            const a2 = ang + 0.22;
            bodyOps.push(
                '0.08 0.14 0.10 rg',
                `${f(cx + Math.cos(ang) * (r * 0.72))} ${f(cy + Math.sin(ang) * (r * 0.72))} m`,
                `${f(cx + Math.cos(a1) * (r * 0.97))} ${f(cy + Math.sin(a1) * (r * 0.97))} l`,
                `${f(cx + Math.cos(a2) * (r * 0.97))} ${f(cy + Math.sin(a2) * (r * 0.97))} l`,
                'h f'
            );
        }
    };

    const colonRow = (label, valStr, colonX = M + 74) => {
        text(label, M, y, { font: 'F2', size: 8.5, color: ink });
        text(':', colonX, y, { font: 'F2', size: 8.5, color: ink });
        const valX = colonX + 9;
        const maxW = RIGHT - valX;
        const lines = wrapByWidth(String(valStr || '-'), 8.5, false, maxW);
        (lines.length ? lines : ['-']).forEach((ln, idx) => {
            text(ln, valX, y - idx * 10.5, { font: 'F1', size: 8.5, color: ink });
        });
        y -= Math.max(1, lines.length) * 11 + 2;
    };

    // ---- 1. Brand Header (Soccer Crest + Bold Name + Italic Tagline + Centered Address) ----
    drawSoccerCrest(M + 25, y - 9, 13.5);
    text(venue.name || 'Crossbar Metro Arena', M + 45, y - 5, { font: 'F2', size: 14, color: ink });
    text(venue.tagline || "Dhaka's Premier Floodlit Outdoor Turf", M + 45, y - 17.5, { font: 'F4', size: 8, color: mute });
    y -= 31;

    for (const addrLine of wrapByWidth(venue.address || 'Uttara Metro Center, Sector 17, Dhaka, Bangladesh, 1230', 7.4, false, CW)) {
        center(addrLine, { font: 'F1', size: 7.4, color: ink });
        y -= 9.5;
    }
    y -= 2;
    solidGreenRule();

    // ---- 2. Dark Forest-Green Pill Banner ("TOKEN / PAYMENT INVOICE") ----
    fillRounded(M, y + 2, CW, 21, 4.5, forest);
    text(tf.bannerTitle, W / 2, y - 12.5, { font: 'F2', size: 9.8, color: [1, 1, 1], align: 'center' });
    y -= 32;

    // ---- 3. Centered Invoice/Receipt Number + Outlined Status Stamp ----
    center(inv.invoiceNumber || 'RCPT-CMA', { font: 'F2', size: 11, color: ink });
    y -= 8;

    const stampLabel = pdfSafeText(inv.statusBadge || 'ISSUED');
    const stampColor = TONE_RGB[inv.statusTone] || TONE_RGB.emerald;
    const stampTint = [
        1 - (1 - stampColor[0]) * 0.06,
        1 - (1 - stampColor[1]) * 0.06,
        1 - (1 - stampColor[2]) * 0.06
    ];
    const stampW = Math.max(96, approxTextWidth(stampLabel, 13, false, true) + 28);
    strokeRounded((W - stampW) / 2, y, stampW, 25, 4.5, stampColor, stampTint, 1.5);
    text(stampLabel, W / 2, y - 17.5, { font: 'F2', size: 13, color: stampColor, align: 'center' });
    y -= 34;

    dotted();

    // ---- 4. Colon-Aligned Party & Reference Block ----
    colonRow(tf.partyRowLabel, tf.partyName);
    colonRow(tf.squadLabel, tf.squadValue);
    colonRow('Phone', tf.phone);
    colonRow('Issue Date', tf.issueDate);
    colonRow('Reference', tf.reference);
    colonRow('Method', tf.method);
    y -= 2;
    dotted();

    // ---- 5. Colon-Aligned Booking Date & Slot Block ----
    colonRow(tf.dateRowLabel, tf.dateRowValue);
    colonRow(tf.slotRowLabel, tf.slotRowValue);
    y -= 3;

    // ---- 6. Forest-Green 5-Column Compact Table ----
    fillRounded(M, y + 2, CW, 17, 3, forest);
    text('#', M + 6, y - 9.5, { font: 'F2', size: 6.8, color: [1, 1, 1] });
    text('DESCRIPTION & DETAILS', M + 18, y - 9.5, { font: 'F2', size: 6.8, color: [1, 1, 1] });
    text('QTY', M + 131, y - 9.5, { font: 'F2', size: 6.8, color: [1, 1, 1], align: 'center' });
    text('RATE', M + 178, y - 9.5, { font: 'F2', size: 6.8, color: [1, 1, 1], align: 'right' });
    text('AMOUNT', RIGHT - 5, y - 9.5, { font: 'F2', size: 6.8, color: [1, 1, 1], align: 'right' });
    y -= 27;

    items.forEach((it, idx) => {
        const descLines = wrapByWidth(it.description || 'Item', 8, false, 102);
        text(String(idx + 1), M + 6, y, { font: 'F1', size: 8, color: ink });
        descLines.forEach((dl, li) => text(dl, M + 18, y - li * 10, { font: 'F1', size: 8, color: ink }));
        text(String(it.quantity ?? 1), M + 131, y, { font: 'F1', size: 8, color: ink, align: 'center' });
        text(fmtBdtPdf(it.unitPrice), M + 178, y, { font: 'F1', size: 7.8, color: ink, align: 'right' });
        text(fmtBdtPdf(it.amount), RIGHT - 4, y, { font: 'F2', size: 7.8, color: ink, align: 'right' });
        y -= Math.max(1, descLines.length) * 10 + 4;
    });

    dotted();

    // ---- 7. Subtotal + Dark Forest-Green "Total Amount" Pill Bar ----
    text('Subtotal', M + 2, y, { font: 'F1', size: 9, color: ink });
    text(fmtBdtPdf(inv.subtotal ?? inv.totalAmount), RIGHT - 2, y, { font: 'F2', size: 9.2, color: ink, align: 'right' });
    y -= 10;

    if (Number(inv.discount) > 0) {
        text('Discount', M + 2, y - 4, { font: 'F1', size: 8.2, color: forest });
        text(`-${fmtBdtPdf(inv.discount)}`, RIGHT - 2, y - 4, { font: 'F2', size: 8.2, color: forest, align: 'right' });
        y -= 13;
    }

    fillRounded(M, y, CW, 23, 4.5, forest);
    text('Total Amount', M + 9, y - 15.5, { font: 'F2', size: 10.8, color: [1, 1, 1] });
    text(fmtBdtPdf(inv.totalAmount), RIGHT - 9, y - 15.5, { font: 'F2', size: 11, color: [1, 1, 1], align: 'right' });
    y -= 31;

    dotted();

    // ---- 8. Verification / Settlement Rows (Colon-Aligned + Right BDT) ----
    const verifyColonX = M + 96;
    text(tf.paidLabel, M + 2, y, { font: 'F1', size: 8.5, color: ink });
    text(':', verifyColonX, y, { font: 'F2', size: 8.5, color: ink });
    text(fmtBdtPdf(inv.paidAmount), RIGHT - 2, y, { font: 'F2', size: 8.5, color: ink, align: 'right' });
    y -= 13;

    text(tf.dueLabel, M + 2, y, { font: 'F1', size: 8.5, color: ink });
    text(':', verifyColonX, y, { font: 'F2', size: 8.5, color: ink });
    text(fmtBdtPdf(inv.dueAmount), RIGHT - 2, y, { font: 'F2', size: 8.5, color: ink, align: 'right' });
    y -= 9;

    dotted();

    // ---- 9. Transaction / Reference ----
    text('Transaction / Reference :', M + 2, y, { font: 'F1', size: 8.2, color: ink });
    y -= 11.5;
    const txnStr = inv.transactionRef || inv.referenceCode || inv.invoiceNumber || '-';
    for (const tl of wrapByWidth(txnStr, 8.2, false, CW - 4)) {
        text(tl, M + 2, y, { font: 'F1', size: 8.2, color: ink });
        y -= 10.5;
    }
    y -= 2;

    dotted();

    // ---- 10. Italic Footer + Solid Forest-Green Line ----
    for (const nl of wrapByWidth(tf.shortNote, 8, false, CW - 8).slice(0, 2)) {
        center(nl, { font: 'F4', size: 8, color: ink });
        y -= 10.5;
    }
    center('Computer-generated receipt', { font: 'F4', size: 8, color: ink });
    y -= 9;

    bodyOps.push('1.5 w', `${f(forest[0])} ${f(forest[1])} ${f(forest[2])} RG`, `${f(M)} ${f(y)} m ${f(RIGHT)} ${f(y)} l S`);
    y -= 18;

    // ---- Assemble Paper Background + Serrated Top & Bottom Zigzag Edges ----
    const paperTop = TOP - 8;
    const paperBottom = y + 6;
    const pageH = TOP - paperBottom + 8;
    const toothW = 6.65;
    const toothH = 4.8;
    const teethCount = Math.round(PAPER_W / toothW);
    const stepW = PAPER_W / teethCount;

    const bgOps = [];
    // Soft gray outer backdrop so the white serrated slip pops
    bgOps.push('0.91 0.91 0.90 rg', `0 0 ${f(W)} ${f(TOP + 20)} re f`);
    // Serrated paper polygon
    bgOps.push('0.976 0.978 0.973 rg', '0.82 0.84 0.81 RG', '0.4 w');
    bgOps.push(`${f(PAPER_X)} ${f(paperTop - toothH)} m`);
    for (let i = 0; i < teethCount; i++) {
        const xMid = PAPER_X + (i + 0.5) * stepW;
        const xEnd = PAPER_X + (i + 1) * stepW;
        bgOps.push(`${f(xMid)} ${f(paperTop)} l`, `${f(xEnd)} ${f(paperTop - toothH)} l`);
    }
    bgOps.push(`${f(PAPER_X + PAPER_W)} ${f(paperBottom + toothH)} l`);
    for (let i = teethCount - 1; i >= 0; i--) {
        const xMid = PAPER_X + (i + 0.5) * stepW;
        const xStart = PAPER_X + i * stepW;
        bgOps.push(`${f(xMid)} ${f(paperBottom)} l`, `${f(xStart)} ${f(paperBottom + toothH)} l`);
    }
    bgOps.push('h B');

    const stream = [`q 1 0 0 1 0 ${f(pageH - TOP)} cm`, ...bgOps, ...bodyOps, 'Q'].join('\n');
    return assemblePdf([stream], W, pageH);
}

export function buildInvoiceFilename(invoice, options = {}) {
    const useToken = shouldUseTokenFormat(invoice, options);
    const raw = String(invoice?.invoiceNumber || invoice?.referenceCode || 'Crossbar_Invoice')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
    const base = raw || 'Crossbar_Invoice';
    if (useToken && !/^(RCPT|TKN)/i.test(base)) {
        return `${base}_Token.pdf`;
    }
    return `${base}.pdf`;
}

/** Browser 1-click PDF download (`options.format`: `'a4'` | `'token'`). */
export function downloadInvoicePdf(invoice, options = {}) {
    if (typeof window === 'undefined') return false;
    const bytes = generateInvoicePdfBytes(invoice, options);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildInvoiceFilename(invoice, options);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const SOCCER_LOGO_SVG = `<svg width="46" height="38" viewBox="0 0 56 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
  <path d="M2 39C7 23 15 9 31 5C21 14 17 26 17 39H2Z" fill="#173a22"/>
  <path d="M5 21C9 11 18 5 29 4C20 9 13 15 9 24L5 21Z" fill="#173a22"/>
  <circle cx="35" cy="23" r="18" fill="#ffffff" stroke="#173a22" stroke-width="2"/>
  <polygon points="35,14 43,20 40,29 30,29 27,20" fill="#122618"/>
  <line x1="35" y1="14" x2="35" y2="5" stroke="#122618" stroke-width="1.6"/>
  <line x1="43" y1="20" x2="52" y2="17" stroke="#122618" stroke-width="1.6"/>
  <line x1="40" y1="29" x2="46" y2="37" stroke="#122618" stroke-width="1.6"/>
  <line x1="30" y1="29" x2="24" y2="37" stroke="#122618" stroke-width="1.6"/>
  <line x1="27" y1="20" x2="18" y2="17" stroke="#122618" stroke-width="1.6"/>
  <polygon points="31,6 39,6 35,9" fill="#122618"/>
  <polygon points="50,13 53,21 49,18" fill="#122618"/>
  <polygon points="48,34 42,40 44,35" fill="#122618"/>
  <polygon points="22,34 28,40 26,35" fill="#122618"/>
  <polygon points="20,13 17,21 21,18" fill="#122618"/>
</svg>`;

function buildReceiptHtml(inv) {
    const venue = inv.venue || {};
    const tf = extractTokenSlipFields(inv);
    const items = Array.isArray(inv.items) && inv.items.length
        ? inv.items
        : [{ description: 'Turf Booking Payment', quantity: 1, unitPrice: inv.totalAmount || 0, amount: inv.totalAmount || 0 }];

    const stampColors = {
        rose: { border: '#c22629', text: '#c22629', bg: 'rgba(194,38,41,0.05)' },
        emerald: { border: '#166534', text: '#166534', bg: 'rgba(22,101,52,0.05)' },
        amber: { border: '#b45309', text: '#b45309', bg: 'rgba(180,83,9,0.05)' },
        violet: { border: '#6d28d9', text: '#6d28d9', bg: 'rgba(109,40,217,0.05)' },
        sky: { border: '#0369a1', text: '#0369a1', bg: 'rgba(3,105,161,0.05)' }
    };
    const sc = stampColors[inv.statusTone] || stampColors.emerald;
    const colonRow = (k, v) => `<div class="crow"><span class="ck">${escapeHtml(k)}</span><span class="cc">:</span><span class="cv">${escapeHtml(v)}</span></div>`;

    return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(inv.invoiceNumber || 'Token Invoice')}</title>
<style>
@page { size: 80mm auto; margin: 3mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #e8eae7; color: #0f1712; padding: 12px 0; font-size: 12px; line-height: 1.42; font-variant-numeric: tabular-nums; }
.slip { width: 340px; max-width: 100%; margin: 0 auto; background: #f9faf8; box-shadow: 0 8px 24px rgba(0,0,0,0.14); overflow: hidden; }
.zigzag-top, .zigzag-bot { display: block; width: 100%; height: 8px; }
.inner { padding: 10px 18px 12px; }
.hdr { display: flex; align-items: center; justify-content: center; gap: 8px; }
.bname { font-size: 20px; font-weight: 900; letter-spacing: -0.01em; color: #0b140e; line-height: 1.1; }
.tag { font-style: italic; font-size: 11.5px; color: #1c2620; margin-top: 2px; }
.addr { text-align: center; font-size: 10.5px; color: #111827; margin-top: 6px; }
.gline { border: 0; border-top: 2px solid #173a22; margin: 8px 0; }
.gbanner { background: #173a22; color: #fff; text-align: center; font-weight: 800; font-size: 13.5px; letter-spacing: 0.04em; padding: 6px 10px; border-radius: 6px; text-transform: uppercase; }
.code { text-align: center; font-weight: 800; font-size: 15px; color: #0b140e; margin-top: 7px; letter-spacing: 0.02em; }
.stamp { margin: 6px auto 10px; width: fit-content; min-width: 132px; padding: 3px 18px; border: 2px solid ${sc.border}; color: ${sc.text}; background: ${sc.bg}; border-radius: 6px; text-align: center; font-size: 19px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }
.dots { border: 0; border-top: 1.5px dotted #262626; margin: 8px 0; }
.crow { display: grid; grid-template-columns: 104px 12px 1fr; align-items: baseline; padding: 1.5px 0; font-size: 12px; }
.ck { font-weight: 700; color: #0f1712; }
.cc { font-weight: 700; text-align: center; }
.cv { font-weight: 600; color: #111827; word-break: break-word; }
.tbl-hd { background: #173a22; color: #fff; border-radius: 4px; padding: 5px 7px; display: grid; grid-template-columns: 18px 1fr 28px 66px 68px; gap: 4px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; margin-top: 6px; }
.tbl-row { padding: 6px 7px 2px; display: grid; grid-template-columns: 18px 1fr 28px 66px 68px; gap: 4px; font-size: 11px; align-items: baseline; }
.r { text-align: right; } .c { text-align: center; }
.subrow { display: flex; justify-content: space-between; align-items: baseline; padding: 2px 2px 6px; font-size: 12.5px; }
.totbar { background: #173a22; color: #fff; border-radius: 6px; padding: 7px 12px; display: flex; justify-content: space-between; align-items: baseline; font-size: 15px; font-weight: 900; }
.vrow { display: grid; grid-template-columns: 130px 12px 1fr; align-items: baseline; padding: 2px 2px; font-size: 12px; }
.vrow .val { text-align: right; font-weight: 700; }
.txn-lbl { font-size: 11.5px; font-weight: 600; color: #111827; }
.txn-val { font-size: 11.5px; font-weight: 600; color: #0f1712; word-break: break-all; margin-top: 2px; }
.ft { text-align: center; font-style: italic; font-size: 11.5px; color: #111827; line-height: 1.45; }
@media print { body { background: #fff; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .slip { box-shadow: none; width: 74mm; background: #fff; } }
</style></head><body>
<div class="slip">
  <svg class="zigzag-top" viewBox="0 0 340 10" preserveAspectRatio="none"><polygon fill="#e8eae7" points="0,0 340,0 340,10 330,2 320,10 310,2 300,10 290,2 280,10 270,2 260,10 250,2 240,10 230,2 220,10 210,2 200,10 190,2 180,10 170,2 160,10 150,2 140,10 130,2 120,10 110,2 100,10 90,2 80,10 70,2 60,10 50,2 40,10 30,2 20,10 10,2 0,10"/></svg>
  <div class="inner">
    <div class="hdr">
      ${SOCCER_LOGO_SVG}
      <div>
        <div class="bname">${escapeHtml(venue.name || 'Crossbar Metro Arena')}</div>
        <div class="tag">${escapeHtml(venue.tagline || "Dhaka's Premier Floodlit Outdoor Turf")}</div>
      </div>
    </div>
    <div class="addr">${escapeHtml(venue.address || 'Uttara Metro Center, Sector 17, Dhaka, Bangladesh, 1230')}</div>
    <hr class="gline"/>
    <div class="gbanner">${escapeHtml(tf.bannerTitle)}</div>
    <div class="code">${escapeHtml(inv.invoiceNumber || '')}</div>
    <div class="stamp">${escapeHtml(inv.statusBadge || 'ISSUED')}</div>
    <hr class="dots"/>
    ${colonRow(tf.partyRowLabel, tf.partyName)}
    ${colonRow(tf.squadLabel, tf.squadValue)}
    ${colonRow('Phone', tf.phone)}
    ${colonRow('Issue Date', tf.issueDate)}
    ${colonRow('Reference', tf.reference)}
    ${colonRow('Method', tf.method)}
    <hr class="dots"/>
    ${colonRow(tf.dateRowLabel, tf.dateRowValue)}
    ${colonRow(tf.slotRowLabel, tf.slotRowValue)}
    <div class="tbl-hd"><span>#</span><span>DESCRIPTION &amp; DETAILS</span><span class="c">QTY</span><span class="r">RATE</span><span class="r">AMOUNT</span></div>
    ${items.map((it, i) => `<div class="tbl-row"><span>${i + 1}</span><span>${escapeHtml(it.description)}</span><span class="c">${escapeHtml(it.quantity ?? 1)}</span><span class="r">${escapeHtml(fmtBdtPdf(it.unitPrice))}</span><span class="r"><strong>${escapeHtml(fmtBdtPdf(it.amount))}</strong></span></div>`).join('')}
    <hr class="dots"/>
    <div class="subrow"><span>Subtotal</span><strong>${escapeHtml(fmtBdtPdf(inv.subtotal ?? inv.totalAmount))}</strong></div>
    <div class="totbar"><span>Total Amount</span><span>${escapeHtml(fmtBdtPdf(inv.totalAmount))}</span></div>
    <hr class="dots"/>
    <div class="vrow"><span>${escapeHtml(tf.paidLabel)}</span><span class="cc">:</span><span class="val">${escapeHtml(fmtBdtPdf(inv.paidAmount))}</span></div>
    <div class="vrow"><span>${escapeHtml(tf.dueLabel)}</span><span class="cc">:</span><span class="val">${escapeHtml(fmtBdtPdf(inv.dueAmount))}</span></div>
    <hr class="dots"/>
    <div class="txn-lbl">Transaction / Reference :</div>
    <div class="txn-val">${escapeHtml(inv.transactionRef || inv.referenceCode || inv.invoiceNumber || '—')}</div>
    <hr class="dots"/>
    <div class="ft">
      <div>${escapeHtml(tf.shortNote)}</div>
      <div>Computer-generated receipt</div>
    </div>
    <hr class="gline" style="margin-bottom:2px"/>
  </div>
  <svg class="zigzag-bot" viewBox="0 0 340 10" preserveAspectRatio="none"><polygon fill="#e8eae7" points="0,10 340,10 340,0 330,8 320,0 310,8 300,0 290,8 280,0 270,8 260,0 250,8 240,0 230,8 220,0 210,8 200,0 190,8 180,0 170,8 160,0 150,8 140,0 130,8 120,0 110,8 100,0 90,8 80,0 70,8 60,0 50,8 40,0 30,8 20,0 10,8 0,0"/></svg>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},150);};</script></body></html>`;
}

/** Opens a crisp print-ready A4 invoice sheet OR 80mm POS Token Slip in the browser print dialog. */
export function printInvoiceDocument(invoice, options = {}) {
    if (typeof window === 'undefined') return;
    const inv = invoice || {};
    const useToken = shouldUseTokenFormat(inv, options);
    const venue = inv.venue || {};
    const recipient = inv.recipient || {};
    const items = Array.isArray(inv.items) ? inv.items : [];
    const highlights = Array.isArray(inv.highlights) ? inv.highlights : [];

    const html = useToken ? buildReceiptHtml(inv) : `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(inv.invoiceNumber || 'Invoice')} — ${escapeHtml(venue.name || 'Crossbar Metro Arena')}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background: #fff; padding: 28px; font-size: 12px; line-height: 1.45; }
  .sheet { max-width: 780px; margin: 0 auto; }
  .banner { background: #0b1117; color: #fff; padding: 22px 26px; border-radius: 14px; border-bottom: 4px solid #84cc16; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .brand { font-size: 20px; font-weight: 900; letter-spacing: 0.02em; }
  .tagline { color: #a3e635; font-size: 11px; font-weight: 700; margin-top: 2px; }
  .meta-line { color: #cbd5e1; font-size: 11px; margin-top: 4px; }
  .doc-type { color: #a3e635; font-size: 13px; font-weight: 800; text-align: right; letter-spacing: 0.06em; }
  .inv-no { font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 700; text-align: right; margin-top: 4px; }
  .badge { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 999px; background: #10b981; color: #052e16; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; }
  .grid2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-top: 18px; }
  .box { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 12px; padding: 14px 16px; }
  .eyebrow { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; color: #059669; text-transform: uppercase; }
  .party-name { font-size: 15px; font-weight: 800; margin-top: 4px; color: #0f172a; }
  .sub { font-size: 11.5px; color: #475569; margin-top: 3px; }
  .kv { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11.5px; }
  .kv span:first-child { color: #64748b; font-weight: 600; }
  .kv span:last-child { font-weight: 700; font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-variant-numeric: tabular-nums; }
  .strip { display: grid; grid-template-columns: repeat(${Math.max(1, highlights.length)}, 1fr); gap: 10px; margin-top: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 14px; }
  .strip-label { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #15803d; }
  .strip-val { font-size: 12px; font-weight: 800; color: #052e16; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #0f172a; color: #e2e8f0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 9px 10px; text-align: left; }
  th.num, td.num { text-align: right; font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-variant-numeric: tabular-nums; }
  td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .item-title { font-weight: 700; color: #0f172a; }
  .item-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
  .bottom { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-top: 18px; align-items: start; }
  .totals { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .trow { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  .trow.grand { background: #0f172a; color: #fff; font-weight: 800; font-size: 13px; }
  .trow.grand span:last-child { color: #a3e635; }
  .trow .mono { font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-variant-numeric: tabular-nums; font-weight: 700; }
  .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; color: #64748b; font-size: 11px; }
  .sig { text-align: right; }
  .sig-line { border-top: 1px solid #94a3b8; padding-top: 5px; min-width: 190px; font-weight: 700; color: #1e293b; }
  @media print { body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="banner">
      <div>
        <div class="brand">${escapeHtml(venue.name || 'Crossbar Metro Arena')}</div>
        <div class="tagline">${escapeHtml(venue.tagline || '')}</div>
        <div class="meta-line">${escapeHtml(venue.address || '')}</div>
        <div class="meta-line">${escapeHtml([venue.phone, venue.email, venue.website].filter(Boolean).join(' · '))}</div>
      </div>
      <div style="text-align:right">
        <div class="doc-type">${escapeHtml(inv.docTypeLabel || 'OFFICIAL INVOICE')}</div>
        <div class="inv-no"># ${escapeHtml(inv.invoiceNumber || '')}</div>
        <div class="badge">${escapeHtml(inv.statusBadge || 'ISSUED')}</div>
      </div>
    </div>

    <div class="grid2">
      <div class="box">
        <div class="eyebrow">${escapeHtml(inv.partyLabel || 'BILLED TO')}</div>
        <div class="party-name">${escapeHtml(recipient.name || '—')}</div>
        ${recipient.subtitle ? `<div class="sub">${escapeHtml(recipient.subtitle)}</div>` : ''}
        ${recipient.phone || recipient.email ? `<div class="sub" style="font-variant-numeric:tabular-nums">${escapeHtml([recipient.phone, recipient.email].filter(Boolean).join(' · '))}</div>` : ''}
      </div>
      <div class="box">
        <div class="kv"><span>Issue Date</span><span>${escapeHtml(inv.issueDate || '—')}</span></div>
        <div class="kv"><span>Reference</span><span>${escapeHtml(inv.referenceCode || inv.invoiceNumber || '—')}</span></div>
        <div class="kv"><span>Payment Method</span><span>${escapeHtml(inv.paymentMethod || '—')}</span></div>
        ${inv.transactionRef ? `<div class="kv"><span>Txn / Note</span><span>${escapeHtml(inv.transactionRef)}</span></div>` : ''}
      </div>
    </div>

    ${highlights.length > 0 ? `<div class="strip">${highlights.map(h => `<div><div class="strip-label">${escapeHtml(h.label)}</div><div class="strip-val">${escapeHtml(h.value)}</div></div>`).join('')}</div>` : ''}

    <table>
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th>Description</th>
          <th class="num" style="width:64px">Qty</th>
          <th class="num" style="width:110px">Rate</th>
          <th class="num" style="width:120px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, idx) => `<tr>
          <td>${idx + 1}</td>
          <td>
            <div class="item-title">${escapeHtml(it.description)}</div>
            ${it.meta ? `<div class="item-meta">${escapeHtml(it.meta)}</div>` : ''}
          </td>
          <td class="num">${escapeHtml(it.quantity ?? 1)}</td>
          <td class="num">${escapeHtml(fmtBdtHtml(it.unitPrice))}</td>
          <td class="num"><strong>${escapeHtml(fmtBdtHtml(it.amount))}</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div class="bottom">
      <div class="box">
        <div class="eyebrow">Notes &amp; Verification</div>
        <div class="sub" style="margin-top:6px">${escapeHtml(inv.notes || '')}</div>
      </div>
      <div class="totals">
        <div class="trow"><span>Subtotal</span><span class="mono">${escapeHtml(fmtBdtHtml(inv.subtotal ?? inv.totalAmount))}</span></div>
        ${Number(inv.discount) > 0 ? `<div class="trow"><span>Discount</span><span class="mono">-${escapeHtml(fmtBdtHtml(inv.discount))}</span></div>` : ''}
        ${Number(inv.tax) > 0 ? `<div class="trow"><span>VAT / Tax</span><span class="mono">${escapeHtml(fmtBdtHtml(inv.tax))}</span></div>` : ''}
        <div class="trow grand"><span>Total Amount</span><span class="mono">${escapeHtml(fmtBdtHtml(inv.totalAmount))}</span></div>
        <div class="trow"><span>${escapeHtml(inv.paidLabel || 'Paid')}</span><span class="mono" style="color:#059669">${escapeHtml(fmtBdtHtml(inv.paidAmount))}</span></div>
        <div class="trow"><span>${escapeHtml(inv.dueLabel || 'Balance Due')}</span><span class="mono" style="color:${Number(inv.dueAmount) > 0 ? '#b45309' : '#475569'}">${escapeHtml(fmtBdtHtml(inv.dueAmount))}</span></div>
      </div>
    </div>

    <div class="footer">
      <div>Computer-generated official document · ${escapeHtml(venue.name || 'Crossbar Metro Arena')}</div>
      <div class="sig">
        <div class="sig-line">${escapeHtml(inv.authorizedBy || 'Authorized Signatory')}</div>
        <div>Authorized Signature / Issued By</div>
      </div>
    </div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 150); };</script>
</body>
</html>`;

    const win = window.open('', '_blank', useToken ? 'width=430,height=820' : 'width=860,height=920');
    if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
    } else {
        downloadInvoicePdf(invoice, options);
    }
}
