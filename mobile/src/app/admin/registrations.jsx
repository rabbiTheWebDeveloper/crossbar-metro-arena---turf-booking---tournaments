import React, { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { AppText, SearchInput, Segmented, EmptyState, Loading } from '@/components/ui';
import { titleCase } from '@/lib/format';
import { usePaged, ShowMoreButton } from '@/features/admin/content/paging';
import { RegistrationCard } from '@/features/admin/registrations/RegistrationCard';
import { RegistrationEditSheet } from '@/features/admin/registrations/RegistrationEditSheet';
import { FILTERS, isConfirmed, matchesRegistration } from '@/features/admin/registrations/helpers';

/** Admin · Tournament registrations: verify payment, approve / reject, edit and delete entries. */
export default function AdminRegistrationsScreen() {
    const { registrations, handleUpdateRegistration, showNotice, isLoadingData } = useArena();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [editing, setEditing] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return registrations
            .filter(r => {
                if (filter === 'pending') return r.status === 'pending';
                if (filter === 'confirmed') return isConfirmed(r);
                if (filter === 'rejected') return r.status === 'rejected';
                return true;
            })
            .filter(r => matchesRegistration(r, q));
    }, [registrations, search, filter]);

    const counts = useMemo(() => ({
        all: registrations.length,
        pending: registrations.filter(r => r.status === 'pending').length,
        confirmed: registrations.filter(isConfirmed).length,
        rejected: registrations.filter(r => r.status === 'rejected').length
    }), [registrations]);

    const paged = usePaged(filtered, `${filter}|${search}`);

    const setStatus = async (reg, status) => {
        if (busyId) return;
        setBusyId(reg.id);
        try {
            await handleUpdateRegistration(reg.id, { status });
        } catch (err) {
            showNotice('error', err?.message || 'Could not update the registration.');
        } finally {
            setBusyId(null);
        }
    };

    const openEdit = (reg) => { setEditing(reg); setSheetOpen(true); };

    return (
        <AdminScreen title="Registrations" subtitle="Tournament registrations">
            <AppText size="sm" tone="muted">
                Every team that registered for a cup: squad list, captain contact, jersey colour and entry-fee payment. Open a card to view or edit any detail.
            </AppText>

            <SearchInput value={search} onChangeText={setSearch} placeholder="Team, captain, phone, player, cup..." />
            <Segmented
                scroll
                size="sm"
                value={filter}
                onChange={setFilter}
                options={FILTERS.map(f => ({ value: f, label: `${titleCase(f)} (${counts[f]})` }))}
            />

            {isLoadingData && registrations.length === 0 ? (
                <Loading label="Loading registrations…" />
            ) : filtered.length === 0 ? (
                <EmptyState icon={ClipboardCheck} message="No tournament registrations found." />
            ) : (
                <>
                    {paged.visible.map(reg => (
                        <RegistrationCard
                            key={reg.id}
                            registration={reg}
                            busy={busyId === reg.id}
                            onEdit={() => openEdit(reg)}
                            onSetStatus={(status) => setStatus(reg, status)}
                        />
                    ))}
                    <ShowMoreButton paged={paged} />
                </>
            )}

            <RegistrationEditSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} registration={editing} />
        </AdminScreen>
    );
}
