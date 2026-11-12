import React, { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { AppText, SearchInput, Segmented, EmptyState, Loading, confirm } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { usePaged, ShowMoreButton } from '@/features/admin/content/paging';
import { OrderCard } from '@/features/admin/shop-orders/OrderCard';

const FILTERS = [
    { key: 'reserved_pickup', label: 'Awaiting pickup' },
    { key: 'collected', label: 'Collected' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'all', label: 'All' }
];

/** Admin · Counter Shop Reservations & Orders: hand over reserved items, mark collected or cancel. */
export default function AdminShopOrdersScreen() {
    const { shopReservations, handleUpdateShopReservationStatus, showNotice, isLoadingData } = useArena();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('reserved_pickup');
    const [busyId, setBusyId] = useState(null);
    const [errors, setErrors] = useState({});

    const counts = useMemo(() => ({
        reserved_pickup: shopReservations.filter(r => r.status === 'reserved_pickup').length,
        collected: shopReservations.filter(r => r.status === 'collected').length,
        cancelled: shopReservations.filter(r => r.status === 'cancelled').length,
        all: shopReservations.length
    }), [shopReservations]);

    const filteredOrders = useMemo(() => {
        const q = search.trim().toLowerCase();
        return shopReservations
            .filter(res => filter === 'all' || res.status === filter)
            .filter(res => {
                if (!q) return true;
                const items = (res.items || []).map(i => i.name).join(' ');
                return [res.productName, res.customerName, res.customerPhone, res.reservationCode, items].some(v => String(v || '').toLowerCase().includes(q));
            })
            .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }, [shopReservations, search, filter]);

    const paged = usePaged(filteredOrders, `${filter}|${search}`);

    const setStatus = async (res, status) => {
        if (busyId) return;
        const amount = formatMoney(Number(res.totalAmount) || 0);
        if (status === 'cancelled') {
            const ok = await confirm('Cancel order?', `Cancel order ${res.reservationCode}?`, { confirmText: 'Cancel order', cancelText: 'Keep', destructive: true });
            if (!ok) return;
        }
        if (status === 'collected') {
            const ok = await confirm('Mark collected?', `Mark ${res.reservationCode} as collected and paid (${amount})? Stock will be deducted and the sale recorded as income.`, { confirmText: 'Mark collected' });
            if (!ok) return;
        }
        setErrors(prev => ({ ...prev, [res.id]: '' }));
        setBusyId(res.id);
        const r = await handleUpdateShopReservationStatus(res.id, status);
        setBusyId(null);
        if (r?.ok) showNotice('success', status === 'collected' ? `${res.reservationCode} collected · ${amount} recorded as shop income` : `${res.reservationCode} cancelled`);
        else setErrors(prev => ({ ...prev, [res.id]: r?.error || 'Could not update the order.' }));
    };

    return (
        <AdminScreen title="Shop orders" subtitle="Counter reservations & orders">
            <AppText size="sm" tone="muted">
                Hand over reserved items at the counter. Marking an order collected deducts stock and records the sale.
            </AppText>

            <SearchInput value={search} onChangeText={setSearch} placeholder="Search by code, customer or product..." />
            <Segmented
                scroll
                size="sm"
                value={filter}
                onChange={setFilter}
                options={FILTERS.map(f => ({ value: f.key, label: `${f.label} (${counts[f.key]})` }))}
            />

            {isLoadingData && shopReservations.length === 0 ? (
                <Loading label="Loading shop orders…" />
            ) : filteredOrders.length === 0 ? (
                <EmptyState icon={ShoppingBag} message={filter === 'reserved_pickup' ? 'No orders waiting for pickup.' : 'No shop orders found.'} />
            ) : (
                <>
                    {paged.visible.map(res => (
                        <OrderCard
                            key={res.id}
                            order={res}
                            busy={busyId === res.id}
                            error={errors[res.id]}
                            onSetStatus={(status) => setStatus(res, status)}
                        />
                    ))}
                    <ShowMoreButton paged={paged} />
                </>
            )}
        </AdminScreen>
    );
}
