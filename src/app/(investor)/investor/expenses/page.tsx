'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function InvestorExpensesPage() {
  // Months available
  const months = useMemo(() => [
    { key: '2026-04', label: 'APRIL 2026' },
    { key: '2026-05', label: 'MAY 2026' },
    { key: '2026-06', label: 'JUNE 2026' },
    { key: '2026-07', label: 'JULY 2026' },
    { key: '2026-08', label: 'AUGUST 2026' },
    { key: '2026-09', label: 'SEPTEMBER 2026' },
    { key: '2026-10', label: 'OCTOBER 2026' },
  ], []);

  // Default to September 2026 (index 5) matching screenshot
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(5);
  const currentMonthObj = months[selectedMonthIndex] || months[5];

  const handlePrevMonth = () => {
    if (selectedMonthIndex > 0) setSelectedMonthIndex(prev => prev - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex < months.length - 1) setSelectedMonthIndex(prev => prev + 1);
  };

  // Expenses By Category matching Screenshot 2
  const expensesByCategory = useMemo(() => [
    { name: 'Rent', amount: '৳1,20,000', barPercent: 88 },
    { name: 'Staff Salary', amount: '৳96,000', barPercent: 71 },
    { name: 'Electricity', amount: '৳38,239', barPercent: 28 },
    { name: 'Shop Stock', amount: '৳25,000', barPercent: 19 },
    { name: 'Maintenance', amount: '৳15,258', barPercent: 11 },
    { name: 'Marketing', amount: '৳8,000', barPercent: 6 },
    { name: 'Water', amount: '৳4,500', barPercent: 3.5 },
    { name: 'Internet', amount: '৳2,500', barPercent: 2 },
  ], []);

  // Itemized Invoices List matching Screenshot 2
  const itemizedExpensesList = useMemo(() => [
    { id: 'exp-1', category: 'Shop Stock', detail: '24 Sep · Jerseys & balls restock', amount: '৳25,000' },
    { id: 'exp-2', category: 'Marketing', detail: '20 Sep · Facebook ads', amount: '৳8,000' },
    { id: 'exp-3', category: 'Maintenance', detail: '18 Sep · Turf brushing & infill top-up', amount: '৳15,258' },
    { id: 'exp-4', category: 'Internet', detail: '14 Sep · Broadband', amount: '৳2,500' },
    { id: 'exp-5', category: 'Water', detail: '12 Sep · WASA bill', amount: '৳4,500' },
    { id: 'exp-6', category: 'Electricity', detail: '10 Sep · Floodlights & shop', amount: '৳38,239' },
  ], []);

  return (
    <div className="w-full max-w-2xl space-y-6">
      
      {/* Month Selector Bar matching Screenshot */}
      <div className="flex items-center justify-between py-2">
        <button
          onClick={handlePrevMonth}
          disabled={selectedMonthIndex === 0}
          className="w-8 h-8 rounded-lg bg-[#0e160e] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-sm font-black tracking-widest font-mono text-white select-none">
          {currentMonthObj.label}
        </span>

        <button
          onClick={handleNextMonth}
          disabled={selectedMonthIndex === months.length - 1}
          className="w-8 h-8 rounded-lg bg-[#0e160e] border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Card 1: BY CATEGORY with horizontal lime bars */}
      <div className="bg-[#0b100b] border border-white/[0.07] rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-black tracking-wider text-white uppercase font-sans">
            BY CATEGORY
          </span>
          <span className="text-xs font-mono font-black text-white">
            ৳3,09,497
          </span>
        </div>

        {/* 8 Category Progress Rows */}
        <div className="space-y-3.5 pt-1">
          {expensesByCategory.map(cat => (
            <div key={cat.name} className="flex items-center gap-4 text-xs font-sans">
              {/* Category Label */}
              <span className="w-24 shrink-0 text-zinc-300 font-medium">
                {cat.name}
              </span>

              {/* Horizontal Lime Bar */}
              <div className="flex-1 h-1.5 flex items-center">
                <div
                  style={{ width: `${cat.barPercent}%` }}
                  className="bg-[#bef264] h-1.5 rounded-full transition-all duration-300"
                />
              </div>

              {/* Category Amount */}
              <span className="w-20 shrink-0 text-right font-mono font-medium text-white">
                {cat.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Itemized Invoices List (Exact match to Screenshot 2) */}
      <div className="bg-[#0b100b] border border-white/[0.07] rounded-2xl p-6 sm:p-7 divide-y divide-white/[0.04]">
        {itemizedExpensesList.map(item => (
          <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white text-xs">{item.category}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{item.detail}</div>
            </div>
            <div className="font-mono text-white font-bold text-xs">
              {item.amount}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
