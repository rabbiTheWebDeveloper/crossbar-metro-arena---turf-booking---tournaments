'use client';
import React, { useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { useInvestor } from '../layout';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function InvestorPayoutsPage() {
    const { payouts, investors, currentUser } = useArena();
    const investorCtx = useInvestor();

    // Determine active investor
    const activeInvestor = useMemo(() => {
        if (investorCtx?.activeInvestor) return investorCtx.activeInvestor;
        if (currentUser?.role === 'investor') {
            const match = investors.find(i =>
                i.name.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]) ||
                (currentUser.phone && i.phone.replace(/[^0-9]/g, '').includes(currentUser.phone.replace(/[^0-9]/g, '')))
            );
            if (match) return match;
        }
        return investors[0] || null;
    }, [investorCtx?.activeInvestor, currentUser, investors]);

    // Live payouts filtered for the active partner
    const myPayouts = useMemo(() => {
        if (!activeInvestor) return [];
        return (payouts || [])
            .filter(p =>
                p.investorId === activeInvestor.id ||
                (p.investorName && activeInvestor.name && p.investorName.toLowerCase() === activeInvestor.name.toLowerCase())
            )
            .sort((a, b) => new Date(b.datePaid || b.createdAt || 0) - new Date(a.datePaid || a.createdAt || 0));
    }, [payouts, activeInvestor]);

    const totalReceived = useMemo(() => {
        return myPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }, [myPayouts]);

    const formatBDT = (num) => `৳${Number(num || 0).toLocaleString('en-IN')}`;

    const formatMonthDisplay = (monthStr) => {
        if (!monthStr) return 'Dividend Payout';
        if (monthStr.includes('-')) {
            const [y, m] = monthStr.split('-').map(Number);
            const d = new Date(y, m - 1, 1);
            return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        return monthStr;
    };

    const formatPaidDate = (dateStr) => {
        if (!dateStr) return 'Processed';
        try {
            const d = new Date(dateStr);
            return `Paid ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
        } catch {
            return `Paid ${dateStr}`;
        }
    };

    const formatMethod = (method) => {
        const map = {
            bank_transfer: 'Bank Transfer',
            bkash: 'bKash',
            cheque: 'Bank Cheque',
            cash: 'Cash'
        };
        return map[method] || (method ? method.replace('_', ' ').toUpperCase() : 'Bank');
    };

    return (
        <div className="w-full max-w-2xl space-y-5 sm:space-y-6">
            {/* Header info bar */}
            {activeInvestor && (
                <div className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                            {activeInvestor.name} · Payout History
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {activeInvestor.sharePercentage}% Equity Shareholder
                        </p>
                    </div>
                    {activeInvestor.capitalInvested > 0 && (
                        <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Capital Invested</span>
                            <span className="text-xs font-mono font-bold text-white">{formatBDT(activeInvestor.capitalInvested)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Payouts Ledger Card with Main Site Emerald Colors */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 shadow-xl">
                {myPayouts.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                        <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                        <div className="text-xs text-slate-400 font-medium">No payout distributions recorded yet</div>
                        <div className="text-[11px] text-slate-600 font-mono">
                            Dividends are disbursed at the start of each month following monthly reconciliation.
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {myPayouts.map(pay => (
                            <div key={pay.id || pay._id} className="py-4 first:pt-0 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                                    {/* Icon */}
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                                            <span>{formatMonthDisplay(pay.month)}</span>
                                            {pay.paymentMethod && (
                                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-400 font-normal">
                                                    {formatMethod(pay.paymentMethod)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                            {formatPaidDate(pay.datePaid)}
                                            {pay.transactionNote ? ` · ${pay.transactionNote}` : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Amount in electric emerald font matching main website tokens */}
                                <div className="font-mono font-bold text-emerald-400 text-xs sm:text-sm shrink-0">
                                    {formatBDT(pay.amount)}
                                </div>
                            </div>
                        ))}

                        {/* Bottom Total Received Row */}
                        <div className="pt-5 mt-2 flex items-center justify-between border-t border-emerald-500/15">
                            <span className="text-xs font-bold text-white">Total received</span>
                            <span className="font-mono font-black text-emerald-400 text-sm">
                                {formatBDT(totalReceived)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

