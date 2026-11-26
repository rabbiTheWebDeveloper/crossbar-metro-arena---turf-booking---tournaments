'use client';
import React, { useEffect, useState } from 'react';
import { CrossbarLogo } from './CrossbarLogo';
import { downloadInvoicePdf, printInvoiceDocument } from '@/lib/invoicePdf';
import { X, Download, Printer, CheckCircle2, Copy, Check, FileText } from 'lucide-react';

const TONE_BADGE = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/35',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    slate: 'bg-white/10 text-slate-300 border-white/15'
};

const money = (n) => {
    const val = Math.round(Number(n) || 0);
    const sign = val < 0 ? '-' : '';
    return `${sign}৳${Math.abs(val).toLocaleString()}`;
};

const Row = ({ k, v, strong }) => (
    <div className={`flex justify-between gap-3 ${strong ? 'font-black text-base' : ''}`}>
        <span className={strong ? '' : 'text-slate-500'}>{k}</span>
        <span className="font-bold text-right">{v}</span>
    </div>
);
const Dash = () => <div className="border-t border-dashed border-slate-400 my-3"/>;

function TokenReceipt({ invoice }) {
    const venue = invoice.venue || {};
    const r = invoice.recipient || {};
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-black/30">
            <div className="mx-auto w-full max-w-[340px] bg-white text-slate-900 rounded-md shadow-2xl px-5 py-6 text-xs leading-relaxed tabular-nums">
                <div className="text-center">
                    <div className="text-lg font-black">{venue.name}</div>
                    <div className="text-[11px] text-slate-500">{venue.tagline}</div>
                    <div className="text-[11px] text-slate-500">{venue.address}</div>
                    <div className="text-[11px] text-slate-500">{venue.phone}</div>
                </div>
                <Dash/>
                <div className="text-center font-black tracking-wide">{invoice.docTypeLabel}</div>
                <div className="my-2 rounded bg-[#0b1117] text-lime-400 text-center font-black text-base py-2">{invoice.invoiceNumber}</div>
                <Row k="Date" v={invoice.issueDate}/>
                <Row k="Booking" v={invoice.referenceCode}/>
                <Row k="Name" v={r.name}/>
                {r.phone && <Row k="Phone" v={r.phone}/>}
                {(invoice.highlights || []).filter(h => h.label !== 'Booking Code').slice(0, 3).map((h, i) => <Row key={i} k={h.label} v={h.value}/>)}
                <Dash/>
                <div className="flex justify-between text-[10px] font-black text-slate-500"><span>ITEM</span><span>AMOUNT</span></div>
                {items.map((it, i) => (
                    <div key={i} className="mt-1">
                        <div className="flex justify-between gap-3 font-bold"><span>{it.description}</span><span className="whitespace-nowrap">{money(it.amount)}</span></div>
                        {it.meta && <div className="text-[10.5px] text-slate-500">{it.meta}</div>}
                    </div>
                ))}
                <Dash/>
                <Row k="Token Received" v={money(invoice.paidAmount)} strong/>
                <Row k={invoice.dueLabel || 'Balance Due'} v={money(invoice.dueAmount)}/>
                <Dash/>
                <Row k="Paid via" v={invoice.paymentMethod || '-'}/>
                {invoice.transactionRef && <Row k="Txn" v={invoice.transactionRef}/>}
                <div className="mx-auto my-4 w-fit min-w-[60%] border-2 border-emerald-600 text-emerald-700 text-center font-black tracking-wider px-3 py-1">{invoice.statusBadge}</div>
                <div className="text-center text-[10.5px] text-slate-500">{invoice.notes}</div>
                <Dash/>
                <div className="text-center font-black text-sm">Thank you!</div>
                <div className="text-center text-[10.5px] text-slate-500">{venue.website}</div>
                <div className="text-center text-[10.5px] text-slate-500">Issued by {invoice.authorizedBy}</div>
            </div>
        </div>
    );
}

export function InvoiceModal({ invoice, onClose }) {
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);

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
        downloadInvoicePdf(invoice);
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
                {/* Sticky Top Action Bar */}
                <div className="px-4 sm:px-6 py-3.5 bg-[#080d12]/95 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-lime-400/15 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
                            <FileText className="w-4 h-4"/>
                        </div>
                        <div className="min-w-0">
                            <h2 id="invoice-modal-title" className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate">
                                {invoice.docTypeLabel || 'Official Invoice'}
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

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => printInvoiceDocument(invoice)}
                            className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Print A4 Invoice"
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
                            <span>{downloaded ? 'Saved PDF' : 'Download PDF'}</span>
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

                {invoice.kind === 'token' ? <TokenReceipt invoice={invoice}/> : (
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
