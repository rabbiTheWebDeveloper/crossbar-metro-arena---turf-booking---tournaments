import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { AppText, Button, Card, Label, Mono, Row } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';
import { formatMoney } from '@/lib/format';
import { formatIsoDate } from '@/lib/dateUtils';

const PAGE = 30;

function Tile({ value, label, color = colors.text }) {
    return (
        <View style={styles.tile}>
            <AppText size="xl" weight="900" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
            <AppText size="xs" tone="muted">{label}</AppText>
        </View>
    );
}

/** A long list shown a page at a time (a series can hold hundreds of dates). */
function PagedList({ items, renderItem }) {
    const [count, setCount] = useState(PAGE);
    const remaining = items.length - count;
    return (
        <View style={{ gap: 4 }}>
            {items.slice(0, count).map(renderItem)}
            {remaining > 0 ? <Button title={`Show more (${remaining} remaining)`} variant="ghost" size="sm" onPress={() => setCount(c => c + PAGE)} /> : null}
        </View>
    );
}

/** Confirmation of the series that was just created. */
export function ResultCard({ result }) {
    if (!result) return null;
    const s = result.summary || {};
    return (
        <Card tone="success" style={{ gap: 6, backgroundColor: colors.successSoft }}>
            <Row align="flex-start">
                <CheckCircle2 size={16} color={colors.brand} style={{ marginTop: 2 }} />
                <AppText size="sm" weight="800" tone="brand" style={{ flex: 1 }}>{result.message || 'Bookings created.'}</AppText>
            </Row>
            <Mono size="xs" tone="soft" weight="600">{`Series ID: ${result.seriesId || '—'}`}</Mono>
            <AppText size="xs" tone="muted">
                {`${s.firstDate || '—'} → ${s.lastDate || '—'} · ${s.created ?? 0} created · ${s.conflicts ?? 0} skipped · value ${formatMoney(s.totalValue || 0)}`}
            </AppText>
        </Card>
    );
}

/**
 * Dry-run result: totals, clashes with existing bookings and every date that will be booked.
 *   preview: { summary: { bookable, conflicts, dates, totalValue }, plan: [], conflicts: [] } | null
 */
export function PreviewPanel({ preview, skipConflicts }) {
    const summary = preview?.summary || {};
    const conflicts = Array.isArray(preview?.conflicts) ? preview.conflicts : [];
    const plan = Array.isArray(preview?.plan) ? preview.plan : [];

    return (
        <Card style={{ gap: spacing.md }}>
            <Label>Preview</Label>
            {!preview ? (
                <AppText size="sm" tone="dim">
                    Fill the form and press Check availability to see every date that will be booked, the price of each, and any clashes.
                </AppText>
            ) : (
                <>
                    <View style={styles.tiles}>
                        <Tile value={String(summary.bookable ?? 0)} label="bookable slots" />
                        <Tile value={String(summary.conflicts ?? 0)} label="already booked" color={colors.warning} />
                        <Tile value={String(summary.dates ?? 0)} label="match days" />
                        <Tile value={formatMoney(summary.totalValue || 0)} label="total slot value" color={colors.brand} />
                    </View>

                    {conflicts.length > 0 ? (
                        <View style={{ gap: 6 }}>
                            <Label tone="warning">{`Clashes ${skipConflicts ? '(will be skipped)' : '(blocking)'}`}</Label>
                            <PagedList
                                key={`c${conflicts.length}`}
                                items={conflicts}
                                renderItem={(c) => (
                                    <View key={`${c.date}-${c.slotNumber}`} style={[styles.line, { backgroundColor: colors.warningSoft, borderColor: tones.warning.border }]}>
                                        <Mono size="xs" tone="soft" weight="600" style={{ flex: 1 }}>{`${formatIsoDate(c.date)} · ${c.displayTime}`}</Mono>
                                        <AppText size="xs" tone="warning" numberOfLines={1} style={{ maxWidth: '40%' }}>{c.bookedBy || 'Booked'}</AppText>
                                    </View>
                                )}
                            />
                        </View>
                    ) : null}

                    {plan.length > 0 ? (
                        <View style={{ gap: 6 }}>
                            <Label>Dates to book</Label>
                            <PagedList
                                key={`p${plan.length}`}
                                items={plan}
                                renderItem={(p) => (
                                    <View key={`${p.date}-${p.slotNumber}`} style={styles.line}>
                                        <Mono size="xs" tone="soft" weight="600" style={{ flex: 1 }}>{`${formatIsoDate(p.date)} · ${p.displayTime}`}</Mono>
                                        <Mono size="xs" tone="brand">{formatMoney(p.price)}</Mono>
                                    </View>
                                )}
                            />
                        </View>
                    ) : null}
                </>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.glass },
    line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
