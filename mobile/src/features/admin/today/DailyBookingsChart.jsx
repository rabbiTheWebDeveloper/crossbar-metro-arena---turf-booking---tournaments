import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { AppText, Card, Label, Row } from '@/components/ui';
import { colors } from '@/theme';
import { formatMoney } from '@/lib/format';
import { formatMonth, formatShortDate } from '@/lib/dateUtils';

const BAR_AREA = 96;

/**
 * Slots booked per day of the current month (by play date). Tap a bar for that day's numbers.
 *   days: financeReport.dailyBreakdown -> [{ date, slotsBooked, moneyCollected }]
 */
export function DailyBookingsChart({ month, days, today }) {
    const [selected, setSelected] = useState(null);
    const dailyMax = Math.max(1, ...days.map(d => d.slotsBooked));
    const picked = days.find(d => d.date === selected) || null;
    const ticks = [1, 6, 11, 16, 21, 26, days.length].filter((n, i, list) => n <= days.length && list.indexOf(n) === i);

    return (
        <Card style={{ gap: 10 }}>
            <View>
                <Label tone="default">{`Bookings per day · ${formatMonth(month)}`}</Label>
                <AppText size="xs" tone="dim">{`Slots by play date · busiest day ${dailyMax} slot${dailyMax === 1 ? '' : 's'}`}</AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: BAR_AREA }}>
                {days.map(d => {
                    const height = d.slotsBooked === 0 ? 3 : Math.max(8, Math.round((d.slotsBooked / dailyMax) * BAR_AREA));
                    const isToday = d.date === today;
                    const isPicked = d.date === selected;
                    const color = d.slotsBooked === 0 ? colors.glassStrong : (isToday ? colors.brandLight : colors.brand);
                    return (
                        <Pressable key={d.date} onPress={() => setSelected(isPicked ? null : d.date)} style={{ flex: 1, height: BAR_AREA, justifyContent: 'flex-end' }} accessibilityLabel={`${formatShortDate(d.date)}: ${d.slotsBooked} booked`}>
                            <View style={{ height, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: isPicked ? colors.info : color }} />
                        </Pressable>
                    );
                })}
            </View>
            <Row justify="space-between" style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4 }}>
                {ticks.map(n => <AppText key={n} size={10} tone="dim" mono>{String(n)}</AppText>)}
            </Row>
            <AppText size="xs" tone={picked ? 'soft' : 'dim'} mono={!!picked}>
                {picked
                    ? `${formatShortDate(picked.date)}: ${picked.slotsBooked} booked · ${formatMoney(picked.moneyCollected)} collected`
                    : 'Tap a bar to see that day.'}
            </AppText>
        </Card>
    );
}
