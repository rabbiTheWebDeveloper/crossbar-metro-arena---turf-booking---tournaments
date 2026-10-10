'use client';
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function InvestorBookingsPage() {
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
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(5);
    const currentMonthObj = months[selectedMonthIndex] || months[5];
    const [activeDailyBar, setActiveDailyBar] = useState(null);
    const [activeSlotBar, setActiveSlotBar] = useState(null);
    const handlePrevMonth = () => {
        if (selectedMonthIndex > 0)
            setSelectedMonthIndex(prev => prev - 1);
    };
    const handleNextMonth = () => {
        if (selectedMonthIndex < months.length - 1)
            setSelectedMonthIndex(prev => prev + 1);
    };
    // 30 days of daily bookings matching screenshot distribution
    const dailyBookingsData = useMemo(() => {
        const heights = [
            28, 38, 48, 62, 75, 85, 38, 48, 48, 48, 38, 42, 68, 75, 48, 55, 48, 48, 32, 55,
            62, 68, 62, 62, 62, 55, 68, 75, 55, 48
        ];
        return heights.map((h, index) => {
            const dayNum = index + 1;
            const count = Math.max(2, Math.round((h / 100) * 12));
            return {
                day: dayNum,
                heightPercent: h,
                count,
            };
        });
    }, []);
    // 12 slots matching screenshot: 6AM, 7½AM, 9AM, 10½AM, 12PM, 1½PM, 3PM, 4½PM, 6PM, 7½PM, 9PM, 10½PM
    const popularSlotsData = useMemo(() => [
        { label: '6AM', heightPercent: 32, count: 9 },
        { label: '7½AM', heightPercent: 40, count: 12 },
        { label: '9AM', heightPercent: 25, count: 7 },
        { label: '10½AM', heightPercent: 23, count: 6 },
        { label: '12PM', heightPercent: 48, count: 14 },
        { label: '1½PM', heightPercent: 14, count: 3 },
        { label: '3PM', heightPercent: 62, count: 19 },
        { label: '4½PM', heightPercent: 55, count: 17 },
        { label: '6PM', heightPercent: 88, count: 28 },
        { label: '7½PM', heightPercent: 72, count: 23 },
        { label: '9PM', heightPercent: 92, count: 29 },
        { label: '10½PM', heightPercent: 82, count: 25 },
    ], []);
    return (<div className="w-full max-w-2xl space-y-5 sm:space-y-6">
      
      {/* Month Selector Bar with Main Site Colors */}
      <div className="flex items-center justify-between py-1">
        <button onClick={handlePrevMonth} disabled={selectedMonthIndex === 0} className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" aria-label="Previous month">
          <ChevronLeft className="w-4 h-4"/>
        </button>

        <span className="text-xs sm:text-sm font-black tracking-widest font-mono text-white select-none">
          {currentMonthObj.label}
        </span>

        <button onClick={handleNextMonth} disabled={selectedMonthIndex === months.length - 1} className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" aria-label="Next month">
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>

      {/* Row of 4 KPI Cards (Responsive 2 cols on mobile, 4 on sm+) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Slots booked */}
        <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
          <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Slots booked</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">188</div>
        </div>

        {/* Booking amount */}
        <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
          <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Booking amount</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">৳479k</div>
        </div>

        {/* Collected */}
        <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
          <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Collected</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">৳483k</div>
        </div>

        {/* Cancelled */}
        <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
          <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Cancelled</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">6</div>
        </div>
      </div>

      {/* Card 1: Bookings per day */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Bookings per day</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tap a bar to see the value</p>
        </div>

        <div className="pt-2 sm:pt-4 pb-2">
          {/* Active bar tooltip indicator */}
          <div className="h-6 text-center flex items-center justify-center">
            {activeDailyBar !== null ? (<span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/25 shadow-xs">
                Day {dailyBookingsData[activeDailyBar].day}: {dailyBookingsData[activeDailyBar].count} bookings
              </span>) : (<span className="text-[11px] text-slate-500 font-mono">Select any bar for details</span>)}
          </div>

          {/* 30 Vertical Emerald Bars with responsive container */}
          <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="min-w-[300px]">
              <div className="h-36 flex items-end justify-between gap-[2px] sm:gap-1 px-0.5 mt-2">
                {dailyBookingsData.map((d, index) => {
            const isSelected = activeDailyBar === index;
            return (<div key={d.day} onClick={() => setActiveDailyBar(index)} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer" title={`Day ${d.day}: ${d.count} bookings`}>
                      <div style={{ height: `${d.heightPercent}%` }} className={`w-full rounded-xs transition-all duration-200 ${isSelected
                    ? 'bg-white shadow-lg shadow-white/30 scale-y-105'
                    : 'bg-emerald-400 hover:brightness-125'}`}/>
                    </div>);
        })}
              </div>

              {/* X-axis days aligned with columns 1, 6, 11, 16, 21, 26 */}
              <div className="relative h-6 mt-3 px-1 text-[11px] font-mono text-slate-400">
                <span className="absolute left-[1.5%] -translate-x-1/2">1</span>
                <span className="absolute left-[18%] -translate-x-1/2">6</span>
                <span className="absolute left-[35%] -translate-x-1/2">11</span>
                <span className="absolute left-[51.5%] -translate-x-1/2">16</span>
                <span className="absolute left-[68%] -translate-x-1/2">21</span>
                <span className="absolute left-[85%] -translate-x-1/2">26</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Most popular slots */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Most popular slots</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tap a bar to see the value</p>
        </div>

        <div className="pt-2 sm:pt-4 pb-2">
          {/* Active slot indicator */}
          <div className="h-6 text-center flex items-center justify-center">
            {activeSlotBar !== null ? (<span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/25 shadow-xs">
                {popularSlotsData[activeSlotBar].label}: {popularSlotsData[activeSlotBar].count} bookings
              </span>) : (<span className="text-[11px] text-slate-500 font-mono">Select any slot for details</span>)}
          </div>

          {/* 12 Vertical Emerald Bars with responsive touch support */}
          <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="min-w-[340px]">
              <div className="h-40 flex items-end justify-between gap-1.5 sm:gap-2.5 px-1 mt-2">
                {popularSlotsData.map((slot, index) => {
            const isSelected = activeSlotBar === index;
            return (<div key={slot.label} onClick={() => setActiveSlotBar(index)} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer" title={`${slot.label}: ${slot.count} bookings`}>
                      <div style={{ height: `${slot.heightPercent}%` }} className={`w-full rounded-xs transition-all duration-200 ${isSelected
                    ? 'bg-white shadow-lg shadow-white/30 scale-y-105'
                    : 'bg-emerald-400 hover:brightness-125'}`}/>
                      <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-3 whitespace-nowrap">
                        {slot.label}
                      </span>
                    </div>);
        })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>);
}
