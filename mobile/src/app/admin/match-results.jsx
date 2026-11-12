import React, { useMemo, useState } from 'react';
import { Award } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { AppText, Segmented, EmptyState, Loading, Notice, confirm } from '@/components/ui';
import { usePaged, ShowMoreButton } from '@/features/admin/content/paging';
import { ResultCard } from '@/features/admin/match-results/ResultCard';
import { RESULT_TABS, EMPTY_COPY, sortResults } from '@/features/admin/match-results/helpers';

/** Admin · Match Results & Leaderboard Review: approve, publish, reject and delete scorelines. */
export default function AdminMatchResultsScreen() {
    const { matchResults, handleSaveMatchResult, handleDeleteMatchResult, showNotice, isLoadingData, pricing } = useArena();
    const [tab, setTab] = useState('pending_approval');
    const [busyId, setBusyId] = useState(null);

    const counts = useMemo(() => ({
        pending_approval: matchResults.filter(r => r.status === 'pending_approval').length,
        published: matchResults.filter(r => r.status === 'published').length,
        rejected: matchResults.filter(r => r.status === 'rejected').length
    }), [matchResults]);

    const list = useMemo(() => sortResults(matchResults.filter(r => r.status === tab)), [matchResults, tab]);
    const paged = usePaged(list, tab);

    // Publishing / rejecting re-syncs the league table on the server; the context reloads teams
    const setStatus = async (res, status) => {
        if (busyId) return;
        if (status === 'rejected') {
            const ok = await confirm('Reject scoreline?', `Reject the ${res.homeTeam} vs ${res.awayTeam} scoreline? It will not count in the league table.`, { confirmText: 'Reject', destructive: true });
            if (!ok) return;
        }
        setBusyId(res.id);
        const r = await handleSaveMatchResult({ id: res.id, status });
        setBusyId(null);
        if (!r?.ok) showNotice('error', r?.error || 'Could not update the result.');
    };

    const remove = async (res) => {
        if (busyId) return;
        const ok = await confirm(
            'Delete result?',
            `Delete the ${res.homeTeam} vs ${res.awayTeam} result permanently?${res.status === 'published' ? ' Team stats from this match will be reversed.' : ''}`,
            { confirmText: 'Delete', destructive: true }
        );
        if (!ok) return;
        setBusyId(res.id);
        const r = await handleDeleteMatchResult(res.id);
        setBusyId(null);
        if (r?.ok) showNotice('success', 'Match result deleted');
    };

    return (
        <AdminScreen title="Match results" subtitle="Results & leaderboard review">
            <AppText size="sm" tone="muted">
                Approve scorelines submitted by captains before they feed the public tables and squad rankings.
            </AppText>
            {pricing?.approveResultsFirst === false ? (
                <Notice type="warning" message="Approval is currently off (Slot pricing → rules): new submissions publish immediately." />
            ) : null}

            <Segmented
                scroll
                size="sm"
                value={tab}
                onChange={setTab}
                options={RESULT_TABS.map(t => ({ value: t.key, label: `${t.label} (${counts[t.key]})` }))}
            />

            {isLoadingData && matchResults.length === 0 ? (
                <Loading label="Loading match results…" />
            ) : list.length === 0 ? (
                <EmptyState icon={Award} message={EMPTY_COPY[tab]} />
            ) : (
                <>
                    {paged.visible.map(res => (
                        <ResultCard
                            key={res.id}
                            result={res}
                            busy={busyId === res.id}
                            onSetStatus={(status) => setStatus(res, status)}
                            onDelete={() => remove(res)}
                        />
                    ))}
                    <ShowMoreButton paged={paged} />
                </>
            )}
        </AdminScreen>
    );
}
