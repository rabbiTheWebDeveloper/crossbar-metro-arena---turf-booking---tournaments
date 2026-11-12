import React, { useMemo, useState } from 'react';
import { Plus, Trophy } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { AppText, Button, EmptyState, Loading, confirm } from '@/components/ui';
import { TournamentCard } from '@/features/admin/events/TournamentCard';
import { TournamentFormSheet } from '@/features/admin/events/TournamentFormSheet';

const STATUS_CONFIRM = {
    closed: { title: 'Close registration?', verb: 'Close registration for', confirmText: 'Close registration' },
    open: { title: 'Reopen registration?', verb: 'Reopen registration for', confirmText: 'Reopen' }
};

/** Admin · Tournaments & Events Hub: create, edit, open / close registration and delete tournaments. */
export default function AdminEventsScreen() {
    const { tournaments, registrations, handleSaveTournament, handleDeleteTournament, showNotice, isLoadingData } = useArena();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const sorted = useMemo(() => [...tournaments].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))), [tournaments]);

    // Registrations that still count against a tournament (everything except rejected)
    const regCounts = useMemo(() => {
        const map = {};
        registrations.forEach(r => {
            if (r.status !== 'rejected' && r.tournamentId) map[r.tournamentId] = (map[r.tournamentId] || 0) + 1;
        });
        return map;
    }, [registrations]);
    const regCount = (t) => regCounts[t.id] || 0;

    const openAdd = () => { setEditing(null); setSheetOpen(true); };
    const openEdit = (t) => { setEditing(t); setSheetOpen(true); };

    const setStatus = async (t, status) => {
        if (busyId) return;
        const copy = STATUS_CONFIRM[status] || { title: 'Mark completed?', verb: 'Mark completed:', confirmText: 'Confirm' };
        const ok = await confirm(copy.title, `${copy.verb} "${t.title}"?`, { confirmText: copy.confirmText });
        if (!ok) return;
        setBusyId(t.id);
        const res = await handleSaveTournament({ id: t.id, status });
        setBusyId(null);
        if (!res?.ok) showNotice('error', res?.error || 'Could not update the tournament.');
    };

    const remove = async (t) => {
        if (busyId) return;
        const regs = regCount(t);
        const ok = await confirm('Delete tournament?', `Delete "${t.title}" permanently?${regs ? ` ${regs} registration(s) reference it.` : ''}`, { confirmText: 'Delete', destructive: true });
        if (!ok) return;
        setBusyId(t.id);
        const res = await handleDeleteTournament(t.id);
        setBusyId(null);
        if (res?.ok) showNotice('success', 'Tournament deleted');
    };

    return (
        <AdminScreen title="Events" subtitle="Tournaments & Events Hub">
            <AppText size="sm" tone="muted">
                Organize official cups, knockouts, prize pools, and seasonal corporate leagues.
            </AppText>
            <Button title="Create Tournament" icon={Plus} onPress={openAdd} block />

            {isLoadingData && tournaments.length === 0 ? (
                <Loading label="Loading tournaments…" />
            ) : sorted.length === 0 ? (
                <EmptyState icon={Trophy} message="No tournaments yet. Create one to open registrations on the public events page." />
            ) : (
                sorted.map(t => (
                    <TournamentCard
                        key={t.id}
                        tournament={t}
                        registered={Math.max(Number(t.registeredCount) || 0, regCount(t))}
                        busy={busyId === t.id}
                        onEdit={() => openEdit(t)}
                        onSetStatus={(status) => setStatus(t, status)}
                        onDelete={() => remove(t)}
                    />
                ))
            )}

            <TournamentFormSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} tournament={editing} />
        </AdminScreen>
    );
}
