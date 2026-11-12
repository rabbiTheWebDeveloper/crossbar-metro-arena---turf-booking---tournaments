import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Card, AppText, HBar, Stack } from '@/components/ui';
import { formatMoney, formatDate } from '@/data/finance';
import { CardHeader } from './CardHeader';
import { TapBarChart, ChartDetail } from './TapBarChart';

/**
 * "Money collected per day" chart: one tappable bar per day of the month.
 * Shared by the investor Bookings tab and the admin financial report.
 *   breakdown: finance.dailyBreakdown      monthKey: resets the selected bar when the month changes
 *   minPercent / zeroPercent: bar heights for the smallest paid day / an empty day
 *   formatDetail(day): text shown for the tapped bar
 */
export function DailyMoneyCard({ breakdown = [], monthKey, title = 'Money collected per day', subtitle, placeholder = 'Select any bar for details', minPercent = 12, zeroPercent = 4, formatDetail, right }) {
    const [selection, setSelection] = useState({ key: monthKey, index: null });
    const activeIndex = selection.key === monthKey ? selection.index : null;

    const bars = useMemo(() => {
        const max = Math.max(1, ...breakdown.map(d => d.moneyCollected || 0));
        return breakdown.map(d => {
            const money = d.moneyCollected || 0;
            const slots = d.slotsBooked || 0;
            return {
                key: d.date,
                active: money > 0,
                heightPercent: money > 0 ? Math.min(100, Math.max(minPercent, Math.round((money / max) * 100))) : zeroPercent,
                a11y: `${formatDate(d.date)}: ${slots} slots, ${formatMoney(money)} collected`
            };
        });
    }, [breakdown, minPercent, zeroPercent]);

    // Day-of-month markers under the bars: 1, 6, 11 … and the last day
    const ticks = useMemo(() => {
        const len = breakdown.length;
        if (len === 0) return [];
        const days = [1, 6, 11, 16, 21, 26].filter(d => d < len);
        days.push(len);
        return days;
    }, [breakdown.length]);

    const activeDay = activeIndex !== null ? breakdown[activeIndex] : null;
    const detail = activeDay
        ? (formatDetail ? formatDetail(activeDay) : `${formatDate(activeDay.date)}: ${formatMoney(activeDay.moneyCollected)}`)
        : '';

    return (
        <Card>
            <Stack gap={12}>
                <CardHeader title={title} subtitle={subtitle} right={right} />
                <ChartDetail text={detail} placeholder={placeholder} />
                <TapBarChart
                    data={bars}
                    height={132}
                    gap={2}
                    selectedIndex={activeIndex}
                    onSelect={(index) => setSelection({ key: monthKey, index })}
                    ticks={ticks}
                />
            </Stack>
        </Card>
    );
}

/**
 * "Most popular slots": bookings per slot as labelled horizontal bars (12 time labels do not fit
 * under vertical bars on a phone, so every slot shows its count directly).
 *   slots: [{ slotNumber, label, count }] in schedule order
 */
export function SlotPopularityCard({ slots = [], title = 'Most popular slots', subtitle }) {
    const max = Math.max(1, ...slots.map(s => s.count || 0));
    return (
        <Card>
            <Stack gap={12}>
                <CardHeader title={title} subtitle={subtitle} />
                {slots.length === 0 ? (
                    <AppText size="sm" tone="dim">No slots configured.</AppText>
                ) : (
                    <View style={{ gap: 10 }}>
                        {slots.map(s => (
                            <HBar
                                key={String(s.slotNumber)}
                                label={s.label}
                                value={s.count || 0}
                                max={max}
                                display={`${s.count || 0} booking${s.count === 1 ? '' : 's'}`}
                            />
                        ))}
                    </View>
                )}
            </Stack>
        </Card>
    );
}
