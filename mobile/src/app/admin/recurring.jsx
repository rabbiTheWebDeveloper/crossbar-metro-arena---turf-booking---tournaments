import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { Repeat, Search, CheckCircle2 } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { useSeries } from '@/features/admin/recurring/useSeries';
import { useRecurringBooking } from '@/features/admin/recurring/useRecurringBooking';
import { RecurringForm } from '@/features/admin/recurring/RecurringForm';
import { PreviewPanel, ResultCard } from '@/features/admin/recurring/PreviewPanel';
import { SeriesList } from '@/features/admin/recurring/SeriesList';
import { AppText, Button, Heading, Notice, Row, Segmented } from '@/components/ui';
import { colors, radius } from '@/theme';

/** Fixed weekly slots: book many dates in one go (with a dry-run preview) and manage existing series. */
export default function AdminRecurringScreen() {
    const { refreshBookings } = useArena();
    const [tab, setTab] = useState('new');
    const scrollRef = useRef(null);
    const { series, loading, error: seriesError, loadSeries } = useSeries();

    // Bring the preview / result / error (rendered at the end of the form) into view
    const scrollToFeedback = useCallback(() => {
        setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollToEnd({ animated: true }); }, 200);
    }, []);
    const form = useRecurringBooking({ onCreated: loadSeries, onFeedback: scrollToFeedback });
    const working = form.isChecking || form.isSubmitting;

    const refresh = useCallback(() => Promise.all([loadSeries(), refreshBookings()]), [loadSeries, refreshBookings]);

    const footer = tab === 'new' ? (
        <Row>
            <Button title="Check availability" icon={Search} variant="secondary" loading={form.isChecking} disabled={working} onPress={form.handlePreview} style={{ flex: 1 }} />
            <Button
                title={form.preview ? `Create ${form.preview.summary?.bookable || 0} bookings` : 'Create bookings'}
                icon={CheckCircle2}
                loading={form.isSubmitting}
                disabled={working}
                onPress={form.handleCreate}
                style={{ flex: 1.2 }}
            />
        </Row>
    ) : null;

    return (
        <AdminScreen title="Fixed weekly slots" subtitle="Bulk booking for regular squads" scrollRef={scrollRef} onRefresh={refresh} footer={footer}>
            <Segmented
                value={tab}
                onChange={setTab}
                options={[
                    { value: 'new', label: 'New series' },
                    { value: 'series', label: 'Existing series', badge: series.length || undefined }
                ]}
            />

            {tab === 'new' ? (
                <>
                    <Row align="flex-start" gap={12}>
                        <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' }}>
                            <Repeat size={20} color={colors.brand} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                            <Heading level={3}>Book multiple slots at once</Heading>
                            <AppText size="sm" tone="muted">
                                For regular customers who take the same weekly slot for a month or the whole year. Pick the weekdays, the time slots and a date range; every matching date is booked in one go. Already-booked slots are detected before anything is saved.
                            </AppText>
                        </View>
                    </Row>

                    <RecurringForm form={form} />
                    <ResultCard result={form.result} />
                    <PreviewPanel preview={form.preview} skipConflicts={form.skipConflicts} />
                    {form.error ? <Notice type="error" message={form.error} /> : null}
                </>
            ) : (
                <>
                    <Heading level={3}>Existing fixed-slot series</Heading>
                    <SeriesList series={series} loading={loading} error={seriesError} onReload={loadSeries} />
                </>
            )}
        </AdminScreen>
    );
}
