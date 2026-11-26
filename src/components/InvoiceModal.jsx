'use client';
import React, { useEffect, useState } from 'react';
import { CrossbarLogo } from './CrossbarLogo';
import { extractTokenSlipFields } from '@/lib/invoice';
import { downloadInvoicePdf, printInvoiceDocument, fmtBdtPdf } from '@/lib/invoicePdf';
import { X, Download, Printer, CheckCircle2, Copy, Check, FileText, Receipt } from 'lucide-react';

const TONE_BADGE = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/35',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    slate: 'bg-white/10 text-slate-300 border-white/15'
};

const STAMP_STYLE = {
    rose: 'border-[#c22629] text-[#c22629] bg-[#c22629]/[0.05]',
    emerald: 'border-[#166534] text-[#166534] bg-[#166534]/[0.05]',
    amber: 'border-[#b45309] text-[#b45309] bg-[#b45309]/[0.05]',
    violet: 'border-[#6d28d9] text-[#6d28d9] bg-[#6d28d9]/[0.05]',
    sky: 'border-[#0369a1] text-[#0369a1] bg-[#0369a1]/[0.05]',
    slate: 'border-slate-700 text-slate-700 bg-slate-700/[0.05]'
};

const money = (n) => {
    const val = Math.round(Number(n) || 0);
    const sign = val < 0 ? '-' : '';
    return `${sign}৳${Math.abs(val).toLocaleString()}`;
};

function SoccerSwooshCrest() {
    return (
        <svg width="48" height="40" viewBox="0 0 56 46" fill="none" aria-hidden="true" className="shrink-0">
            <path d="M2 39C7 23 15 9 31 5C21 14 17 26 17 39H2Z" fill="#173a22"/>
            <path d="M5 21C9 11 18 5 29 4C20 9 13 15 9 24L5 21Z" fill="#173a22"/>
            <circle cx="35" cy="23" r="18" fill="#ffffff" stroke="#173a22" strokeWidth="2"/>
            <polygon points="35,14 43,20 40,29 30,29 27,20" fill="#122618"/>
            <line x1="35" y1="14" x2="35" y2="5" stroke="#122618" strokeWidth="1.6"/>
            <line x1="43" y1="20" x2="52" y2="17" stroke="#122618" strokeWidth="1.6"/>
            <line x1="40" y1="29" x2="46" y2="37" stroke="#122618" strokeWidth="1.6"/>
            <line x1="30" y1="29" x2="24" y2="37" stroke="#122618" strokeWidth="1.6"/>
            <line x1="27" y1="20" x2="18" y2="17" stroke="#122618" strokeWidth="1.6"/>
            <polygon points="31,6 39,6 35,9" fill="#122618"/>
            <polygon points="50,13 53,21 49,18" fill="#122618"/>
            <polygon points="48,34 42,40 44,35" fill="#122618"/>
            <polygon points="22,34 28,40 26,35" fill="#122618"/>
            <polygon points="20,13 17,21 21,18" fill="#122618"/>
        </svg>
    );
}

const ColonRow = ({ label, value }) => (
    <div className="grid grid-cols-[106px_12px_1fr] items-baseline py-[1.5px] text-[12.5px] leading-snug">
        <span className="font-bold text-[#0b140e]">{label}</span>
        <span className="font-bold text-center text-[#0b140e]">:</span>
        <span className="font-semibold text-[#111827] break-words">{value}</span>
    </div>
);

const DottedRule = () => <div className="border-t-[1.5px] border-dotted border-[#262626] my-2.5"/>;

/**
 * 2nd Invoice — Exact Image-Matched Crossbar Metro Arena Serrated Token / Payment Slip
 */
function TokenReceipt({ invoice }) {
    const venue = invoice.venue || {};
    const tf = extractTokenSlipFields(invoice);
    const items = Array.isArray(invoice.items) && invoice.items.length
        ? invoice.items
        : [{ description: 'Turf Booking Payment', quantity: 1, unitPrice: invoice.totalAmount || 0, amount: invoice.totalAmount || 0 }];
    const stampCls = STAMP_STYLE[invoice.statusTone] || STAMP_STYLE.emerald;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-[#141a1f] pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
            <div className="mx-auto w-full max-w-[385px] bg-[#f8f9f7] text-[#0f1712] shadow-2xl overflow-hidden tabular-nums select-text">
                {/* Serrated Top Receipt Edge */}
                <svg className="block w-full h-2.5" viewBox="0 0 340 10" preserveAspectRatio="none" aria-hidden="true">
                    <polygon
                        fill="#141a1f"
                        points="0,0 340,0 340,10 330,2 320,10 310,2 300,10 290,2 280,10 270,2 260,10 250,2 240,10 230,2 220,10 210,2 200,10 190,2 180,10 170,2 160,10 150,2 140,10 130,2 120,10 110,2 100,10 90,2 80,10 70,2 60,10 50,2 40,10 30,2 20,10 10,2 0,10"
                    />
                </svg>

                <div className="px-5 sm:px-6 py-3">
                    {/* Brand Header */}
                    <div className="flex items-center justify-center gap-2.5">
                        <SoccerSwooshCrest/>
                        <div>
                            <div className="text-[21px] font-black tracking-tight text-[#0b140e] leading-tight">
                                {venue.name || 'Crossbar Metro Arena'}
                            </div>
                            <div className="text-[12px] italic text-[#1c2620] leading-snug">
                                {venue.tagline || "Dhaka's Premier Floodlit Outdoor Turf"}
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-[11px] font-medium text-[#111827] mt-1.5">
                        {venue.address || 'Uttara Metro Center, Sector 17, Dhaka, Bangladesh, 1230'}
                    </div>

                    <div className="border-t-2 border-[#173a22] my-2.5"/>

                    {/* Forest-Green Title Banner */}
                    <div className="bg-[#173a22] text-white text-center font-extrabold text-[14px] tracking-wider uppercase py-1.5 px-3 rounded-md">
                        {tf.bannerTitle}
                    </div>

                    {/* Receipt Number + Outlined Status Stamp */}
                    <div className="text-center font-extrabold text-[15.5px] tracking-wide text-[#0b140e] mt-2">
                        {invoice.invoiceNumber}
                    </div>

                    <div className={`mx-auto mt-1.5 mb-2.5 w-fit min-w-[142px] px-5 py-0.5 rounded-md border-2 text-center font-black text-[20px] tracking-widest uppercase ${stampCls}`}>
                        {invoice.statusBadge || 'ISSUED'}
                    </div>

                    <DottedRule/>

                    {/* Block 1: Party & Reference Metadata */}
                    <div className="space-y-0.5">
                        <ColonRow label={tf.partyRowLabel} value={tf.partyName}/>
                        <ColonRow label={tf.squadLabel} value={tf.squadValue}/>
                        <ColonRow label="Phone" value={tf.phone}/>
                        <ColonRow label="Issue Date" value={tf.issueDate}/>
                        <ColonRow label="Reference" value={tf.reference}/>
                        <ColonRow label="Method" value={tf.method}/>
                    </div>

                    <DottedRule/>

                    {/* Block 2: Booking Date & Slot */}
                    <div className="space-y-0.5">
                        <ColonRow label={tf.dateRowLabel} value={tf.dateRowValue}/>
                        <ColonRow label={tf.slotRowLabel} value={tf.slotRowValue}/>
                    </div>

                    {/* Compact Forest-Green 5-Column Table */}
                    <div className="mt-2.5 bg-[#173a22] text-white rounded px-2 py-1.5 grid grid-cols-[18px_1fr_28px_72px_74px] gap-1 text-[9.5px] font-extrabold uppercase tracking-wide">
                        <span>#</span>
                        <span>DESCRIPTION &amp; DETAILS</span>
                        <span className="text-center">QTY</span>
                        <span className="text-right">RATE</span>
                        <span className="text-right">AMOUNT</span>
                    </div>

                    <div className="divide-y divide-black/[0.06]">
                        {items.map((it, i) => (
                            <div key={i} className="px-2 py-1.5 grid grid-cols-[18px_1fr_28px_72px_74px] gap-1 text-[11.5px] items-baseline">
                                <span className="font-semibold">{i + 1}</span>
                                <span className="font-semibold text-[#0b140e] break-words">{it.description}</span>
                                <span className="text-center font-semibold">{it.quantity ?? 1}</span>
                                <span className="text-right font-semibold whitespace-nowrap">{fmtBdtPdf(it.unitPrice)}</span>
                                <span className="text-right font-bold whitespace-nowrap">{fmtBdtPdf(it.amount)}</span>
                            </div>
                        ))}
                    </div>

                    <DottedRule/>

                    {/* Subtotal + Forest-Green Total Amount Pill */}
                    <div className="flex items-baseline justify-between px-0.5 pb-1.5 text-[13px]">
                        <span className="font-semibold text-[#0b140e]">Subtotal</span>
                        <span className="font-extrabold text-[#0b140e]">{fmtBdtPdf(invoice.subtotal ?? invoice.totalAmount)}</span>
                    </div>

                    {Number(invoice.discount) > 0 && (
                        <div className="flex items-baseline justify-between px-0.5 pb-1.5 text-[12px] text-[#166534]">
                            <span className="font-semibold">Discount</span>
                            <span className="font-bold">-{fmtBdtPdf(invoice.discount)}</span>
                        </div>
                    )}

                    <div className="bg-[#173a22] text-white rounded-md px-3 py-2 flex items-baseline justify-between text-[16px] font-black">
                        <span>Total Amount</span>
                        <span>{fmtBdtPdf(invoice.totalAmount)}</span>
                    </div>

                    <DottedRule/>

                    {/* Colon-Aligned Verification / Settlement Rows */}
                    <div className="space-y-0.5 text-[12.5px]">
                        <div className="grid grid-cols-[136px_12px_1fr] items-baseline px-0.5">
                            <span className="font-semibold text-[#0b140e]">{tf.paidLabel}</span>
                            <span className="font-bold text-center">:</span>
                            <span className="text-right font-bold text-[#0b140e]">{fmtBdtPdf(invoice.paidAmount)}</span>
                        </div>
                        <div className="grid grid-cols-[136px_12px_1fr] items-baseline px-0.5">
                            <span className="font-semibold text-[#0b140e]">{tf.dueLabel}</span>
                            <span className="font-bold text-center">:</span>
                            <span className="text-right font-bold text-[#0b140e]">{fmtBdtPdf(invoice.dueAmount)}</span>
                        </div>
                    </div>

                    <DottedRule/>

                    {/* Transaction / Reference */}
                    <div className="px-0.5 text-[12px]">
                        <div className="font-semibold text-[#111827]">Transaction / Reference :</div>
                        <div className="font-semibold text-[#0b140e] break-all mt-0.5">
                            {invoice.transactionRef || invoice.referenceCode || invoice.invoiceNumber || '—'}
                        </div>
                    </div>

                    <DottedRule/>

                    {/* Centered Italic Footer */}
                    <div className="text-center italic text-[12px] text-[#111827] leading-snug space-y-0.5">
                        <div>{tf.shortNote}</div>
                        <div>Computer-generated receipt</div>
                    </div>

                    <div className="border-t-2 border-[#173a22] mt-2.5 mb-1"/>
                </div>

                {/* Serrated Bottom Receipt Edge */}
                <svg className="block w-full h-2.5" viewBox="0 0 340 10" preserveAspectRatio="none" aria-hidden="true">
                    <polygon
                        fill="#141a1f"
                        points="0,10 340,10 340,0 330,8 320,0 310,8 300,0 290,8 280,0 270,8 260,0 250,8 240,0 230,8 220,0 210,8 200,0 190,8 180,0 170,8 160,0 150,8 140,0 130,8 120,0 110,8 100,0 90,8 80,0 70,8 60,0 50,8 40,0 30,8 20,0 10,8 0,0"
                    />
                </svg>
            </div>
        </div>
    );
}

export function InvoiceModal({ invoice, onClose }) {
    const initialFormat = invoice?.defaultFormat === 'token' || invoice?.kind === 'token' ? 'token' : 'a4';
    const [format, setFormat] = useState(initialFormat);
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);

    useEffect(() => {
        setFormat(invoice?.defaultFormat === 'token' || invoice?.kind === 'token' ? 'token' : 'a4');
    }, [invoice]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!invoice) return null;

    const venue = invoice.venue || {};
    const recipient = invoice.recipient || {};
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const highlights = Array.isArray(invoice.highlights) ? invoice.highlights : [];
    const badgeCls = TONE_BADGE[invoice.statusTone] || TONE_BADGE.emerald;

    const handleDownload = () => {
        downloadInvoicePdf(invoice, { format });
        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2200);
    };

    const handleCopyNo = async () => {
        if (!invoice.invoiceNumber) return;
        try {
            await navigator.clipboard.writeText(invoice.invoiceNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            // ignore
        }
    };

    return (
        <div
            className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-modal-title"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-[#0b1117] border-t sm:border border-emerald-500/35 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[94dvh] flex flex-col overflow-hidden shadow-2xl">
                {/* Sticky Top Action Bar + 1st (A4) / 2nd (Token Slip) Switcher */}
                <div className="px-4 sm:px-6 py-3 bg-[#080d12]/95 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-lime-400/15 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
                            {format === 'token' ? <Receipt className="w-4 h-4"/> : <FileText className="w-4 h-4"/>}
                        </div>
                        <div className="min-w-0">
                            <h2 id="invoice-modal-title" className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate">
                                {format === 'token' ? 'Token / Payment Invoice' : (invoice.docTypeLabel || 'Official Invoice')}
                            </h2>
                            <button
                                type="button"
                                onClick={handleCopyNo}
                                className="text-[11px] text-emerald-400 hover:text-lime-300 inline-flex items-center gap-1 cursor-pointer"
                                title="Copy invoice number"
                            >
                                <span>{invoice.invoiceNumber}</span>
                                {copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3 opacity-70"/>}
                            </button>
                        </div>
                    </div>

                    {/* 1st Invoice vs 2nd Invoice Switcher */}
                    <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] font-bold">
                        <button
                            type="button"
                            onClick={() => setFormat('a4')}
                            className={`px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                format === 'a4' ? 'bg-lime-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            <FileText className="w-3 h-3"/>
                            <span>1st · A4</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat('token')}
                            className={`px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors ${
                                format === 'token' ? 'bg-lime-400 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            <Receipt className="w-3 h-3"/>
                            <span>2nd · Token</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-0">
                        <button
                            type="button"
                            onClick={() => printInvoiceDocument(invoice, { format })}
                            className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                            title={format === 'token' ? 'Print 80mm Token Slip' : 'Print A4 Invoice'}
                        >
                            <Printer className="w-3.5 h-3.5 text-emerald-400"/>
                            <span className="hidden xs:inline">Print</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg shadow-lime-400/20 cursor-pointer transition-colors"
                        >
                            {downloaded ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Download className="w-3.5 h-3.5 stroke-[2.5]"/>}
                            <span>{downloaded ? 'Saved PDF' : format === 'token' ? 'Token PDF' : 'Download PDF'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close invoice preview"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                        >
                            <X className="w-4 h-4"/>
                        </button>
                    </div>
                </div>

                {format === 'token' ? <TokenReceipt invoice={invoice}/> : (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
                    {/* Brand Banner */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-[#0e1720] to-[#080d12] border border-emerald-500/25 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                            <CrossbarLogo size="sm"/>
                            <p className="text-[11.5px] text-slate-300 pt-1">{venue.address}</p>
                            <p className="text-[11px] text-slate-400">
                                {[venue.phone, venue.email, venue.website].filter(Boolean).join(' · ')}
                            </p>
                        </div>

                        <div className="sm:text-right space-y-1.5">
                            <div className="text-xs font-black uppercase tracking-widest text-lime-400 font-display">
                                {invoice.docTypeLabel || 'OFFICIAL INVOICE'}
                            </div>
                            <div className="text-base sm:text-lg font-black text-white">
                                #{invoice.invoiceNumber}
                            </div>
                            <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase border ${badgeCls}`}>
                                    {invoice.statusBadge || 'ISSUED'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Billed To + Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div className="p-4 rounded-2xl bg-[#080d12] border border-white/10 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                {invoice.partyLabel || 'BILLED TO'}
                            </div>
                            <div className="text-sm sm:text-base font-bold text-white">{recipient.name || '—'}</div>
                            {recipient.subtitle && <div className="text-slate-300">{recipient.subtitle}</div>}
                            {(recipient.phone || recipient.email) && (
                                <div className="text-[11.5px] text-slate-400 pt-0.5 break-all">
                                    {[recipient.phone, recipient.email].filter(Boolean).join(' · ')}
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl bg-[#080d12] border border-white/10 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400">Issue Date</span>
                                <span className="font-bold text-white">{invoice.issueDate || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400">Reference</span>
                                <span className="font-bold text-emerald-300">{invoice.referenceCode || invoice.invoiceNumber}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400">Payment Method</span>
                                <span className="font-semibold text-slate-200 text-right">{invoice.paymentMethod || '—'}</span>
                            </div>
                            {invoice.transactionRef && (
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                                    <span className="text-slate-400 shrink-0">Txn / Note</span>
                                    <span className="text-[11px] text-slate-200 truncate max-w-[190px]" title={invoice.transactionRef}>
                                        {invoice.transactionRef}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Highlights Strip */}
                    {highlights.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 text-xs">
                            {highlights.map((h, i) => (
                                <div key={i} className="min-w-0">
                                    <div className="text-[10px] uppercase tracking-wider text-emerald-400/90 truncate">{h.label}</div>
                                    <div className="font-bold text-white truncate mt-0.5" title={String(h.value || '')}>{h.value || '—'}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Line Items Table */}
                    <div className="rounded-2xl bg-[#080d12] border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-white/[0.04] text-left text-[10.5px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                                        <th className="py-2.5 px-3.5 w-10">#</th>
                                        <th className="py-2.5 px-3.5">Description</th>
                                        <th className="py-2.5 px-3 text-right">Qty</th>
                                        <th className="py-2.5 px-3 text-right">Rate</th>
                                        <th className="py-2.5 px-3.5 text-right text-lime-300">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.06]">
                                    {items.map((it, idx) => (
                                        <tr key={idx}>
                                            <td className="py-3 px-3.5 text-slate-500 align-top">{idx + 1}</td>
                                            <td className="py-3 px-3.5 align-top">
                                                <div className="font-bold text-white">{it.description}</div>
                                                {it.meta && <div className="text-[11px] text-slate-400 mt-0.5">{it.meta}</div>}
                                            </td>
                                            <td className="py-3 px-3 text-slate-300 text-right align-top whitespace-nowrap">{it.quantity ?? 1}</td>
                                            <td className="py-3 px-3 text-slate-300 text-right align-top whitespace-nowrap">{money(it.unitPrice)}</td>
                                            <td className="py-3 px-3.5 font-bold text-white text-right align-top whitespace-nowrap">{money(it.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes + Totals Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start text-xs">
                        <div className="sm:col-span-7 p-4 rounded-2xl bg-[#080d12] border border-white/10 space-y-2">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                Notes &amp; Verification
                            </div>
                            <p className="text-slate-300 leading-relaxed">
                                {invoice.notes || 'Official computer-generated invoice from Crossbar Metro Arena.'}
                            </p>
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Issued by: <strong className="text-slate-300">{invoice.authorizedBy || 'Crossbar Admin'}</strong></span>
                                <span>{venue.website}</span>
                            </div>
                        </div>

                        <div className="sm:col-span-5 rounded-2xl bg-[#080d12] border border-white/10 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 text-xs">
                                <span className="font-sans text-slate-400">Subtotal</span>
                                <span className="text-slate-200">{money(invoice.subtotal ?? invoice.totalAmount)}</span>
                            </div>
                            {Number(invoice.discount) > 0 && (
                                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-xs text-emerald-400">
                                    <span className="font-sans">Discount</span>
                                    <span>-{money(invoice.discount)}</span>
                                </div>
                            )}
                            {Number(invoice.tax) > 0 && (
                                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-xs">
                                    <span className="font-sans text-slate-400">VAT / Tax</span>
                                    <span className="text-slate-200">{money(invoice.tax)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between px-4 py-3 bg-lime-400/10 border-b border-lime-400/25 text-sm font-black">
                                <span className="font-sans text-white">Total Amount</span>
                                <span className="text-lime-400">{money(invoice.totalAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 text-xs font-bold">
                                <span className="font-sans text-slate-300">{invoice.paidLabel || 'Amount Paid'}</span>
                                <span className="text-emerald-400">{money(invoice.paidAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2.5 text-xs font-bold">
                                <span className="font-sans text-slate-300">{invoice.dueLabel || 'Balance Due'}</span>
                                <span className={Number(invoice.dueAmount) > 0 ? 'text-amber-300' : 'text-slate-400'}>
                                    {money(invoice.dueAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}
export default InvoiceModal;
