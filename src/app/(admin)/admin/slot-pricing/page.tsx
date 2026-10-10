'use client';

import React, { useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { PricingConfig, SlotPriceItem } from '@/types';
import {
  Tag,
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminSlotPricingPage() {
  const { pricing, handleSavePricing } = useArena();

  const [slotPrices, setSlotPrices] = useState<SlotPriceItem[]>(pricing.slotPrices);
  const [advanceAmount, setAdvanceAmount] = useState<number>(pricing.advanceAmount || 500);
  const [holdMinutes, setHoldMinutes] = useState<number>(pricing.holdMinutes || 10);
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(pricing.bookingWindowDays || 60);
  const [cancellationHours, setCancellationHours] = useState<number>(pricing.cancellationHours || 24);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdatePrice = (slotNum: number, field: 'weekdayPrice' | 'weekendPrice', val: number) => {
    setSlotPrices(prev =>
      prev.map(item => (item.slotNumber === slotNum ? { ...item, [field]: val } : item))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: PricingConfig = {
      ...pricing,
      slotPrices,
      advanceAmount,
      holdMinutes,
      bookingWindowDays,
      cancellationHours
    };

    handleSavePricing(newConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
            24 Slot Pricing Matrix &amp; Turf Rules
          </h2>
          <p className="text-xs text-slate-400">
            Customize morning, prime evening, and weekend rates for all 12 operational slots.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-lime-400" />
            <span>Pricing Matrix Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Arena Rules & Policy Settings */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            <span>Booking Rules &amp; Hold Timeouts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Advance Booking Deposit (৳)</label>
              <input
                type="number"
                value={advanceAmount}
                onChange={e => setAdvanceAmount(Number(e.target.value))}
                className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Player advance payment</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Slot Hold Lock (Minutes)</label>
              <input
                type="number"
                value={holdMinutes}
                onChange={e => setHoldMinutes(Number(e.target.value))}
                className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Auto-expires unpaid locks</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Booking Window (Days)</label>
              <input
                type="number"
                value={bookingWindowDays}
                onChange={e => setBookingWindowDays(Number(e.target.value))}
                className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">How far ahead players can book</span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cancellation Cutoff (Hours)</label>
              <input
                type="number"
                value={cancellationHours}
                onChange={e => setCancellationHours(Number(e.target.value))}
                className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">Advance refund eligible before kickoff</span>
            </div>
          </div>
        </div>

        {/* 24-Slot Pricing Table */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-lime-400" />
              <span>12 Slot Schedule Matrix (All 24 Rates)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Weekday: Sun-Thu · Weekend: Fri-Sat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-500 uppercase border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Time Window</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Weekday Price (৳)</th>
                  <th className="py-2.5 px-3">Weekend Price (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {slotPrices.map(slot => (
                  <tr key={slot.slotNumber} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-bold text-white font-sans">
                      Slot {slot.slotNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {slot.displayTime}
                    </td>
                    <td className="py-2 px-3 uppercase text-[10px] text-slate-400 font-sans">
                      {slot.period}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={slot.weekdayPrice}
                        onChange={e => handleUpdatePrice(slot.slotNumber, 'weekdayPrice', Number(e.target.value))}
                        className="w-28 bg-[#080d12] border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={slot.weekendPrice}
                        onChange={e => handleUpdatePrice(slot.slotNumber, 'weekendPrice', Number(e.target.value))}
                        className="w-28 bg-[#080d12] border border-white/10 rounded-lg px-2.5 py-1 text-lime-400 font-bold font-mono text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-lime-400/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save 24-Slot Matrix &amp; Rules</span>
          </button>
        </div>

      </form>

    </div>
  );
}
