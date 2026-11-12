import React from 'react';
import { useArena } from '@/context/ArenaContext';
import { PaymentResultCard } from './PaymentResultCard';
import { usePaymentVerification } from './paymentResult';

/**
 * Booking-page banner for a gateway result that arrived as route params
 * (`/booking?payment=…&bookingCode=…&tranId=…`, e.g. from an app link).
 * A "success" is only shown as confirmed after the server booking lookup says it is paid.
 * Give it a `key` per result so each result is verified from a clean state.
 */
export function PaymentReturnBanner({ result, onDismiss }) {
    const { setActiveTicketPass } = useArena();
    const { verifyState, verifiedBooking, retry, canRetry } = usePaymentVerification(result);
    return (
        <PaymentResultCard
            result={result}
            verifyState={verifyState}
            verifiedBooking={verifiedBooking}
            onOpenPass={setActiveTicketPass}
            onRetry={canRetry ? retry : undefined}
            onDismiss={onDismiss}
        />
    );
}
