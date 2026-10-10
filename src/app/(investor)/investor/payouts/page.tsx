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
    <div className="w-full max-w-2xl space-y-6">
      
      {/* Payouts Ledger Card (Exact visual match to Screenshot 3) */}
      <div className="bg-[#0b100b] border border-white/[0.07] rounded-2xl p-6 sm:p-7">
        <div className="divide-y divide-white/[0.04]">
          {payoutsLedger.map(pay => (
            <div key={pay.id} className="py-4 first:pt-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Minimalist Card Outline Icon matching Screenshot 3 */}
                <div className="w-5 h-5 flex items-center justify-center text-zinc-400 shrink-0">
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{pay.month}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{pay.paidDate}</div>
                </div>
              </div>

              {/* Amount in electric lime font matching screenshot */}
              <div className="font-mono font-bold text-[#bef264] text-xs">
                {pay.amount}
              </div>
            </div>
          ))}

          {/* Bottom Total Received Row */}
          <div className="pt-5 mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-white">Total received</span>
            <span className="font-mono font-black text-[#bef264] text-xs">৳1,11,981</span>
          </div>
        </div>
      </div>

    </div>
  );
}
