/**
 * Pure, zero-dependency A4 Vector PDF 1.4 Generator & Clean Print Utility for Crossbar Metro Arena.
 * Generates genuine, crisp `application/pdf` files directly in the browser or Node/Vitest without external packages.
 */

const PAGE_W = 595.28; // A4 width in pt
const PAGE_H = 841.89; // A4 height in pt
const MARGIN = 38;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * Standard PDF Type1 fonts (Helvetica / Courier) use WinAnsiEncoding (Latin-1).
 * Replace ৳ with "BDT " and normalize smart quotes/dashes so every glyph renders sharply in all PDF viewers.
 */
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

function approxTextWidth(str, fontSize, isMono = false) {
    const s = pdfSafeText(str);
    return s.length * fontSize * (isMono ? 0.6 : 0.52);
}

const TONE_RGB = {
    emerald: [0.06, 0.58, 0.41],
    amber: [0.82, 0.52, 0.05],
    rose: [0.82, 0.18, 0.28],
    sky: [0.08, 0.52, 0.78],
    violet: [0.48, 0.28, 0.82],
    slate: [0.35, 0.41, 0.49]
};

/**
 * Generates a complete, valid multi-page A4 PDF 1.4 binary (`Uint8Array`) for a NormalizedInvoice.
 */
export function generateInvoicePdfBytes(invoice) {
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

    // Font aliases: /F1 = Helvetica, /F2 = Helvetica-Bold, /F3 = Courier-Bold
    const drawText = (str, x, baselineY, { font = 'F1', size = 9.5, color = [0.1, 0.14, 0.18], align = 'left' } = {}) => {
        const clean = escapePdfString(str);
        if (!clean) return;
        let drawX = x;
        if (align === 'right') {
            drawX = x - approxTextWidth(str, size, font === 'F3');
        } else if (align === 'center') {
            drawX = x - approxTextWidth(str, size, font === 'F3') / 2;
        }
        push('BT');
        push(`/${font} ${f(size)} Tf`);
        push(`${f(color[0])} ${f(color[1])} ${f(color[2])} rg`);
        push(`1 0 0 1 ${f(drawX)} ${f(baselineY)} Tm`);
        push(`(${clean}) Tj`);
        push('ET');
    };

    const drawPageHeader = (isContinuation = false) => {
        // Dark arena banner at top
        const bannerH = isContinuation ? 54 : 88;
        fillRect(0, PAGE_H, PAGE_W, bannerH, [0.05, 0.08, 0.11]);
        // Lime/emerald accent stripe
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

        // Right-aligned Document Type + Invoice Number
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
            const pillW = Math.max(82, approxTextWidth(badgeText, 8, false) + 18);
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

    // Page 1
    startNewPage(false);

    // ---- Billed To Box + Invoice Meta Box ----
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

    // ---- Highlights Strip ----
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

    // ---- Line Items Table ----
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

    // ---- Totals & Notes Summary Block ----
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

    // Left-side Notes & Transaction Reference
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

    // ---- Footer & Authorized Signature ----
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

    // ---- Assemble PDF 1.4 Object Graph ----
    // Obj 1: Catalog, Obj 2: Pages, Obj 3: Font Helvetica, Obj 4: Font Helvetica-Bold, Obj 5: Font Courier-Bold
    // Obj 6..: Page + Content stream pairs
    const objects = [];
    const addObj = (body) => {
        objects.push(body);
        return objects.length; // 1-based object number
    };

    const catalogId = addObj(''); // placeholder 1
    const pagesId = addObj('');   // placeholder 2
    const f1Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const f2Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const f3Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');

    const utf8Len = (s) => new TextEncoder().encode(s).length;
    const pageIds = [];
    for (const streamContent of pages) {
        const streamBytesLen = utf8Len(streamContent);
        const contentId = addObj(`<< /Length ${streamBytesLen} >>\nstream\n${streamContent}\nendstream`);
        const pageId = addObj(
            `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${f(PAGE_W)} ${f(PAGE_H)}] ` +
            `/Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R /F3 ${f3Id} 0 R >> >> ` +
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

export function buildInvoiceFilename(invoice) {
    const raw = String(invoice?.invoiceNumber || invoice?.referenceCode || 'Crossbar_Invoice')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return `${raw || 'Crossbar_Invoice'}.pdf`;
}

/** Browser 1-click PDF download. */
export function downloadInvoicePdf(invoice) {
    if (typeof window === 'undefined') return false;
    const bytes = generateInvoicePdfBytes(invoice);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildInvoiceFilename(invoice);
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

/** Opens a crisp print-ready A4 invoice sheet in the browser print dialog. */
export function printInvoiceDocument(invoice) {
    if (typeof window === 'undefined') return;
    const inv = invoice || {};
    const venue = inv.venue || {};
    const recipient = inv.recipient || {};
    const items = Array.isArray(inv.items) ? inv.items : [];
    const highlights = Array.isArray(inv.highlights) ? inv.highlights : [];

    const html = `<!doctype html>
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
  .inv-no { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; font-weight: 700; text-align: right; margin-top: 4px; }
  .badge { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 999px; background: #10b981; color: #052e16; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; }
  .grid2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-top: 18px; }
  .box { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 12px; padding: 14px 16px; }
  .eyebrow { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; color: #059669; text-transform: uppercase; }
  .party-name { font-size: 15px; font-weight: 800; margin-top: 4px; color: #0f172a; }
  .sub { font-size: 11.5px; color: #475569; margin-top: 3px; }
  .kv { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11.5px; }
  .kv span:first-child { color: #64748b; font-weight: 600; }
  .kv span:last-child { font-weight: 700; font-family: ui-monospace, monospace; }
  .strip { display: grid; grid-template-columns: repeat(${Math.max(1, highlights.length)}, 1fr); gap: 10px; margin-top: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 14px; }
  .strip-label { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #15803d; }
  .strip-val { font-size: 12px; font-weight: 800; color: #052e16; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #0f172a; color: #e2e8f0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 9px 10px; text-align: left; }
  th.num, td.num { text-align: right; font-family: ui-monospace, monospace; }
  td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .item-title { font-weight: 700; color: #0f172a; }
  .item-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
  .bottom { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-top: 18px; align-items: start; }
  .totals { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .trow { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  .trow.grand { background: #0f172a; color: #fff; font-weight: 800; font-size: 13px; }
  .trow.grand span:last-child { color: #a3e635; }
  .trow .mono { font-family: ui-monospace, monospace; font-weight: 700; }
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
        ${recipient.phone || recipient.email ? `<div class="sub" style="font-family:ui-monospace,monospace">${escapeHtml([recipient.phone, recipient.email].filter(Boolean).join(' · '))}</div>` : ''}
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

    const win = window.open('', '_blank', 'width=860,height=920');
    if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
    } else {
        // Fallback if popup is blocked: download the PDF directly
        downloadInvoicePdf(invoice);
    }
}
