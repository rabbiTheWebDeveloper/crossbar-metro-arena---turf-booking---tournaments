import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { GradientCard, AppText, Heading, Label, Mono, Row, Divider, KeyValue } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';
import { MATCH_TYPE_LABEL } from './slots';

/**
 * Booking summary shown before (and while) paying.
 *   draft: the pending booking handed over by the booking form
 *   estimate: client-side price preview from estimateBooking()
 *   serverQuote: { amount, totalPrice, dueAfterPayment, bookingCode } once the server priced it
 */
export function PaymentSummary({ draft, estimate, serverQuote }) {
    const payable = serverQuote ? Number(serverQuote.amount) || 0 : estimate.amount;
    const total = serverQuote ? Number(serverQuote.totalPrice) || 0 : estimate.totalPrice;
    const dueAfter = serverQuote ? Number(serverQuote.dueAfterPayment) || 0 : estimate.dueAfterPayment;

    return (
        <GradientCard>
            <Row gap={spacing.md}>
                <View style={styles.lock}>
                    <Lock size={17} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                    <Heading level={4}>Confirm & pay securely</Heading>
                    <AppText size="xs" tone="muted">The SSLCommerz checkout opens next (bKash, Nagad, Rocket, cards)</AppText>
                </View>
            </Row>

            <Divider />

            <Row justify="space-between" align="flex-start" gap={spacing.md}>
                <View style={{ flex: 1, gap: 2 }}>
                    <AppText size="xs" tone="muted">{`Slot #${draft.slotNumber} · ${estimate.displayTime}`}</AppText>
                    <AppText size="md" weight="800">{formatIsoDate(draft.date)}</AppText>
                    <AppText size="sm" tone="soft">{`${draft.teamName} · ${draft.captainName} · ${draft.captainPhone}`}</AppText>
                    <AppText size="xs" tone="dim">{MATCH_TYPE_LABEL[draft.matchType] || 'Friendly Scrimmage'}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Label>{serverQuote ? 'Amount (confirmed)' : 'Pay now'}</Label>
                    <Mono size="xxl" tone="brand" weight="900">{formatMoney(payable)}</Mono>
                </View>
            </Row>

            <View style={styles.breakdown}>
                <KeyValue label="Slot price" value={formatMoney(estimate.courtPrice)} mono />
                {estimate.addOns.map(a => <KeyValue key={a.id} label={`+ ${a.name}`} value={formatMoney(a.price)} mono tone="muted" />)}
                <Divider style={{ marginVertical: 4 }} />
                <KeyValue label="Total" value={formatMoney(total)} mono bold />
                <KeyValue label={draft.paymentType === 'full_payment' ? 'Full payment online' : 'Advance online'} value={formatMoney(payable)} mono bold tone="brand" />
                <KeyValue label="Due at the arena desk" value={formatMoney(dueAfter)} mono tone="muted" />
                {serverQuote?.bookingCode ? <KeyValue label="Booking code" value={String(serverQuote.bookingCode)} mono bold /> : null}
            </View>
        </GradientCard>
    );
}

const styles = StyleSheet.create({
    lock: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' },
    breakdown: { marginTop: spacing.md, gap: 2, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgDeep }
});
