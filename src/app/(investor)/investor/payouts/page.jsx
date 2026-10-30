'use client';
import React, { useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { useInvestor } from '@/context/InvestorContext';
import { formatMoney, formatDate, formatMonth, paymentMethodLabel } from '@/data/finance';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function InvestorPayoutsPage() {
    const { payouts, isLoadingData } = useArena();
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

    const totalReceived = useMemo(() => myPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0), [myPayouts]);

    if (isLoadingData && !activeInvestor) {
        return (<div className="w-full max-w-2xl space-y-4" aria-busy="true">
            <div className="h-10 w-64 rounded-xl bg-white/5 animate-pulse"/>
            <div className="h-64 rounded-2xl bg-white/5 animate-pulse"/>
        </div>);
    }

    return (
        <div className="w-full max-w-2xl space-y-5 sm:space-y-6">
            {activeInvestor && (
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                            {activeInvestor.name} · Payout History
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {activeInvestor.sharePercentage ?? 0}% equity shareholder{(activeInvestor.status || 'active') !== 'active' ? ' · inactive' : ''}
                        </p>
                    </div>
                    {Number(activeInvestor.capitalInvested) > 0 && (
                        <div className="text-right">
                            <span className="text-[11px] text-slate-400 uppercase font-mono block">Capital Invested</span>
                            <span className="text-xs font-mono font-bold text-white">{formatMoney(activeInvestor.capitalInvested)}</span>
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
                    <div className="divide-y divide-white/[0.04]">
                        {myPayouts.map(pay => (
                            <div key={pay.id} className="py-4 first:pt-0 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-white truncate flex items-center gap-2">
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
                                    </div>
                                </div>

                                <div className="font-mono font-bold text-emerald-400 text-xs sm:text-sm shrink-0">
                                    {formatMoney(pay.amount)}
                                </div>
                            </div>
                        ))}

                        <div className="pt-5 mt-2 flex items-center justify-between border-t border-emerald-500/15">
                            <span className="text-xs font-bold text-white">Total received</span>
                            <span className="font-mono font-black text-emerald-400 text-sm">
                                {formatMoney(totalReceived)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
