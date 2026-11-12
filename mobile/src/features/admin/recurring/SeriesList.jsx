import React, { useState } from 'react';
import { View } from 'react-native';
import { Repeat, XCircle } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AppText, Badge, Button, Card, EmptyState, Loading, Mono, Notice, Row, SearchInput, confirm } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { formatIsoDate } from '@/lib/dateUtils';

const PAGE = 30;

function SeriesCard({ item, busy, onCancel }) {
    const s = item;
    const finished = s.upcoming === 0;
    return (
        <Card style={{ gap: 6 }}>
            <Row justify="space-between" align="flex-start">
                <View style={{ flex: 1 }}>
                    <AppText size="md" weight="800">{s.teamName || 'Unnamed team'}</AppText>
                    <AppText size="xs" tone="muted">{`${s.captainName || '—'} · ${s.captainPhone || '—'}`}</AppText>
                </View>
                {finished ? <Badge label="Finished" tone="neutral" /> : <Badge label={`${s.upcoming} upcoming`} tone="success" />}
            </Row>
            <Mono size="xs" tone="dim" weight="600">{String(s.seriesId || '')}</Mono>
            <AppText size="xs" tone="soft">{`${formatIsoDate(s.firstDate, { weekday: false })} → ${formatIsoDate(s.lastDate, { weekday: false })}`}</AppText>
            <Row wrap gap={10}>
                <AppText size="xs" tone="muted">{`Slots ${(s.slots || []).join(', ')}`}</AppText>
                <AppText size="xs" weight="700">{`${s.active ?? 0} active`}</AppText>
                <Mono size="xs" tone="brand">{`${formatMoney(s.collected || 0)} of ${formatMoney(s.totalValue || 0)}`}</Mono>
            </Row>
            <Row wrap gap={8} style={{ marginTop: 4 }}>
                {!finished ? <Button title="Cancel upcoming" variant="warning" size="sm" disabled={busy} onPress={() => onCancel(s, 'upcoming')} /> : null}
                <Button title="Cancel entire series" icon={XCircle} variant="danger" size="sm" disabled={busy} onPress={() => onCancel(s, 'all')} />
            </Row>
        </Card>
    );
}

/**
 * Existing fixed-slot series with search and series-wide cancellation.
 *   series / loading / error / onReload: from useSeries()
 */
export function SeriesList({ series, loading, error, onReload }) {
    const { handleCancelSeries, showNotice } = useArena();
    const [search, setSearch] = useState('');
    const [count, setCount] = useState(PAGE);
    const [busyId, setBusyId] = useState(null);

    const q = search.trim().toLowerCase();
    const filtered = series.filter(s => !q
        || String(s.teamName || '').toLowerCase().includes(q)
        || String(s.captainName || '').toLowerCase().includes(q)
        || String(s.captainPhone || '').includes(q)
        || String(s.seriesId || '').toLowerCase().includes(q));
    const remaining = filtered.length - count;

    const cancelSeries = async (s, scope) => {
        if (busyId) return;
        const label = scope === 'all' ? 'ALL bookings (including past dates)' : 'all upcoming bookings';
        const ok = await confirm('Cancel series?', `Cancel ${label} in series ${s.seriesId} for ${s.teamName}?`, { confirmText: scope === 'all' ? 'Cancel entire series' : 'Cancel upcoming', cancelText: 'Keep', destructive: true });
        if (!ok) return;
        setBusyId(s.seriesId);
        try {
            const data = await handleCancelSeries(s.seriesId, scope); // also reloads the bookings
            showNotice('success', data?.message || 'Series cancelled');
            await onReload();
        } catch (err) {
            showNotice('error', err?.message || 'Could not cancel the series.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <View style={{ gap: 12 }}>
            <SearchInput value={search} onChangeText={(t) => { setSearch(t); setCount(PAGE); }} placeholder="Search team, captain, phone..." />
            {error ? <Notice type="error" message={error} /> : null}
            {loading && series.length === 0 ? <Loading label="Loading…" /> : filtered.length === 0 ? (
                <EmptyState icon={Repeat} title={series.length === 0 ? 'No recurring series yet.' : 'No series match your search.'} />
            ) : (
                <View style={{ gap: 8 }}>
                    {filtered.slice(0, count).map(s => <SeriesCard key={s.seriesId} item={s} busy={busyId === s.seriesId} onCancel={cancelSeries} />)}
                    {remaining > 0 ? <Button title={`Show more (${remaining} remaining)`} variant="secondary" onPress={() => setCount(c => c + PAGE)} /> : null}
                </View>
            )}
        </View>
    );
}
