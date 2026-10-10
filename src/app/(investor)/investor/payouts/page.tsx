'use client';

import React, { useMemo } from 'react';

export default function InvestorPayoutsPage() {
  // Payout ledger rows matching user screenshot 3
  const payoutsLedger = useMemo(() => [
    { id: 'pay-1', month: 'September 2026', paidDate: 'Paid 4 Oct', amount: '৳28,142' },
    { id: 'pay-2', month: 'August 2026', paidDate: 'Paid 4 Sep', amount: '৳28,181' },
    { id: 'pay-3', month: 'July 2026', paidDate: 'Paid 4 Aug', amount: '৳28,759' },
    { id: 'pay-4', month: 'June 2026', paidDate: 'Paid 4 Jul', amount: '৳26,899' },
  ], []);

  return (
    <div className="w-full max-w-2xl space-y-5 sm:space-y-6">
      
      {/* Payouts Ledger Card with Main Site Emerald Colors */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="divide-y divide-white/[0.04]">
          {payoutsLedger.map(pay => (
            <div key={pay.id} className="py-4 first:pt-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                {/* Minimalist Card Outline Icon matching Screenshot 3 */}
                <div className="w-5 h-5 flex items-center justify-center text-slate-400 shrink-0">
                  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{pay.month}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{pay.paidDate}</div>
                </div>
              </div>

              {/* Amount in electric emerald font matching main website tokens */}
              <div className="font-mono font-bold text-emerald-400 text-xs shrink-0">
                {pay.amount}
              </div>
            </div>
          ))}

          {/* Bottom Total Received Row */}
          <div className="pt-5 mt-2 flex items-center justify-between border-t border-emerald-500/15">
            <span className="text-xs font-bold text-white">Total received</span>
            <span className="font-mono font-black text-emerald-400 text-xs">৳1,11,981</span>
          </div>
        </div>
      </div>

    </div>
  );
}
