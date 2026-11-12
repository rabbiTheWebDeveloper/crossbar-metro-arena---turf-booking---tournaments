import React from 'react';
import { View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { AppText, Card, Chip, Input, Label, Row, ToggleRow } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { DAY_NAMES } from '@/lib/dateUtils';

const digits = (text) => String(text || '').replace(/[^0-9]/g, '');

/**
 * Booking rules: advance deposit, hold timeout, booking window, cancellation cutoff, weekend days
 * and the "approve match results first" switch.
 *   rules: { advanceAmount, holdMinutes, bookingWindowDays, cancellationHours } (strings while editing)
 */
export function RulesCard({ rules, onRuleChange, weekendDays, onToggleWeekendDay, weekdayLabel, weekendLabel, approveResultsFirst, onApproveChange }) {
    const field = (key) => ({ value: rules[key], onChangeText: (t) => onRuleChange(key, digits(t)) });
    return (
        <Card style={{ gap: spacing.md }}>
            <Row gap={8}>
                <ShieldCheck size={16} color={colors.brand} />
                <Label tone="default">{'Booking rules & hold timeouts'}</Label>
            </Row>

            <Row align="flex-start">
                <Input label="Advance deposit (৳)" type="number" hint="Online advance payment" style={{ flex: 1 }} {...field('advanceAmount')} />
                <Input label="Slot hold (minutes)" type="number" hint="Gateway holds expire after this" style={{ flex: 1 }} {...field('holdMinutes')} />
            </Row>
            <Row align="flex-start">
                <Input label="Booking window (days)" type="number" hint="How far ahead players can book" style={{ flex: 1 }} {...field('bookingWindowDays')} />
                <Input label="Cancel cutoff (hours)" type="number" hint="Online cancellation closes this many hours before kick-off" style={{ flex: 1 }} {...field('cancellationHours')} />
            </Row>

            <View style={{ gap: 8, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border }}>
                <AppText size="sm" weight="700" tone="soft">Weekend days (weekend price applies)</AppText>
                <Row wrap gap={6}>
                    {DAY_NAMES.map(day => <Chip key={day} label={day.slice(0, 3)} selected={weekendDays.includes(day)} onPress={() => onToggleWeekendDay(day)} />)}
                </Row>
                <AppText size="xs" tone="dim">{`Weekday: ${weekdayLabel} · Weekend: ${weekendLabel}`}</AppText>
            </View>

            <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border }}>
                <ToggleRow
                    label="Approve match results before publishing"
                    description={'When on, captain-submitted scorelines wait in "Match results" for your approval before they update the league table. When off, they publish immediately.'}
                    value={approveResultsFirst}
                    onValueChange={onApproveChange}
                />
            </View>
        </Card>
    );
}
