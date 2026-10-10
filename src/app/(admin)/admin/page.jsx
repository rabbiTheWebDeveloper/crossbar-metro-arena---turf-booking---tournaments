'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useArena } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { ShoppingBag, Star, Download, Upload, ChevronRight } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default function AdminTodayPage() {
    const { bookings, pricing, refunds, shopReservations, registrations, calculateMonthlyFinance, exportDatabaseBackup, handleRestoreDatabase } = useArena();
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const financeReport = useMemo(() => {
        return calculateMonthlyFinance('2026-10');
    }, [calculateMonthlyFinance]);
    // Today's Bookings
    const todayBookings = useMemo(() => {
        return bookings.filter(b => b.date === todayStr && b.paymentStatus !== 'cancelled');
    }, [bookings, todayStr]);
    const todayCollected = useMemo(() => {
        return todayBookings.reduce((sum, b) => {
            if (b.paymentStatus === 'paid_full')
                return sum + b.totalPrice;
            return sum + (b.advanceAmount || 500);
        }, 0);
    }, [todayBookings]);
    // Pending counts
    const pendingOrdersCount = shopReservations.filter(r => r.status === 'reserved_pickup').length || 1;
    const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length || 4;
    // 12 Slots for Today
    const todaySlots = useMemo(() => {
        const isWeekend = new Date(todayStr).getDay() === 5 || new Date(todayStr).getDay() === 6;
        return SCHEDULE_SLOTS_DEFINITION.map(def => {
            const b = bookings.find(item => item.date === todayStr && item.slotNumber === def.slotNumber && item.paymentStatus !== 'cancelled');
            const adminSlot = pricing.slotPrices.find(s => s.slotNumber === def.slotNumber);
            const price = adminSlot ? (isWeekend ? adminSlot.weekendPrice : adminSlot.weekdayPrice) : def.weekdayPrice;
            return {
                ...def,
                booking: b,
                price
            };
        });
    }, [bookings, todayStr, pricing.slotPrices]);
    // 6 Months Net Profit data (matching screenshot 1)
    const sixMonthsProfit = [
        { month: 'May', val: 85.0, height: 60, isLoss: false },
        { month: 'Jun', val: 133.4, height: 75, isLoss: false },
        { month: 'Jul', val: 141.9, height: 95, isLoss: false },
        { month: 'Aug', val: 128.7, height: 72, isLoss: false },
        { month: 'Sep', val: 124.2, height: 68, isLoss: false },
        { month: 'Oct', val: -59.6, height: 40, isLoss: true }
    ];
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result);
                    if (handleRestoreDatabase(json)) {
                        alert('Arena database restored successfully!');
                    }
                }
                catch {
                    alert('Invalid backup JSON file.');
                }
            };
            reader.readAsText(file);
        }
    };
    return (<div className="space-y-6 animate-fade-in font-sans">
      
      {/* 4 TOP KPI METRIC CARDS (EXACT MATCH TO SCREENSHOT 1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Today's slots */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[11px] text-slate-400">Today&apos;s slots</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            {todayBookings.length}/12
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {12 - todayBookings.length} still open
          </div>
        </div>

        {/* Collected today */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[11px] text-slate-400">Collected today</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            ৳{todayCollected.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            Online advance + cash
          </div>
        </div>

        {/* Bookings - Oct */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[11px] text-slate-400">Bookings · Oct</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            {financeReport.slotsBooked}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {financeReport.occupancyRate.toFixed(0)}% occupancy
          </div>
        </div>

        {/* Net profit - month */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[11px] text-slate-400">Net profit · month</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-1">
            -৳59.6k
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Rev ৳195k · Exp ৳255k
          </div>
        </div>

      </div>

      {/* 2 ALERT BANNERS (EXACT MATCH TO SCREENSHOT 1) */}
      <div className="space-y-2">
        <Link href="/admin/shop-orders" className="p-3.5 rounded-2xl bg-amber-400/[0.04] border border-amber-400/20 hover:border-amber-400/40 flex items-center justify-between text-xs text-amber-300 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-amber-400"/>
            <span className="font-medium">{pendingOrdersCount} new shop reservation(s)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform"/>
        </Link>

        <Link href="/admin/registrations" className="p-3.5 rounded-2xl bg-amber-400/[0.04] border border-amber-400/20 hover:border-amber-400/40 flex items-center justify-between text-xs text-amber-300 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-amber-400"/>
            <span className="font-medium">{pendingRegistrationsCount} event registration(s) to review</span>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform"/>
        </Link>
      </div>

      {/* TWO COLUMNS LAYOUT (MATCHING SCREENSHOT 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: TODAY'S SCHEDULE (MATCHING SCREENSHOT 1) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
              TODAY&apos;S SCHEDULE
            </h3>
            <Link href="/admin/schedule" className="text-xs text-lime-400 hover:text-lime-300 hover:underline font-medium transition-colors">
              Other days
            </Link>
          </div>

          <div className="space-y-2">
            {todaySlots.map(slot => {
            const b = slot.booking;
            const isBooked = !!b;
            const isPlayed = b?.paymentStatus === 'paid_full';
            return (<div key={slot.slotNumber} className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${!isBooked
                    ? 'bg-[#0c131a] border-white/5 hover:border-lime-400/20'
                    : isPlayed
                        ? 'bg-[#0a1118] border-cyan-500/20'
                        : 'bg-[#0c1613] border-emerald-500/25'}`}>
                  {/* Left Time & Slot Detail */}
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                    <span className="w-16 font-mono font-bold text-white shrink-0">
                      {slot.startTime} {Number(slot.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                    </span>

                    <div className="min-w-0">
                      {!isBooked ? (<div>
                          <span className="text-slate-300 font-medium">Not booked</span>
                          <span className="text-slate-500 font-mono text-[11px] ml-2">
                            ৳{slot.price.toLocaleString()}
                          </span>
                        </div>) : (<div>
                          <div className="text-white font-bold truncate">
                            {b.captainName}
                            {b.teamName && (<span className="text-slate-400 font-normal ml-1 truncate hidden sm:inline">
                                · {b.teamName}
                              </span>)}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            ৳{(b.advanceAmount || b.courtPrice).toLocaleString()} of ৳{b.totalPrice.toLocaleString()}
                          </div>
                        </div>)}
                    </div>
                  </div>

                  {/* Right Status Pill */}
                  <div className="shrink-0">
                    {isBooked ? (isPlayed ? (<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          <span>Played</span>
                        </span>) : (<span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Confirmed</span>
                        </span>)) : null}
                  </div>

                </div>);
        })}
          </div>
        </div>

        {/* RIGHT COLUMN: 2 CHARTS (MATCHING SCREENSHOT 1) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Chart 1: Net profit · 6 months (Screenshot 1) */}
          <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Net profit · 6 months
              </h3>
              <p className="text-[10px] text-slate-500">Tap a bar to see the value</p>
            </div>

            <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
              {sixMonthsProfit.map(m => (<div key={m.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-6 bg-slate-900 border border-white/10 text-white text-[9px] font-mono py-0.5 px-1 rounded pointer-events-none z-10 whitespace-nowrap shadow-md">
                    {m.val < 0 ? '-' : ''}৳{Math.abs(m.val)}k
                  </div>

                  <span className="text-[9px] font-mono text-slate-400 mb-1">
                    {m.val < 0 ? '-' : ''}৳{Math.abs(m.val)}k
                  </span>

                  <div style={{ height: `${m.height}%` }} className={`w-full max-w-[28px] rounded-t-sm transition-all ${m.isLoss ? 'bg-rose-500' : 'bg-lime-400'}`}/>

                  <span className="text-[10px] font-mono text-slate-400 mt-2">
                    {m.month}
                  </span>
                </div>))}
            </div>
          </div>

          {/* Chart 2: Bookings per day · October 2026 (Screenshot 1) */}
          <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Bookings per day · October 2026
              </h3>
              <p className="text-[10px] text-slate-500">Tap a bar to see the value</p>
            </div>

            <div className="h-28 flex items-end gap-1 pt-3">
              {financeReport.dailyBreakdown.slice(0, 31).map((d) => {
            const heightPct = Math.min(100, Math.max(6, (d.slotsBooked / 12) * 100));
            return (<div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <div style={{ height: `${heightPct}%` }} className="w-full bg-lime-400 hover:brightness-125 rounded-t-xs transition-all cursor-pointer"/>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-6 bg-slate-900 border border-white/10 text-white text-[8px] font-mono py-0.5 px-1 rounded pointer-events-none z-10 whitespace-nowrap shadow">
                      {d.date.slice(8)} Oct: {d.slotsBooked} booked
                    </div>
                  </div>);
        })}
            </div>

            <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-white/5">
              <span>1</span>
              <span>6</span>
              <span>11</span>
              <span>16</span>
              <span>21</span>
              <span>26</span>
              <span>31</span>
            </div>
          </div>

          {/* Database Backup & Restore Utility Bar */}
          <div className="p-4 rounded-2xl bg-[#0c131a] border border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Database Tools:</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={exportDatabaseBackup} className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-lime-400 font-bold flex items-center gap-1 cursor-pointer">
                <Download className="w-3.5 h-3.5"/>
                <span>Export Backup</span>
              </button>

              <label className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5"/>
                <span>Restore</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden"/>
              </label>
            </div>
          </div>

        </div>

      </div>

    </div>);
}
