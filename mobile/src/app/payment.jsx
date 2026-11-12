import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, BackHandler } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useOpenTab } from '@/lib/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLink, ShieldCheck, MessageCircle, Phone, Ticket, CalendarDays } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Card, Button, Notice, AppText, Heading, Row, confirm } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { useVenueContacts } from '@/features/venue/useVenueContacts';
import { PRIMARY_COURT, estimateBooking, holdMinutesSetting } from '@/features/booking/slots';
import { classifyError, usePaymentVerification, NEEDS_DESK } from '@/features/booking/paymentResult';
import { PaymentSummary } from '@/features/booking/PaymentSummary';
import { GatewayWebView } from '@/features/booking/GatewayWebView';
import { PaymentResultCard } from '@/features/booking/PaymentResultCard';

/**
 * Step 2 of the public online booking (port of the website's SSLCommerz modal):
 *   summary  -> confirm the draft; the server prices it, holds the slot and opens a gateway session
 *   gateway  -> the hosted SSLCommerz page in a WebView, watched for the redirect back to the site
 *   result   -> the outcome, verified against the server before a booking is shown as confirmed
 * The draft comes from `pendingBookingData`; opening the screen without one returns to /booking.
 */
/** Nothing to pay for: return to the Book tab (without stacking a second tab navigator). */
function BackToBooking() {
    const openTab = useOpenTab();
    useEffect(() => { openTab('/booking'); }, [openTab]);
    return null;
}

export default function PaymentScreen() {
    const router = useRouter();
    const openTab = useOpenTab();
    const insets = useSafeAreaInsets();
    const { pendingBookingData, setPendingBookingData, startOnlinePayment, pricing, handleReleaseSlotHold, refreshBookings, setActiveTicketPass } = useArena();
    const { whatsappUrl, telHref, phoneLabel, open } = useVenueContacts();

    // Snapshot of the draft: the context copy is cleared as soon as the payment is over
    const [draft, setDraft] = useState(pendingBookingData);
    const [phase, setPhase] = useState('summary'); // summary | gateway | result
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverQuote, setServerQuote] = useState(null); // { amount, totalPrice, dueAfterPayment, bookingCode, holdExpiresAt }
    const [gatewayUrl, setGatewayUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorKind, setErrorKind] = useState('');
    const [gatewayResult, setGatewayResult] = useState(null);
    const [webCanGoBack, setWebCanGoBack] = useState(false);
    const webRef = useRef(null);
    const releasedRef = useRef(false);
    const unmountTimer = useRef(null);
    // Adopt a draft that reaches the store just after this screen mounted
    if (!draft && pendingBookingData && !releasedRef.current) setDraft(pendingBookingData);

    // Client-side estimate shown before the server quote arrives (server amounts replace it)
    const estimate = useMemo(() => estimateBooking(draft, pricing), [draft, pricing]);
    const holdMinutes = holdMinutesSetting(pricing);

    // The gateway only returns the booking code on success; fall back to the one the server issued
    const result = useMemo(
        () => (gatewayResult ? { ...gatewayResult, bookingCode: gatewayResult.bookingCode || serverQuote?.bookingCode || '' } : null),
        [gatewayResult, serverQuote]
    );
    const { verifyState, verifiedBooking, retry, canRetry } = usePaymentVerification(result, draft?.captainPhone);

    /** Frees the cosmetic local hold and forgets the draft (once). */
    const releaseDraft = useCallback(() => {
        if (releasedRef.current) return;
        releasedRef.current = true;
        if (draft) handleReleaseSlotHold(PRIMARY_COURT.id, draft.date, draft.slotNumber);
        setPendingBookingData(null);
    }, [draft, handleReleaseSlotHold, setPendingBookingData]);
    const releaseDraftRef = useRef(releaseDraft);
    releaseDraftRef.current = releaseDraft;

    // Safety net: whatever way the screen goes away, the draft and its local hold go with it.
    // (Deferred so a development double-mount does not release the draft while it is still in use.)
    useEffect(() => {
        if (unmountTimer.current) { clearTimeout(unmountTimer.current); unmountTimer.current = null; }
        return () => { unmountTimer.current = setTimeout(() => releaseDraftRef.current(), 0); };
    }, []);

    const goToBooking = useCallback(() => {
        if (router.canGoBack()) router.back();
        else openTab('/booking');
    }, [router, openTab]);

    const handleConfirmAndPay = async () => {
        if (isSubmitting || phase !== 'summary' || !draft) return;
        setIsSubmitting(true);
        setErrorMessage('');
        setErrorKind('');
        const r = await startOnlinePayment(draft);
        setIsSubmitting(false);
        if (r.ok && r.gatewayUrl) {
            setServerQuote({ amount: r.amount, totalPrice: r.totalPrice, dueAfterPayment: r.dueAfterPayment, bookingCode: r.bookingCode, holdExpiresAt: r.holdExpiresAt });
            setGatewayUrl(String(r.gatewayUrl));
            setWebCanGoBack(false);
            setPhase('gateway');
            return;
        }
        const kind = classifyError(r.error);
        setErrorKind(kind);
        setErrorMessage(r.error || 'Could not start the payment. Please try again.');
        if (kind === 'slot_conflict') refreshBookings().catch(() => { /* ignore */ });
    };

    /** The gateway redirected back to the site: close the WebView and show the outcome. */
    const handleGatewayReturn = useCallback((r) => {
        setGatewayResult(r);
        setPhase('result');
        setGatewayUrl('');
        releaseDraft();
        // A success is verified (and the grid refreshed) by usePaymentVerification
        if (r.payment !== 'success') refreshBookings().catch(() => { /* ignore */ });
    }, [releaseDraft, refreshBookings]);

    /** Header / hardware back. */
    const handleBack = useCallback(async () => {
        if (phase === 'summary') {
            if (isSubmitting) return; // the slot is being reserved; wait for the answer
            // No payment was started: free the cosmetic local hold so the grid is accurate
            releaseDraft();
            goToBooking();
            return;
        }
        if (phase === 'gateway') {
            const leave = await confirm(
                'Leave the payment?',
                `Your payment is still in progress. If you leave now this booking will not be confirmed, and the slot stays reserved for up to ${holdMinutes} minutes before it frees up again.`,
                { confirmText: 'Leave payment', cancelText: 'Keep paying', destructive: true }
            );
            if (!leave) return;
            releaseDraft();
            refreshBookings().catch(() => { /* ignore */ });
            goToBooking();
            return;
        }
        goToBooking();
    }, [phase, isSubmitting, holdMinutes, releaseDraft, refreshBookings, goToBooking]);

    // Android hardware back: step back inside the gateway first, otherwise the same as the header button
    useFocusEffect(useCallback(() => {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            if (phase === 'gateway' && webCanGoBack && webRef.current) {
                webRef.current.goBack();
                return true;
            }
            handleBack();
            return true;
        });
        return () => subscription.remove();
    }, [phase, webCanGoBack, handleBack]));

    // Opened directly (no draft): nothing to pay for
    if (!draft || !estimate) return <BackToBooking />;

    if (phase === 'gateway' && gatewayUrl) {
        const amount = serverQuote ? formatMoney(serverQuote.amount) : formatMoney(estimate.amount);
        return (
            <Screen
                back
                onBack={handleBack}
                title="Secure checkout"
                subtitle={serverQuote?.bookingCode ? `${serverQuote.bookingCode} · Pay ${amount} via SSLCommerz` : `Pay ${amount} via SSLCommerz`}
                scroll={false}
                padded={false}
                refreshable={false}
            >
                <View style={{ flex: 1, paddingBottom: insets.bottom }}>
                    <GatewayWebView url={gatewayUrl} webRef={webRef} onReturn={handleGatewayReturn} onCanGoBack={setWebCanGoBack} />
                </View>
            </Screen>
        );
    }

    if (phase === 'result' && result) {
        const verified = verifyState === 'verified' && !!verifiedBooking;
        const canRebook = ['failed', 'cancelled', 'slot_lost'].includes(result.payment);
        const showCall = !verified && !!telHref && (result.payment === 'success' || NEEDS_DESK.includes(result.payment));
        return (
            <Screen back onBack={handleBack} title="Payment result" refreshable={false}>
                <PaymentResultCard
                    result={result}
                    verifyState={verifyState}
                    verifiedBooking={verifiedBooking}
                    onOpenPass={setActiveTicketPass}
                    onRetry={canRetry ? retry : undefined}
                >
                    {verified ? <Button title="My passes" variant="outline" icon={Ticket} onPress={() => router.replace('/passes')} block /> : null}
                    {showCall ? <Button title={`Call ${phoneLabel}`} variant="secondary" icon={Phone} onPress={() => open(telHref)} block /> : null}
                    {verifyState !== 'verifying' ? (
                        <Button
                            title={canRebook ? 'Pick another slot' : 'Back to booking'}
                            variant={verified ? 'ghost' : 'primary'}
                            icon={CalendarDays}
                            onPress={goToBooking}
                            block
                        />
                    ) : null}
                </PaymentResultCard>
            </Screen>
        );
    }

    const payable = serverQuote ? Number(serverQuote.amount) || 0 : estimate.amount;
    return (
        <Screen
            back
            onBack={handleBack}
            title="Checkout"
            subtitle="SSLCommerz · bKash, Nagad, Rocket, cards"
            refreshable={false}
            footer={(
                <>
                    <Button
                        title={isSubmitting ? 'Reserving your slot…' : `Pay ${formatMoney(payable)} with SSLCommerz`}
                        iconRight={ExternalLink}
                        size="lg"
                        loading={isSubmitting}
                        disabled={errorKind === 'gateway_unavailable'}
                        onPress={handleConfirmAndPay}
                        block
                    />
                    <Button title="Go back" variant="ghost" disabled={isSubmitting} onPress={handleBack} block />
                </>
            )}
        >
            <PaymentSummary draft={draft} estimate={estimate} serverQuote={serverQuote} />

            {errorMessage ? (
                <Notice type="error" message={errorMessage}>
                    {errorKind === 'gateway_unavailable' ? (
                        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                            {whatsappUrl ? <Button title="Book on WhatsApp" size="sm" icon={MessageCircle} onPress={() => open(whatsappUrl)} block /> : null}
                            {telHref ? <Button title={`Call ${phoneLabel}`} size="sm" variant="secondary" icon={Phone} onPress={() => open(telHref)} block /> : null}
                        </View>
                    ) : null}
                    {errorKind === 'slot_conflict' || errorKind === 'bad_date' ? (
                        <Button title="Pick another slot" size="sm" variant="secondary" onPress={handleBack} style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} />
                    ) : null}
                </Notice>
            ) : null}

            <Card tone="brand">
                <Row gap={6}>
                    <ShieldCheck size={17} color={colors.brand} />
                    <Heading level={4} upper>SSLCommerz secure checkout</Heading>
                </Row>
                <AppText size="sm" tone="muted" style={{ marginTop: spacing.sm }}>
                    {`The slot is held for you for ${holdMinutes} minutes once you continue. Complete the payment on the SSLCommerz page and you will be brought back here with your booking confirmation.`}
                </AppText>
            </Card>
        </Screen>
    );
}
