import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { WalkInBookingSheet } from '@/features/admin/WalkInBookingSheet';
import { useBookingDesk } from '@/features/admin/bookings/useBookingDesk';
import { buildDaySlots } from '@/features/admin/bookings/slots';
import { SlotRow } from '@/features/admin/bookings/SlotRow';
import { DateStrip } from '@/features/admin/schedule/DateStrip';
import { AppText, Button, DateField, Loading, Row } from '@/components/ui';
import { todayDhakaIso, addDaysIso, parseLocalDate, formatIsoDate, isWeekendDate, isIsoDate, SHORT_DAYS } from '@/lib/dateUtils';

/** Slot grid for any date: walk-in on free slots; collect, mark played or cancel on bookings. */
export default function AdminScheduleScreen() {
    const { bookings, pricing, isLoadingData } = useArena();
    const todayStr = todayDhakaIso();
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [walkInSlot, setWalkInSlot] = useState(null);
    const desk = useBookingDesk({ cancelWithName: true, unpaidLabel: 'Unpaid', holdLabel: 'Payment in progress (hold)' });

    // 14-day strip around today (6 before, 7 after) with the number of active bookings per day
    const dateStrip = useMemo(() => {
        const counts = {};
        bookings.forEach(b => { if (b.paymentStatus !== 'cancelled') counts[b.date] = (counts[b.date] || 0) + 1; });
        const dates = [];
        for (let i = -6; i <= 7; i++) {
            const iso = addDaysIso(todayStr, i);
            const d = parseLocalDate(iso);
            dates.push({ iso, dayName: SHORT_DAYS[d.getDay()].toUpperCase(), dayNum: d.getDate(), isToday: iso === todayStr, bookedCount: counts[iso] || 0 });
        }
        return dates;
    }, [bookings, todayStr]);
    const selectedInStrip = dateStrip.some(d => d.iso === selectedDate);

    const slots = useMemo(() => buildDaySlots(bookings, pricing, selectedDate), [bookings, pricing, selectedDate]);
    const weekend = isWeekendDate(selectedDate, pricing?.weekendDays);

    return (
        <AdminScreen title="Schedule" subtitle={formatIsoDate(selectedDate, { weekday: 'long', month: 'long' })}>
            <DateStrip dates={dateStrip} selected={selectedDate} onSelect={setSelectedDate} />

            <Row align="flex-end">
                <DateField label="Jump to date" value={selectedDate} onChange={(iso) => { if (isIsoDate(iso)) setSelectedDate(iso); }} style={{ flex: 1 }} />
                {!selectedInStrip ? <Button title="Back to today" variant="secondary" onPress={() => setSelectedDate(todayStr)} /> : null}
            </Row>

            <View style={{ gap: 2 }}>
                <AppText size="xs" tone="muted">Tap a free slot for a walk-in booking. On a booking, collect money, mark it played or cancel it.</AppText>
                {weekend ? <AppText size="xs" tone="brand" weight="700">Weekend rate applies on this date.</AppText> : null}
            </View>

            {isLoadingData && bookings.length === 0 ? <Loading label="Loading schedule…" /> : (
                <View style={{ gap: 8 }}>
                    {slots.map(slot => (
                        <SlotRow
                            key={slot.slotNumber}
                            slot={slot}
                            busy={!!slot.booking && desk.busyId === slot.booking.id}
                            unpaidLabel="Unpaid"
                            holdLabel="Payment hold"
                            onPress={desk.openBooking}
                            onCollect={desk.openCollect}
                            onMarkPlayed={desk.markPlayed}
                            onWalkIn={setWalkInSlot}
                        />
                    ))}
                </View>
            )}

            {desk.sheets}
            <WalkInBookingSheet visible={!!walkInSlot} onClose={() => setWalkInSlot(null)} initialDate={selectedDate} initialSlot={walkInSlot?.slotNumber} />
        </AdminScreen>
    );
}
