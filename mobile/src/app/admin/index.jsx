import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarCheck, Banknote, Layers, TrendingUp } from 'lucide-react-native';
import { useArena, collectedAmount } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { WalkInBookingSheet } from '@/features/admin/WalkInBookingSheet';
import { useBookingDesk } from '@/features/admin/bookings/useBookingDesk';
import { buildDaySlots } from '@/features/admin/bookings/slots';
import { SlotRow } from '@/features/admin/bookings/SlotRow';
import { PendingAlerts } from '@/features/admin/today/PendingAlerts';
import { ShortcutGrid } from '@/features/admin/today/ShortcutGrid';
import { ProfitBars } from '@/features/admin/today/ProfitBars';
import { DailyBookingsChart } from '@/features/admin/today/DailyBookingsChart';
import { DatabaseTools } from '@/features/admin/today/DatabaseTools';
import { SectionHeader, StatCard, StatGrid, Loading, Notice } from '@/components/ui';
import { todayDhakaIso, dhakaDate, formatIsoDate, formatMonth, buildMonthList } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';

const fmtK = (n) => `${n < 0 ? '-' : ''}৳${(Math.abs(n) / 1000).toFixed(1)}k`;

/** Arena Desk home: today's 12 slots, cash collected, pending work and month charts. */
export default function AdminTodayScreen() {
    const router = useRouter();
    const { bookings, pricing, currentMonthFinance, calculateMonthlyFinance, isLoadingData, loadError } = useArena();
    const desk = useBookingDesk({ cancelWithName: true });
    const [walkInSlot, setWalkInSlot] = useState(null);

    const todayStr = todayDhakaIso();
    const currentMonth = todayStr.slice(0, 7);
    const finance = currentMonthFinance;

    // Today's play-date bookings (cancelled ones and live gateway holds do not count as booked)
    const todayBookedCount = useMemo(
        () => bookings.filter(b => b.date === todayStr && b.paymentStatus !== 'cancelled' && b.paymentStatus !== 'pending_payment').length,
        [bookings, todayStr]
    );

    // Money that actually arrived today (cash basis: paidAt, else createdAt, in Dhaka time)
    const todayCollected = useMemo(() => bookings.reduce((sum, b) => {
        if (b.isPublicView) return sum;
        const stamp = b.paidAt || b.createdAt;
        return stamp && dhakaDate(stamp) === todayStr ? sum + collectedAmount(b) : sum;
    }, 0), [bookings, todayStr]);

    const todaySlots = useMemo(() => buildDaySlots(bookings, pricing, todayStr), [bookings, pricing, todayStr]);

    // Six months of net profit from the finance engine
    const sixMonths = useMemo(() => buildMonthList(currentMonth, 6).map(m => {
        const fin = m.key === currentMonth ? finance : calculateMonthlyFinance(m.key);
        return { key: m.key, label: m.short, net: Number(fin.netProfit) || 0 };
    }), [calculateMonthlyFinance, currentMonth, finance]);

    const title = `Today · ${formatIsoDate(todayStr, { year: false })}`;

    if (isLoadingData && bookings.length === 0) {
        return (
            <AdminScreen title={title} subtitle="Arena Desk">
                <Loading label="Loading today's desk…" />
            </AdminScreen>
        );
    }

    return (
        <AdminScreen title={title} subtitle="Arena Desk · live schedule, cash and gate">
            {loadError ? <Notice type="error" message={loadError} /> : null}

            <StatGrid>
                <StatCard label="Today's slots" value={`${todayBookedCount}/12`} hint={`${Math.max(0, 12 - todayBookedCount)} still open`} icon={CalendarCheck} tone="neutral" />
                <StatCard label="Collected today" value={formatMoney(todayCollected)} hint="Online + counter payments received today" icon={Banknote} tone="brand" />
                <StatCard label={`Bookings · ${formatMonth(currentMonth, { month: 'short', year: false })}`} value={String(finance.slotsBooked)} hint={`${finance.occupancyRate.toFixed(0)}% occupancy`} icon={Layers} tone="neutral" />
                <StatCard
                    label="Net profit · month"
                    value={fmtK(finance.netProfit)}
                    hint={`Rev ৳${(finance.totalRevenue / 1000).toFixed(0)}k · Exp ৳${(finance.totalExpenses / 1000).toFixed(0)}k`}
                    icon={TrendingUp}
                    tone={finance.isLossMonth ? 'danger' : 'success'}
                />
            </StatGrid>

            <PendingAlerts />

            <View>
                <SectionHeader title="Today's schedule" subtitle="Tap a booking for all actions. Free slots can be booked at the counter." action="Other days" onAction={() => router.navigate('/admin/schedule')} />
                <View style={{ gap: 8 }}>
                    {todaySlots.map(slot => (
                        <SlotRow
                            key={slot.slotNumber}
                            slot={slot}
                            busy={!!slot.booking && desk.busyId === slot.booking.id}
                            onPress={desk.openBooking}
                            onCollect={desk.openCollect}
                            onMarkPlayed={desk.markPlayed}
                            onWalkIn={setWalkInSlot}
                        />
                    ))}
                </View>
            </View>

            <View>
                <SectionHeader title="Arena Desk sections" />
                <ShortcutGrid />
            </View>

            <ProfitBars months={sixMonths} />
            <DailyBookingsChart month={currentMonth} days={finance.dailyBreakdown} today={todayStr} />
            <DatabaseTools />

            {desk.sheets}
            <WalkInBookingSheet visible={!!walkInSlot} onClose={() => setWalkInSlot(null)} initialDate={todayStr} initialSlot={walkInSlot?.slotNumber} />
        </AdminScreen>
    );
}
