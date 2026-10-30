'use client';
import React, { useState, useMemo } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { formatMoney, formatDate, buildMonthList, slotShortLabel } from '@/data/finance';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function InvestorBookingsPage() {
    const { calculateMonthlyFinance, pricing, isLoadingData } = useArena();

    const months = useMemo(() => buildMonthList(todayDhaka().slice(0, 7), 7), []);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => months.length - 1);
    const currentMonthObj = months[selectedMonthIndex] || months[months.length - 1];
    const selectedMonth = currentMonthObj.key;

    const [activeDailyBar, setActiveDailyBar] = useState(null);
    const [activeSlotBar, setActiveSlotBar] = useState(null);

    const handlePrevMonth = () => {
        if (selectedMonthIndex > 0) { setSelectedMonthIndex(prev => prev - 1); setActiveDailyBar(null); setActiveSlotBar(null); }
    };
    const handleNextMonth = () => {
        if (selectedMonthIndex < months.length - 1) { setSelectedMonthIndex(prev => prev + 1); setActiveDailyBar(null); setActiveSlotBar(null); }
    };

    const finance = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);

    // Daily bars: money collected per day (same cash-basis figure the KPI cards use)
    const dailyBookingsData = useMemo(() => {
        const breakdown = finance.dailyBreakdown || [];
        const maxDaily = Math.max(1, ...breakdown.map(d => d.moneyCollected || 0));
        return breakdown.map((item, index) => {
            const money = item.moneyCollected || 0;
            return {
                day: index + 1,
                date: item.date,
                count: item.slotsBooked || 0,
                moneyCollected: money,
                heightPercent: money > 0 ? Math.min(100, Math.max(12, Math.round((money / maxDaily) * 100))) : 4
            };
        });
    }, [finance.dailyBreakdown]);

    // X-axis markers positioned proportionally: (day - 1) / (days - 1)
    const axisDays = useMemo(() => {
        const len = dailyBookingsData.length;
        if (len === 0) return [];
        const days = [1, 6, 11, 16, 21, 26].filter(d => d < len);
        days.push(len);
        return days.map(d => ({ day: d, left: len > 1 ? ((d - 1) / (len - 1)) * 100 : 0 }));
    }, [dailyBookingsData.length]);

    // Slot distribution labelled from the live pricing schedule
    const popularSlotsData = useMemo(() => {
        const slotDefs = (pricing?.slotPrices?.length ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION);
        const slotMap = {};
        (finance.popularSlotsRanking || []).forEach(s => { slotMap[s.slotNumber] = s.count || 0; });
        const maxSlot = Math.max(1, ...slotDefs.map(s => slotMap[s.slotNumber] || 0));
        return slotDefs.map(s => {
            const count = slotMap[s.slotNumber] || 0;
            return {
                slotNumber: s.slotNumber,
                label: slotShortLabel(s.displayTime, s.slotNumber),
                fullLabel: s.displayTime || `Slot ${s.slotNumber}`,
                count,
                heightPercent: count > 0 ? Math.min(100, Math.max(12, Math.round((count / maxSlot) * 100))) : 6
            };
        });
    }, [finance.popularSlotsRanking, pricing]);

    if (isLoadingData && finance.slotsBooked === 0 && finance.totalRevenue === 0) {
        return (<div className="w-full max-w-3xl space-y-5" aria-busy="true">
            <div className="h-8 w-56 rounded-xl bg-white/5 animate-pulse"/>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1, 2, 3, 4].map(n => <div key={n} className="h-20 rounded-xl bg-white/5 animate-pulse"/>)}</div>
            <div className="h-56 rounded-2xl bg-white/5 animate-pulse"/>
            <div className="h-56 rounded-2xl bg-white/5 animate-pulse"/>
        </div>);
    }

    return (
        <div className="w-full max-w-3xl space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between py-1 max-w-md">
                <button onClick={handlePrevMonth} disabled={selectedMonthIndex === 0} className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" aria-label="Previous month">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-black tracking-widest font-mono text-white select-none">
                    {currentMonthObj.label}
                </span>
                <button onClick={handleNextMonth} disabled={selectedMonthIndex === months.length - 1} className="w-8 h-8 rounded-xl bg-[#0c131a] border border-emerald-500/25 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer" aria-label="Next month">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
                    <div className="text-[12px] sm:text-xs text-slate-400 font-medium">Slots booked</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">{finance.slotsBooked}</div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{finance.occupancyRate.toFixed(1)}% occupancy</div>
                </div>

                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
                    <div className="text-[12px] sm:text-xs text-slate-400 font-medium">Booking amount</div>
                    <div className="text-lg sm:text-xl font-black font-mono text-white mt-1 truncate">{formatMoney(finance.bookingMoneyCollected + finance.dueAmountTotal)}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">incl. due {formatMoney(finance.dueAmountTotal)}</div>
                </div>

                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
                    <div className="text-[12px] sm:text-xs text-slate-400 font-medium">Collected</div>
                    <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 mt-1 truncate">{formatMoney(finance.bookingMoneyCollected)}</div>
                    <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5 truncate">refunded {formatMoney(finance.refundsAmount)}</div>
                </div>

                <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-xl p-3.5 sm:p-4 hover:border-emerald-500/35 transition-colors">
                    <div className="text-[12px] sm:text-xs text-slate-400 font-medium">Cancelled</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-1">{finance.cancellationsCount}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">Advance on cancelled {formatMoney(finance.cancellationsAmount)}</div>
                </div>
            </div>

            {/* Money collected per day */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Money collected per day</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Tap a bar to see the day's slots and cash</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[12px] font-mono text-slate-400">Days: </span>
                        <span className="text-xs font-mono font-bold text-white">{dailyBookingsData.length}</span>
                    </div>
                </div>

                <div className="pt-2 sm:pt-4 pb-2">
                    <div className="h-7 text-center flex items-center justify-center">
                        {activeDailyBar !== null && dailyBookingsData[activeDailyBar] ? (
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/25 shadow-xs">
                                {formatDate(dailyBookingsData[activeDailyBar].date)}: {dailyBookingsData[activeDailyBar].count} slot{dailyBookingsData[activeDailyBar].count === 1 ? '' : 's'} · {formatMoney(dailyBookingsData[activeDailyBar].moneyCollected)} collected
                            </span>
                        ) : (
                            <span className="text-[12px] text-slate-500 font-mono">Select any bar for details</span>
                        )}
                    </div>

                    <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                        <div className="min-w-[320px]">
                            <div className="h-36 flex items-end justify-between gap-[2px] sm:gap-1 px-0.5 mt-2">
                                {dailyBookingsData.map((d, index) => {
                                    const isSelected = activeDailyBar === index;
                                    return (
                                        <button
                                            type="button"
                                            key={d.date}
                                            onClick={() => setActiveDailyBar(index)}
                                            className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                                            title={`${formatDate(d.date)}: ${d.count} slots, ${formatMoney(d.moneyCollected)} collected`}
                                            aria-pressed={isSelected}
                                        >
                                            <div
                                                style={{ height: `${d.heightPercent}%` }}
                                                className={`w-full rounded-xs transition-all duration-200 ${isSelected
                                                    ? 'bg-white shadow-lg shadow-white/30 scale-y-105'
                                                    : d.moneyCollected > 0
                                                        ? 'bg-emerald-400 hover:brightness-125'
                                                        : 'bg-slate-800/60 hover:bg-slate-700'}`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative h-6 mt-3 text-[12px] font-mono text-slate-400">
                                {axisDays.map(a => (
                                    <span key={a.day} style={{ left: `${a.left}%` }} className="absolute -translate-x-1/2">{a.day}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Most popular slots */}
            <div className="bg-[#0c131a]/95 border border-emerald-500/15 rounded-2xl p-4 sm:p-6 space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-white">Most popular slots</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Bookings per slot this month</p>
                </div>

                <div className="pt-2 sm:pt-4 pb-2">
                    <div className="h-7 text-center flex items-center justify-center">
                        {activeSlotBar !== null && popularSlotsData[activeSlotBar] ? (
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/25 shadow-xs">
                                {popularSlotsData[activeSlotBar].fullLabel}: {popularSlotsData[activeSlotBar].count} booking{popularSlotsData[activeSlotBar].count === 1 ? '' : 's'}
                            </span>
                        ) : (
                            <span className="text-[12px] text-slate-500 font-mono">Select any slot for details</span>
                        )}
                    </div>

                    <div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
                        <div className="min-w-[420px]">
                            <div className="h-40 flex items-end justify-between gap-1.5 sm:gap-2.5 px-1 mt-2">
                                {popularSlotsData.map((slot, index) => {
                                    const isSelected = activeSlotBar === index;
                                    return (
                                        <button
                                            type="button"
                                            key={slot.slotNumber}
                                            onClick={() => setActiveSlotBar(index)}
                                            className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer min-w-0"
                                            title={`${slot.fullLabel}: ${slot.count} bookings`}
                                            aria-pressed={isSelected}
                                        >
                                            <div
                                                style={{ height: `${slot.heightPercent}%` }}
                                                className={`w-full rounded-xs transition-all duration-200 ${isSelected
                                                    ? 'bg-white shadow-lg shadow-white/30 scale-y-105'
                                                    : slot.count > 0
                                                        ? 'bg-emerald-400 hover:brightness-125'
                                                        : 'bg-slate-800/60 hover:bg-slate-700'}`}
                                            />
                                            <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-3 whitespace-nowrap">
                                                {slot.label}
                                            </span>
                                        </button>
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
