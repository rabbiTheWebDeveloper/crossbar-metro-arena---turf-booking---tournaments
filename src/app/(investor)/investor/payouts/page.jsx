'use client';
import React, { useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { useInvestor } from '@/context/InvestorContext';
import { formatMoney, formatDate, formatMonth, paymentMethodLabel } from '@/data/finance';
import { buildPayoutInvoice, buildInvestorStatementInvoice, buildCustomInvoice } from '@/lib/invoice';
import { CreditCard, CheckCircle2, Download, FileText, Receipt } from 'lucide-react';

export default function InvestorPayoutsPage() {
    const { payouts, invoices, siteSettings, openInvoice, downloadInvoice, calculateMonthlyFinance, isLoadingData } = useArena();
    const { activeInvestor } = useInvestor();
    const activeId = activeInvestor?.id || null;

    // `payouts` already holds only the caller's own records for investors (admins see all),
    // so a strict investorId match is all that is needed.
    const myPayouts = useMemo(() => {
        if (!activeId) return [];
        return (payouts || [])
            .filter(p => p.investorId === activeId)
            .sort((a, b) => String(b.datePaid || b.createdAt || '').localeCompare(String(a.datePaid || a.createdAt || '')));
    }, [payouts, activeId]);

    const myCustomVouchers = useMemo(
        () => (invoices || []).map(doc => buildCustomInvoice(doc, siteSettings)),
        [invoices, siteSettings]
    );

    const totalReceived = useMemo(() => myPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [myPayouts]);

    if (isLoadingData && !activeInvestor) {
        return (<div className="w-full max-w-2xl space-y-4" aria-busy="true">
            <div className="h-10 w-64 rounded-xl bg-white/5 animate-pulse"/>
            <div className="h-64 rounded-2xl bg-white/5 animate-pulse"/>
        </div>);
    }

    const handleDownloadAllStatement = () => {
        if (!activeInvestor) return;
        downloadInvoice(buildInvestorStatementInvoice({
            investor: activeInvestor,
            payouts: myPayouts,
            siteSettings
        }));
    };

    const handlePreviewAllStatement = () => {
        if (!activeInvestor) return;
        openInvoice(buildInvestorStatementInvoice({
            investor: activeInvestor,
            payouts: myPayouts,
            siteSettings
        }));
    };

    return (
        <div className="w-full max-w-2xl space-y-5 sm:space-y-6">
            {activeInvestor && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                            {activeInvestor.name} · Payout History &amp; Invoices
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {activeInvestor.sharePercentage ?? 0}% equity shareholder
                            {Number(activeInvestor.capitalInvested) > 0 ? ` · Invested ${formatMoney(activeInvestor.capitalInvested)}` : ''}
                            {(activeInvestor.status || 'active') !== 'active' ? ' · inactive' : ''}
                        </p>
                    </div>

                    {myPayouts.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handlePreviewAllStatement}
                                className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <FileText className="w-3.5 h-3.5 text-emerald-400"/>
                                <span>Full Statement</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadAllStatement}
                                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5"/>
                                <span>Download All PDF</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 shadow-xl">
                {isLoadingData && myPayouts.length === 0 ? (
                    <div className="space-y-3" aria-busy="true">
                        {[1, 2, 3].map(n => <div key={n} className="h-12 rounded-xl bg-white/5 animate-pulse"/>)}
                    </div>
                ) : myPayouts.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                        <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                        <div className="text-xs text-slate-400 font-medium">No payout distributions recorded yet</div>
                        <div className="text-[12px] text-slate-600 font-mono">
                            Dividends are disbursed after each month is reconciled by the arena desk.
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.05]">
                        {myPayouts.map(pay => {
                            const mFin = pay.month ? calculateMonthlyFinance(pay.month) : null;
                            const voucher = buildPayoutInvoice(pay, activeInvestor, mFin, siteSettings);
                            return (
                                <div key={pay.id} className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-white truncate flex items-center gap-2 flex-wrap">
                                                <span>{pay.month ? formatMonth(pay.month) : 'Dividend payout'}</span>
                                                {pay.paymentMethod && (
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-normal">
                                                        {paymentMethodLabel(pay.paymentMethod)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[12px] text-slate-400 mt-0.5 truncate">
                                                {pay.datePaid ? `Paid ${formatDate(pay.datePaid)}` : 'Processed'}
                                                {pay.transactionNote ? ` · ${pay.transactionNote}` : ''}
                                            </div>
                                            <div className="text-[10.5px] font-mono text-slate-500 mt-0.5">
                                                Voucher #{voucher.invoiceNumber}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-11 sm:pl-0">
                                        <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                                            {formatMoney(pay.amount)}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openInvoice(voucher, 'a4')}
                                                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                                title="Preview A4 Payout Voucher"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-emerald-400"/>
                                                <span>Invoice</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openInvoice(voucher, 'token')}
                                                className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-amber-300 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                                title="Preview 2nd Token Slip"
                                            >
                                                <Receipt className="w-3.5 h-3.5"/>
                                                <span>Token</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => downloadInvoice(voucher, 'a4')}
                                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                                                title="Download Payout Invoice PDF"
                                            >
                                                <Download className="w-3.5 h-3.5"/>
                                                <span>PDF</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="pt-5 mt-2 flex items-center justify-between border-t border-emerald-500/15">
                            <span className="text-xs font-bold text-white">Total received</span>
                            <span className="font-mono font-black text-emerald-400 text-sm">
                                {formatMoney(totalReceived)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {myCustomVouchers.length > 0 && (
                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 shadow-xl space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Additional Partner Invoices &amp; Vouchers ({myCustomVouchers.length})
                    </h3>
                    <div className="divide-y divide-white/[0.05]">
                        {myCustomVouchers.map(inv => (
                            <div key={inv.id || inv.invoiceNumber} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                                <div className="min-w-0">
                                    <div className="font-mono font-bold text-emerald-400">{inv.invoiceNumber}</div>
                                    <div className="text-slate-300 truncate">{inv.items?.[0]?.description || inv.docTypeLabel}</div>
                                    <div className="text-[11px] font-mono text-slate-500">{inv.issueDate} · {inv.statusBadge}</div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-mono font-bold text-white mr-1">{formatMoney(inv.totalAmount)}</span>
                                    <button
                                        type="button"
                                        onClick={() => openInvoice(inv)}
                                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 font-bold text-[11px] cursor-pointer"
                                    >
                                        View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => downloadInvoice(inv)}
                                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5"/> PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
