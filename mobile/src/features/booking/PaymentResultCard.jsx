import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { CheckCircle2, AlertTriangle, MessageCircle, Ticket, RefreshCw, X } from 'lucide-react-native';
import { Card, GradientCard, AppText, Heading, Label, Mono, Badge, Button, IconButton, Row } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { formatIsoDate } from '@/lib/dateUtils';
import { useVenueContacts } from '@/features/venue/useVenueContacts';
import { STATUS_COPY, NEEDS_DESK } from './paymentResult';

function TranLine({ tranId, reason, suffix }) {
    if (!tranId && !reason && !suffix) return null;
    return (
        <AppText size="xs" tone="muted">
            {tranId ? 'Transaction id: ' : ''}
            {tranId ? <Mono size="xs" tone="white">{tranId}</Mono> : null}
            {tranId ? '. ' : ''}
            {reason ? `Reason: ${String(reason).replace(/_/g, ' ')}. ` : ''}
            {suffix || ''}
        </AppText>
    );
}

/**
 * Result of an online payment (port of the website's payment notification banner).
 *   result: { payment, bookingCode, tranId, reason }
 *   verifyState / verifiedBooking: from usePaymentVerification
 *   onOpenPass(booking): show the digital pass     onRetry: re-check with the server
 *   onDismiss: optional close button (banner mode)  children: extra action buttons
 */
export function PaymentResultCard({ result, verifyState, verifiedBooking, onOpenPass, onRetry, onDismiss, children }) {
    const { whatsappUrl, open } = useVenueContacts();
    if (!result) return null;
    const dismissButton = onDismiss ? <IconButton icon={X} size={32} iconSize={15} onPress={onDismiss} accessibilityLabel="Dismiss" /> : null;

    if (verifyState === 'verifying' || (result.payment === 'success' && verifyState === 'idle')) {
        return (
            <Card>
                <Row gap={spacing.md}>
                    <ActivityIndicator size="small" color={colors.brand} />
                    <AppText size="sm" tone="soft" style={{ flex: 1 }}>Verifying your payment with the arena server…</AppText>
                </Row>
            </Card>
        );
    }

    if (verifyState === 'verified' && verifiedBooking) {
        const b = verifiedBooking;
        const paid = Number(b.advanceAmount ?? 0) || 0;
        const due = Number(b.dueAmount ?? Math.max(0, (Number(b.totalPrice) || 0) - paid)) || 0;
        return (
            <GradientCard>
                <Row align="flex-start" gap={spacing.md}>
                    <View style={styles.okIcon}>
                        <CheckCircle2 size={26} color={colors.brand} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Row wrap gap={spacing.sm}>
                            <Label tone="brand">Payment verified</Label>
                            <Badge tone="success" label="Paid & confirmed" />
                        </Row>
                        <Heading level={3} upper>Slot locked</Heading>
                        <AppText size="sm" tone="soft">
                            {'Booking code '}
                            <Mono size="md" tone="brand">{b.bookingCode || result.bookingCode || '—'}</Mono>
                        </AppText>
                        <AppText size="sm" tone="soft">{[formatIsoDate(b.date), b.displayTime, b.teamName].filter(Boolean).join(' · ')}</AppText>
                        <AppText size="sm" tone="soft">
                            {'Paid: '}
                            <Mono size="sm" tone="brand">{formatMoney(paid)}</Mono>
                            {' · Due at the arena: '}
                            <Mono size="sm" tone="white">{formatMoney(due)}</Mono>
                        </AppText>
                        <TranLine tranId={result.tranId} suffix="Confirmation recorded — save your booking code and show the ticket pass at the desk." />
                    </View>
                    {dismissButton}
                </Row>
                <View style={styles.actions}>
                    {onOpenPass ? <Button title="Ticket pass" icon={Ticket} onPress={() => onOpenPass(b)} block /> : null}
                    {children}
                </View>
            </GradientCard>
        );
    }

    if (result.payment === 'success') {
        // success param but the server does not show a paid booking
        return (
            <Card tone="warning">
                <Row align="flex-start" gap={spacing.md}>
                    <AlertTriangle size={22} color={colors.warning} />
                    <View style={{ flex: 1, gap: 4 }}>
                        <AppText size="md" weight="800">We could not verify this payment yet</AppText>
                        <AppText size="sm" tone="soft">
                            {'The gateway reported success but the booking '}
                            {result.bookingCode ? <Mono size="sm" tone="white">{`${result.bookingCode} `}</Mono> : null}
                            {'is not showing as paid. Please contact the arena desk with the transaction id '}
                            <Mono size="sm" tone="white">{result.tranId || 'from your payment receipt'}</Mono>
                            {', or try "Find my booking" on the Book tab in a minute.'}
                        </AppText>
                    </View>
                    {dismissButton}
                </Row>
                <View style={styles.actions}>
                    {onRetry ? <Button title="Check again" variant="outline" icon={RefreshCw} onPress={onRetry} block /> : null}
                    {whatsappUrl ? <Button title="Message the desk on WhatsApp" variant="secondary" icon={MessageCircle} onPress={() => open(whatsappUrl)} block /> : null}
                    {children}
                </View>
            </Card>
        );
    }

    const kind = STATUS_COPY[result.payment] ? result.payment : 'unknown';
    const copy = STATUS_COPY[kind];
    const isSoft = kind === 'cancelled';
    const needsDesk = NEEDS_DESK.includes(kind);
    const canRecheck = !!onRetry && ['pending_verification', 'unknown', 'error'].includes(kind);
    return (
        <Card tone={isSoft ? undefined : 'danger'}>
            <Row align="flex-start" gap={spacing.md}>
                <AlertTriangle size={22} color={isSoft ? colors.warning : colors.danger} />
                <View style={{ flex: 1, gap: 4 }}>
                    <AppText size="md" weight="800">{copy.title}</AppText>
                    <AppText size="sm" tone="soft">{copy.text}</AppText>
                    <TranLine tranId={result.tranId} reason={result.reason} />
                </View>
                {dismissButton}
            </Row>
            <View style={styles.actions}>
                {canRecheck ? <Button title="Check again" variant="outline" icon={RefreshCw} onPress={onRetry} block /> : null}
                {needsDesk && whatsappUrl ? <Button title="Contact the desk on WhatsApp" variant="secondary" icon={MessageCircle} onPress={() => open(whatsappUrl)} block /> : null}
                {children}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    okIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' },
    actions: { gap: spacing.sm, marginTop: spacing.md }
});
