import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { RefreshCw, UserX } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { PlayerCard } from '@/features/admin/players/PlayerCard';
import { EditPlayerSheet } from '@/features/admin/players/EditPlayerSheet';
import { ROLES, digitsOnly } from '@/features/admin/players/constants';
import { AppText, Button, EmptyState, Heading, IconButton, Loading, Row, SearchInput, Segmented, ToggleRow, confirm } from '@/components/ui';
import { titleCase } from '@/lib/format';

const PAGE_SIZE = 30;
const ROLE_FILTERS = [{ value: 'all', label: 'All roles' }, ...ROLES.map(r => ({ value: r, label: titleCase(r) }))];

/** Registered accounts: search, filter by role, edit profile / role / password, disable or re-enable. */
export default function AdminPlayersScreen() {
    const { users, teams, bookings, registrations, refreshUsers, handleAdminUpdateUser, showNotice, isLoadingData } = useArena();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showDisabled, setShowDisabled] = useState(false);
    const [editing, setEditing] = useState(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [busyId, setBusyId] = useState(null);
    const [reloading, setReloading] = useState(false);

    useEffect(() => { refreshUsers(); }, [refreshUsers]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users
            .filter(u => u.role !== 'visitor' || roleFilter === 'visitor')
            .filter(u => showDisabled || !u.disabled)
            .filter(u => roleFilter === 'all' || u.role === roleFilter)
            .filter(u => !q || String(u.name || '').toLowerCase().includes(q) || String(u.phone || '').includes(q) || String(u.email || '').toLowerCase().includes(q) || String(u.teamId || '').toLowerCase().includes(q))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [users, search, roleFilter, showDisabled]);

    // Activity per phone number: active bookings and tournament entries
    const activity = useMemo(() => {
        const bookingCounts = {};
        const cupCounts = {};
        bookings.forEach(b => {
            if (b.paymentStatus === 'cancelled') return;
            const phone = digitsOnly(b.captainPhone);
            if (phone) bookingCounts[phone] = (bookingCounts[phone] || 0) + 1;
        });
        registrations.forEach(r => {
            const phone = digitsOnly(r.captainPhone);
            if (phone) cupCounts[phone] = (cupCounts[phone] || 0) + 1;
        });
        return { bookingCounts, cupCounts };
    }, [bookings, registrations]);
    const statsFor = (u) => {
        const phone = digitsOnly(u.phone);
        return { bookings: activity.bookingCounts[phone] || 0, tournaments: activity.cupCounts[phone] || 0 };
    };

    const teamNames = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t.name])), [teams]);

    const counts = useMemo(() => ({
        total: users.filter(u => u.role !== 'visitor' && !u.disabled).length,
        players: users.filter(u => u.role === 'player' && !u.disabled).length,
        disabled: users.filter(u => u.disabled).length
    }), [users]);

    const resetPage = () => setVisibleCount(PAGE_SIZE);

    const reload = async () => {
        if (reloading) return;
        setReloading(true);
        try { await refreshUsers(); } finally { setReloading(false); }
    };

    const quickToggleDisabled = async (u) => {
        if (busyId) return;
        const action = u.disabled ? 'Re-enable' : 'Disable';
        const ok = await confirm(`${action} account?`, `${action} account for ${u.name} (${u.phone})?`, { confirmText: action, destructive: !u.disabled });
        if (!ok) return;
        setBusyId(u.id);
        try {
            await handleAdminUpdateUser(u.id, { disabled: !u.disabled });
            showNotice('success', u.disabled ? 'Account re-enabled' : 'Account disabled');
        } catch (err) {
            showNotice('error', err?.message || 'Could not update the account.');
        } finally {
            setBusyId(null);
        }
    };

    const remaining = filtered.length - visibleCount;

    return (
        <AdminScreen title="Registered players" subtitle="Accounts and roles" onRefresh={refreshUsers}>
            <View style={{ gap: 4 }}>
                <Heading level={3}>Registered players</Heading>
                <AppText size="sm" tone="muted">
                    Every account created on the website or the app (sign-up / player profile). View details, fix a phone number, change a role or disable an account.
                </AppText>
                <Row wrap gap={12} style={{ marginTop: 4 }}>
                    <AppText size="xs" tone="muted" mono>
                        <AppText size="xs" weight="800" mono>{String(counts.total)}</AppText>
                        {' active accounts'}
                    </AppText>
                    <AppText size="xs" tone="muted" mono>
                        <AppText size="xs" weight="800" tone="brand" mono>{String(counts.players)}</AppText>
                        {' players'}
                    </AppText>
                    <AppText size="xs" tone="muted" mono>
                        <AppText size="xs" weight="800" tone="danger" mono>{String(counts.disabled)}</AppText>
                        {' disabled'}
                    </AppText>
                </Row>
            </View>

            <Row align="flex-start">
                <SearchInput value={search} onChangeText={(t) => { setSearch(t); resetPage(); }} placeholder="Name, phone, email, team..." style={{ flex: 1 }} />
                <IconButton icon={RefreshCw} onPress={reload} disabled={reloading} size={46} accessibilityLabel="Reload from database" />
            </Row>
            <Segmented scroll size="sm" value={roleFilter} onChange={(v) => { setRoleFilter(v); resetPage(); }} options={ROLE_FILTERS} />
            <ToggleRow label="Show disabled" value={showDisabled} onValueChange={(v) => { setShowDisabled(!!v); resetPage(); }} />

            {isLoadingData && users.length === 0 ? <Loading label="Loading players…" /> : filtered.length === 0 ? (
                <EmptyState icon={UserX} title="No players match." />
            ) : (
                <View style={{ gap: 8 }}>
                    {filtered.slice(0, visibleCount).map(u => (
                        <PlayerCard
                            key={u.id}
                            user={u}
                            stats={statsFor(u)}
                            teamLabel={u.teamId ? (teamNames[u.teamId] || u.teamId) : ''}
                            busy={busyId === u.id}
                            onEdit={setEditing}
                            onToggleDisabled={quickToggleDisabled}
                        />
                    ))}
                    {remaining > 0 ? <Button title={`Show more (${remaining} remaining)`} variant="secondary" onPress={() => setVisibleCount(c => c + PAGE_SIZE)} /> : null}
                </View>
            )}

            <EditPlayerSheet user={editing} onClose={() => setEditing(null)} />
        </AdminScreen>
    );
}
