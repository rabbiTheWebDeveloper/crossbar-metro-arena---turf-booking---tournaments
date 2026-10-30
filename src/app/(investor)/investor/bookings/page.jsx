'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function InvestorBookingsPage() {
    const { calculateMonthlyFinance } = useArena();

    // Rolling 7 months list up to current date
    const months = useMemo(() => {
        const list = [];
        const base = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
            const short = d.toLocaleDateString('en-US', { month: 'short' });
            list.push({ key, label, short });
        }
        return list;
    }, []);

    // Default to the current/latest month
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => months.length - 1);
    const currentMonthObj = months[selectedMonthIndex] || months[months.length - 1] || { key: '2026-10', label: 'OCTOBER 2026' };
    const selectedMonth = currentMonthObj.key;

    const [activeDailyBar, setActiveDailyBar] = useState(null);
    const [activeSlotBar, setActiveSlotBar] = useState(null);

    const handlePrevMonth = () => {
        if (selectedMonthIndex > 0) {
            setSelectedMonthIndex(prev => prev - 1);
            setActiveDailyBar(null);
            setActiveSlotBar(null);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonthIndex < months.length - 1) {
            setSelectedMonthIndex(prev => prev + 1);
            setActiveDailyBar(null);
            setActiveSlotBar(null);
        }
    };

    // Calculate live financial and booking statistics from MongoDB records
    const finance = useMemo(() => {
        return calculateMonthlyFinance(selectedMonth);
    }, [calculateMonthlyFinance, selectedMonth]);

    const formatBDT = (num) => `৳${Number(num || 0).toLocaleString('en-IN')}`;

    // Live daily bookings breakdown from real MongoDB bookings
    const dailyBookingsData = useMemo(() => {
        const breakdown = finance.dailyBreakdown || [];
        const maxDaily = Math.max(1, ...breakdown.map(d => d.slotsBooked || 0));

        return breakdown.map((item, index) => {
            const dayNum = index + 1;
            const count = item.slotsBooked || 0;
            const heightPercent = count > 0
                ? Math.min(100, Math.max(12, Math.round((count / maxDaily) * 100)))
                : 4;

            return {
                day: dayNum,
                date: item.date,
                count,
                moneyCollected: item.moneyCollected || 0,
                heightPercent,
            };
        });
    }, [finance.dailyBreakdown]);

    // Live slot distribution matching the 12 daily arena slots
    const popularSlotsData = useMemo(() => {
        const slotDefinitions = [
            { num: 1, label: '6AM' },
            { num: 2, label: '7½AM' },
            { num: 3, label: '9AM' },
            { num: 4, label: '10½AM' },
            { num: 5, label: '12PM' },
            { num: 6, label: '1½PM' },
            { num: 7, label: '3PM' },
            { num: 8, label: '4½PM' },
            { num: 9, label: '6PM' },
            { num: 10, label: '7½PM' },
            { num: 11, label: '9PM' },
            { num: 12, label: '10½PM' },
        ];

        const slotMap = {};
        if (finance.popularSlotsRanking) {
            finance.popularSlotsRanking.forEach(s => {
                slotMap[s.slotNumber] = s.count || 0;
            });
        }

        const counts = slotDefinitions.map(s => slotMap[s.num] || 0);
        const maxSlot = Math.max(1, ...counts);

        return slotDefinitions.map(s => {
            const count = slotMap[s.num] || 0;
            const heightPercent = count > 0
                ? Math.min(100, Math.max(12, Math.round((count / maxSlot) * 100)))
                : 6;

            return {
                slotNumber: s.num,
                label: s.label,
                count,
                heightPercent,
            };
        });
    }, [finance.popularSlotsRanking]);

    return (
        <div className="w-full max-w-3xl space-y-5 sm:space-y-6">
            {/* Month Selector Bar with Main Site Colors */}
            <div className="flex items-center justify-between py-1 max-w-md">
                <button
                    onClick={handlePrevMonth}
                    disabled={selectedMonthIndex === 0}
                    className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs sm:text-sm font-black tracking-widest font-mono text-white select-none">
                    {currentMonthObj.label}
                </span>

                <button
                    onClick={handleNextMonth}
                    disabled={selectedMonthIndex === months.length - 1}
                    className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    aria-label="Next month"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Row of 4 KPI Cards connected to live MongoDB data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Slots booked */}
                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
                    <div className="text-[12px] sm:text-xs text-slate-400 font-medium">Slots booked</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                        {finance.slotsBooked}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                        {finance.occupancyRate.toFixed(1)}% occupancy
                    </div>
                </div>

                {/* Booking amount */}
                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
                    <div className="text-[12px] sm:text-xs text-slate-400 font-medium">Booking amount</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                        ৳{Math.round((finance.bookingMoneyCollected + finance.dueAmountTotal) / 1000)}k
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {formatBDT(finance.bookingMoneyCollected + finance.dueAmountTotal)}
                    </div>
                </div>

                {/* Collected */}
                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
                    <div className="text-[12px] sm:text-xs text-slate-400 font-medium">Collected</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
                        ৳{Math.round(finance.bookingMoneyCollected / 1000)}k
                    </div>
                    <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5 truncate">
                        {formatBDT(finance.bookingMoneyCollected)}
                    </div>
                </div>

                {/* Cancelled */}
                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
                    <div className="text-[12px] sm:text-xs text-slate-400 font-medium">Cancelled</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-1">
                        {finance.cancellationsCount}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {finance.cancellationsAmount > 0 ? formatBDT(finance.cancellationsAmount) : '0 refunds'}
                    </div>
                </div>
            </div>

            {/* Card 1: Bookings per day */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Bookings per day</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Tap a bar to see daily volume</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[12px] font-mono text-slate-400">Total days: </span>
                        <span className="text-xs font-mono font-bold text-white">{dailyBookingsData.length}</span>
                    </div>
                </div>

                <div className="pt-2 sm:pt-4 pb-2">
                    {/* Active bar tooltip indicator */}
                    <div className="h-7 text-center flex items-center justify-center">
                        {activeDailyBar !== null && dailyBookingsData[activeDailyBar] ? (
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/25 shadow-xs">
                                Day {dailyBookingsData[activeDailyBar].day} ({dailyBookingsData[activeDailyBar].date}): {dailyBookingsData[activeDailyBar].count} slot{dailyBookingsData[activeDailyBar].count === 1 ? '' : 's'} booked · {formatBDT(dailyBookingsData[activeDailyBar].moneyCollected)}
                            </span>
                        ) : (
                            <span className="text-[12px] text-slate-500 font-mono">Select any bar for details</span>
                        )}
                    </div>

                    {/* Daily Vertical Emerald Bars */}
                    <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                        <div className="min-w-[320px]">
                            <div className="h-36 flex items-end justify-between gap-[2px] sm:gap-1 px-0.5 mt-2">
                                {dailyBookingsData.map((d, index) => {
                                    const isSelected = activeDailyBar === index;
                                    return (
                                        <div
                                            key={d.day}
                                            onClick={() => setActiveDailyBar(index)}
                                            className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                                            title={`Day ${d.day}: ${d.count} bookings (${formatBDT(d.moneyCollected)})`}
                                        >
                                            <div
                                                style={{ height: `${d.heightPercent}%` }}
                                                className={`w-full rounded-xs transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-white shadow-lg shadow-white/30 scale-y-105'
                                                        : d.count > 0
                                                        ? 'bg-emerald-400 hover:brightness-125'
                                                        : 'bg-slate-800/60 hover:bg-slate-700'
                                                }`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* X-axis days markers */}
                            <div className="relative h-6 mt-3 px-1 text-[12px] font-mono text-slate-400">
                                <span className="absolute left-[1.5%] -translate-x-1/2">1</span>
                                <span className="absolute left-[18%] -translate-x-1/2">6</span>
                                <span className="absolute left-[35%] -translate-x-1/2">11</span>
                                <span className="absolute left-[51.5%] -translate-x-1/2">16</span>
                                <span className="absolute left-[68%] -translate-x-1/2">21</span>
                                <span className="absolute left-[85%] -translate-x-1/2">26</span>
                                {dailyBookingsData.length >= 30 && (
                                    <span className="absolute left-[98%] -translate-x-1/2">{dailyBookingsData.length}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 2: Most popular slots */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Most popular slots</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Ranked by monthly booking demand</p>
                    </div>
                </div>

                <div className="pt-2 sm:pt-4 pb-2">
                    {/* Active slot indicator */}
                    <div className="h-7 text-center flex items-center justify-center">
                        {activeSlotBar !== null && popularSlotsData[activeSlotBar] ? (
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/25 shadow-xs">
                                Slot {popularSlotsData[activeSlotBar].label}: {popularSlotsData[activeSlotBar].count} total booking{popularSlotsData[activeSlotBar].count === 1 ? '' : 's'}
                            </span>
                        ) : (
                            <span className="text-[12px] text-slate-500 font-mono">Select any slot for details</span>
                        )}
                    </div>

                    {/* 12 Vertical Emerald Bars with responsive touch support */}
                    <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                        <div className="min-w-[340px]">
                            <div className="h-40 flex items-end justify-between gap-1.5 sm:gap-2.5 px-1 mt-2">
                                {popularSlotsData.map((slot, index) => {
                                    const isSelected = activeSlotBar === index;
                                    return (
                                        <div
                                            key={slot.label}
                                            onClick={() => setActiveSlotBar(index)}
                                            className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                                            title={`${slot.label}: ${slot.count} bookings`}
                                        >
                                            <div
                                                style={{ height: `${slot.heightPercent}%` }}
                                                className={`w-full rounded-xs transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-white shadow-lg shadow-white/30 scale-y-105'
                                                        : slot.count > 0
                                                        ? 'bg-emerald-400 hover:brightness-125'
                                                        : 'bg-slate-800/60 hover:bg-slate-700'
                                                }`}
                                            />
                                            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-3 whitespace-nowrap">
                                                {slot.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

