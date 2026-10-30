'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useArena, todayDhaka, collectedAmount } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { ShoppingBag, Star, Download, Upload, ChevronRight, AlertCircle, Award } from 'lucide-react';
export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};
/** Dhaka calendar date (YYYY-MM-DD) of an ISO timestamp. */
const dhakaDate = (iso) => {
    if (!iso) return '';
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso)); } catch { return String(iso).slice(0, 10); }
};

const StatusPill = ({ booking }) => {
    const b = booking;
    if (!b) return null;
    if (b.paymentStatus === 'cancelled') return <Pill color="rose" label="Cancelled" />;
    if (b.played) return <Pill color="cyan" label="Played" dot />;
    if (b.paymentStatus === 'paid_full') return <Pill color="emerald" label="Paid" dot />;
    if (b.paymentStatus === 'paid_advance') return <Pill color="emerald" label="Advance paid" dot pulse />;
    if (b.paymentStatus === 'confirmed_unpaid') return <Pill color="amber" label="Pay at arena" dot />;
    if (b.paymentStatus === 'needs_refund') return <Pill color="rose" label="Needs refund" />;
    if (b.paymentStatus === 'pending_payment') return <Pill color="slate" label="Paying…" dot pulse />;
    return <Pill color="slate" label={String(b.paymentStatus || '').replaceAll('_', ' ')} />;
};
const PILL_COLORS = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    slate: 'bg-slate-800/60 text-slate-300 border-white/10'
};
const DOT_COLORS = { cyan: 'bg-cyan-400', emerald: 'bg-emerald-400', amber: 'bg-amber-400', rose: 'bg-rose-400', slate: 'bg-slate-400' };
const Pill = ({ color, label, dot, pulse }) => (<span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1 ${PILL_COLORS[color]}`}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[color]} ${pulse ? 'animate-pulse' : ''}`}></span>}
    <span>{label}</span>
  </span>);

export default function AdminTodayPage() {
    const { bookings, pricing, refunds, shopReservations, registrations, matchResults, calculateMonthlyFinance, currentMonthFinance, exportDatabaseBackup, isLoadingData } = useArena();
    const todayStr = useMemo(() => todayDhaka(), []);
    const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);
    const financeReport = currentMonthFinance;

    // Today's play-date bookings (non-cancelled, excluding live gateway holds from the slot count)
    const todayBookings = useMemo(() => {
        return bookings.filter(b => b.date === todayStr && b.paymentStatus !== 'cancelled' && b.paymentStatus !== 'pending_payment');
    }, [bookings, todayStr]);

    // Money that actually arrived today (cash basis: paidAt, else createdAt, in Dhaka time)
    const todayCollected = useMemo(() => {
        return bookings.reduce((sum, b) => {
            if (b.isPublicView) return sum;
            const paidDay = dhakaDate(b.paidAt || b.createdAt);
            return paidDay === todayStr ? sum + collectedAmount(b) : sum;
        }, 0);
    }, [bookings, todayStr]);

    // Pending counts from live state
    const pendingOrdersCount = shopReservations.filter(r => r.status === 'reserved_pickup').length;
    const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length;
    const pendingRefundsCount = refunds.filter(r => r.status === 'pending').length;
    const pendingResultsCount = matchResults.filter(r => r.status === 'pending_approval').length;

    // 12 Slots for Today
    const todaySlots = useMemo(() => {
        const weekendDays = pricing?.weekendDays?.length ? pricing.weekendDays : ['Friday', 'Saturday'];
        const isWeekend = weekendDays.includes(DAY_NAMES[parseLocalDate(todayStr).getDay()]);
        const slotList = pricing?.slotPrices?.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION;
        return slotList.map(def => {
            const b = bookings.find(item => item.date === todayStr && Number(item.slotNumber) === Number(def.slotNumber) && item.paymentStatus !== 'cancelled');
            const price = Number(isWeekend ? def.weekendPrice : def.weekdayPrice) || 0;
            return { ...def, booking: b, price };
        });
    }, [bookings, todayStr, pricing?.slotPrices, pricing?.weekendDays]);

    // 6 months net profit from the finance engine; bar heights proportional to the largest absolute value
    const sixMonthsProfit = useMemo(() => {
        const result = [];
        const [currY, currM] = currentMonthStr.split('-').map(Number);
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currY, currM - 1 - i, 1);
            const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const mName = d.toLocaleDateString('en-US', { month: 'short' });
            const fin = mStr === currentMonthStr ? financeReport : calculateMonthlyFinance(mStr);
            result.push({ month: mName, net: fin.netProfit, isLoss: fin.netProfit <= 0 });
        }
        const maxAbs = Math.max(1, ...result.map(r => Math.abs(r.net)));
        return result.map(r => ({ ...r, valK: Math.round((r.net / 1000) * 10) / 10, height: r.net === 0 ? 4 : Math.max(6, (Math.abs(r.net) / maxAbs) * 100) }));
    }, [calculateMonthlyFinance, currentMonthStr, financeReport]);

    const dailyMax = useMemo(() => Math.max(1, ...financeReport.dailyBreakdown.map(d => d.slotsBooked)), [financeReport.dailyBreakdown]);

    const fmtK = (n) => `${n < 0 ? '-' : ''}৳${(Math.abs(n) / 1000).toFixed(1)}k`;

    if (isLoadingData && bookings.length === 0) {
        return (<div className="space-y-6 animate-pulse font-sans">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-[#0c131a] border border-white/5"/>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 rounded-2xl bg-[#0c131a] border border-white/5"/>)}</div>
            <div className="lg:col-span-5 space-y-4"><div className="h-56 rounded-3xl bg-[#0c131a] border border-white/5"/><div className="h-48 rounded-3xl bg-[#0c131a] border border-white/5"/></div>
          </div>
        </div>);
    }

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* 4 TOP KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[12px] text-slate-400">Today&apos;s slots</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            {todayBookings.length}/12
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {Math.max(0, 12 - todayBookings.length)} still open
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[12px] text-slate-400">Collected today</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            ৳{todayCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            Online + counter payments received today
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[12px] text-slate-400">Bookings · {parseLocalDate(todayStr).toLocaleDateString('en-US', { month: 'short' })}</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            {financeReport.slotsBooked}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {financeReport.occupancyRate.toFixed(0)}% occupancy
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c131a] border border-white/5 shadow-lg">
          <div className="text-[12px] text-slate-400">Net profit · month</div>
          <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'}`}>
            {fmtK(financeReport.netProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Rev ৳{(financeReport.totalRevenue / 1000).toFixed(0)}k · Exp ৳{(financeReport.totalExpenses / 1000).toFixed(0)}k
          </div>
        </div>

      </div>

      {/* ALERT BANNERS */}
      {(pendingOrdersCount > 0 || pendingRegistrationsCount > 0 || pendingRefundsCount > 0 || pendingResultsCount > 0) && (
        <div className="space-y-2">
          {pendingOrdersCount > 0 && (
            <Link href="/admin/shop-orders" className="p-3.5 rounded-2xl bg-amber-400/[0.04] border border-amber-400/20 hover:border-amber-400/40 flex items-center justify-between text-xs text-amber-300 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-amber-400"/>
                <span className="font-medium">{pendingOrdersCount} shop reservation(s) waiting for pickup</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform"/>
            </Link>
          )}

          {pendingRegistrationsCount > 0 && (
            <Link href="/admin/registrations" className="p-3.5 rounded-2xl bg-amber-400/[0.04] border border-amber-400/20 hover:border-amber-400/40 flex items-center justify-between text-xs text-amber-300 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400"/>
                <span className="font-medium">{pendingRegistrationsCount} event registration(s) to review</span>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform"/>
            </Link>
          )}

          {pendingRefundsCount > 0 && (
            <Link href="/admin/refunds" className="p-3.5 rounded-2xl bg-rose-400/[0.04] border border-rose-400/20 hover:border-rose-400/40 flex items-center justify-between text-xs text-rose-300 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400"/>
                <span className="font-medium">{pendingRefundsCount} refund(s) pending</span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform"/>
            </Link>
          )}

          {pendingResultsCount > 0 && (
            <Link href="/admin/match-results" className="p-3.5 rounded-2xl bg-lime-400/[0.04] border border-lime-400/20 hover:border-lime-400/40 flex items-center justify-between text-xs text-lime-300 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-lime-400"/>
                <span className="font-medium">{pendingResultsCount} match result(s) awaiting approval</span>
              </div>
              <ChevronRight className="w-4 h-4 text-lime-400 group-hover:translate-x-0.5 transition-transform"/>
            </Link>
          )}
        </div>
      )}

      {/* TWO COLUMNS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT COLUMN: TODAY'S SCHEDULE */}
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
            const isHold = b?.paymentStatus === 'pending_payment';
            const cardClass = !isBooked
                ? 'bg-[#0c131a] border-white/5 hover:border-lime-400/20'
                : b.played
                    ? 'bg-[#0a1118] border-cyan-500/20'
                    : isHold
                        ? 'bg-[#0c131a] border-white/10 border-dashed'
                        : b.paymentStatus === 'confirmed_unpaid'
                            ? 'bg-[#141108] border-amber-500/25'
                            : 'bg-[#0c1613] border-emerald-500/25';
            return (<div key={slot.slotNumber} className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${cardClass}`}>
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                    <span className="w-16 font-mono font-bold text-white shrink-0">
                      {slot.startTime} {Number(slot.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                    </span>

                    <div className="min-w-0">
                      {!isBooked ? (<div>
                          <span className="text-slate-300 font-medium">Not booked</span>
                          <span className="text-slate-500 font-mono text-[12px] ml-2">
                            ৳{slot.price.toLocaleString()}
                          </span>
                        </div>) : (<div>
                          <div className="text-white font-bold truncate">
                            {b.captainName || 'Booked'}
                            {b.teamName && (<span className="text-slate-400 font-normal ml-1 truncate hidden sm:inline">
                                · {b.teamName}
                              </span>)}
                            {b.isRecurring && (<span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">FIXED</span>)}
                          </div>
                          <div className="text-[12px] font-mono text-slate-400 mt-0.5">
                            ৳{(Number(b.advanceAmount) || 0).toLocaleString()} of ৳{(Number(b.totalPrice) || 0).toLocaleString()}
                            {Number(b.dueAmount) > 0 && b.paymentStatus !== 'pending_payment' && (<span className="text-amber-400 font-bold ml-1.5">(Due ৳{Number(b.dueAmount).toLocaleString()})</span>)}
                          </div>
                        </div>)}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <StatusPill booking={b} />
                  </div>

                </div>);
        })}
          </div>
        </div>

        {/* RIGHT COLUMN: CHARTS */}
        <div className="lg:col-span-5 space-y-4">

          <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Net profit · 6 months
              </h3>
              <p className="text-[11px] text-slate-500">Cash basis: money collected minus expenses</p>
            </div>

            <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
              {sixMonthsProfit.map(m => (<div key={m.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-400 mb-1">
                    {m.valK < 0 ? '-' : ''}৳{Math.abs(m.valK)}k
                  </span>

                  <div style={{ height: `${m.height}%` }} title={fmtK(m.net)} className={`w-full max-w-[28px] rounded-t-sm transition-all ${m.isLoss ? 'bg-rose-500' : 'bg-lime-400'}`}/>

                  <span className="text-[11px] font-mono text-slate-400 mt-2">
                    {m.month}
                  </span>
                </div>))}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Bookings per day · {parseLocalDate(`${currentMonthStr}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-[11px] text-slate-500">Slots by play date · busiest day {dailyMax} slot{dailyMax === 1 ? '' : 's'}</p>
            </div>

            <div className="h-28 flex items-end gap-1 pt-3">
              {financeReport.dailyBreakdown.map((d) => {
            const heightPct = d.slotsBooked === 0 ? 3 : Math.max(8, (d.slotsBooked / dailyMax) * 100);
            const isToday = d.date === todayStr;
            return (<div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <div style={{ height: `${heightPct}%` }} className={`w-full rounded-t-xs transition-all cursor-pointer ${d.slotsBooked === 0 ? 'bg-white/10' : isToday ? 'bg-emerald-300' : 'bg-lime-400'} hover:brightness-125`}/>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-6 bg-slate-900 border border-white/10 text-white text-[8px] font-mono py-0.5 px-1 rounded pointer-events-none z-10 whitespace-nowrap shadow">
                      {d.date.slice(8)}: {d.slotsBooked} booked · ৳{d.moneyCollected.toLocaleString()}
                    </div>
                  </div>);
        })}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
              <span>1</span>
              <span>6</span>
              <span>11</span>
              <span>16</span>
              <span>21</span>
              <span>26</span>
              <span>{financeReport.dailyBreakdown.length}</span>
            </div>
          </div>

          {/* Database Backup Utility Bar */}
          <div className="p-4 rounded-2xl bg-[#0c131a] border border-white/5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono text-[12px]">Database Tools:</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={exportDatabaseBackup} className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-lime-400 font-bold flex items-center gap-1 cursor-pointer">
                  <Download className="w-3.5 h-3.5"/>
                  <span>Export Backup</span>
                </button>

                <button type="button" disabled title="Restore from a JSON file is not supported. Data lives in MongoDB; backups are read-only exports." className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-500 font-bold flex items-center gap-1 cursor-not-allowed opacity-60">
                  <Upload className="w-3.5 h-3.5"/>
                  <span>Restore</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Backups are read-only JSON exports. Data lives in the MongoDB database; restore via your database tooling, not this panel.</p>
          </div>

        </div>

      </div>

    </div>);
}
