import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { useBookingDesk } from '@/features/admin/bookings/useBookingDesk';
import { BookingCard } from '@/features/admin/bookings/BookingCard';
import { AppText, Button, EmptyState, Loading, Row, SearchInput, Segmented } from '@/components/ui';

const PAGE_SIZE = 30;
const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'balance_due', label: 'Balance due' },
    { value: 'paid', label: 'Paid' },
    { value: 'played', label: 'Played' },
    { value: 'cancelled', label: 'Cancelled' }
];

/** Every booking: search, filter by payment state, collect dues, mark played, cancel. */
export default function AdminAllBookingsScreen() {
    const { bookings, isLoadingData, refreshBookings } = useArena();
    const desk = useBookingDesk();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Filtered and sorted (newest play date first, then latest slot)
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = bookings.filter(b => {
            if (b.isPublicView) return false;
            if (q) {
                const hay = [b.teamName, b.captainName, b.captainPhone, b.bookingCode, b.date, b.seriesLabel].map(x => String(x || '').toLowerCase());
                if (!hay.some(h => h.includes(q))) return false;
            }
            const due = Number(b.dueAmount) || 0;
            switch (filterStatus) {
                case 'unpaid': return b.paymentStatus === 'confirmed_unpaid';
                case 'balance_due': return due > 0 && !['cancelled', 'pending_payment'].includes(b.paymentStatus);
                case 'paid': return b.paymentStatus === 'paid_full';
                case 'played': return !!b.played && b.paymentStatus !== 'cancelled';
                case 'cancelled': return b.paymentStatus === 'cancelled';
                default: return true;
            }
        });
        return list.sort((a, b) => (a.date === b.date ? Number(b.slotNumber) - Number(a.slotNumber) : (a.date < b.date ? 1 : -1)));
    }, [bookings, search, filterStatus]);

    const visible = filtered.slice(0, visibleCount);
    const remaining = filtered.length - visibleCount;

    const changeSearch = (text) => { setSearch(text); setVisibleCount(PAGE_SIZE); };
    const changeFilter = (key) => { setFilterStatus(key); setVisibleCount(PAGE_SIZE); };

    return (
        <AdminScreen title="All bookings" subtitle="Search, filter, collect dues" onRefresh={refreshBookings}>
            <Row align="flex-start">
                <SearchInput value={search} onChangeText={changeSearch} placeholder="Search by code, name, phone, team or date..." style={{ flex: 1 }} />
                {search ? <Button title="Reset" variant="secondary" onPress={() => changeSearch('')} style={{ minHeight: 46 }} /> : null}
            </Row>

            <Segmented scroll size="sm" value={filterStatus} onChange={changeFilter} options={FILTERS} />

            <AppText size="xs" tone="dim" mono>{`${filtered.length} booking${filtered.length === 1 ? '' : 's'} · newest play date first`}</AppText>

            {isLoadingData && bookings.length === 0 ? <Loading label="Loading bookings…" /> : filtered.length === 0 ? (
                <EmptyState icon={SearchX} title="No bookings found" message="No bookings found matching your search." />
            ) : (
                <View style={{ gap: 8 }}>
                    {visible.map(b => (
                        <BookingCard
                            key={b.id}
                            booking={b}
                            busy={desk.busyId === b.id}
                            onPress={desk.openBooking}
                            onCollect={desk.openCollect}
                            onMarkPlayed={desk.markPlayed}
                        />
                    ))}
                    {remaining > 0 ? <Button title={`Show more (${remaining} remaining)`} variant="secondary" onPress={() => setVisibleCount(c => c + PAGE_SIZE)} style={{ marginTop: 4 }} /> : null}
                </View>
            )}

            {desk.sheets}
        </AdminScreen>
    );
}
