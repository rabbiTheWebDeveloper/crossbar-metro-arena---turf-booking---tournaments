/**
 * SSLCommerz return handling shared by the payment screen and the booking tab.
 *
 * After the hosted checkout the gateway posts to `/api/payment/sslcommerz/callback`, which answers
 * with a redirect to the website's `/booking?payment=<status>&bookingCode=…&tranId=…&reason=…`.
 * The app watches for that URL instead of loading the web page.
 */
import { useCallback, useEffect, useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { API_BASE_URL, SITE_HOSTS } from '@/config';

export const PAID_STATUSES = ['paid_advance', 'paid_full'];

/** Copy for every non-success outcome (same wording as the website's booking page). */
export const STATUS_COPY = {
    failed: { title: 'Payment declined or incomplete', text: 'The payment was not completed at SSLCommerz. Your slot was released; pick it again to retry.' },
    cancelled: { title: 'Payment cancelled', text: 'You cancelled the payment at the gateway. The slot was released; nothing was charged.' },
    slot_lost: { title: 'Slot no longer available', text: 'Your payment went through but the slot was taken before it could be confirmed. The arena desk will arrange a refund — please contact them with the transaction id below.' },
    error: { title: 'Something went wrong', text: 'We could not process the gateway response. If money left your account, contact the arena desk with the transaction id below.' },
    unknown: { title: 'Payment status unknown', text: 'We could not determine the result of this payment. Use "Find my booking" on the Book tab or contact the arena desk with the transaction id.' },
    pending_verification: { title: 'Payment is being verified', text: 'The gateway reported success but verification is still pending. Use "Find my booking" on the Book tab in a minute, or contact the arena desk with the transaction id.' }
};

/** Outcomes where the customer should talk to the arena desk. */
export const NEEDS_DESK = ['slot_lost', 'error', 'unknown', 'pending_verification'];

/** Groups a payment-init error message into the kinds the checkout reacts to. */
export const classifyError = (message) => {
    const m = String(message || '').toLowerCase();
    if (m.includes('not configured')) return 'gateway_unavailable';
    if (m.includes('another customer') || m.includes('already been reserved') || m.includes('taken a moment ago') || m.includes('could not reserve')) return 'slot_conflict';
    if (m.includes('already passed') || m.includes('days ahead') || m.includes('invalid date')) return 'bad_date';
    return 'generic';
};

const hostOf = (url) => {
    const m = /^https?:\/\/([^/?#:]+)/i.exec(String(url || ''));
    return m ? m[1].toLowerCase() : '';
};
// The production hosts plus whatever server this build talks to (staging builds redirect there)
const RETURN_HOSTS = [...SITE_HOSTS.map(h => String(h).toLowerCase()), hostOf(API_BASE_URL)].filter(Boolean);

const decodePart = (s) => {
    try { return decodeURIComponent(String(s).replace(/\+/g, ' ')); } catch { return String(s); }
};

/**
 * Recognises the gateway's redirect back to the site.
 * Returns { payment, bookingCode, tranId, reason } for `https://<site host>/booking?payment=…`,
 * otherwise null. (Parsed by hand: the URL / URLSearchParams globals are incomplete on Hermes.)
 */
export function parseGatewayReturn(url) {
    const m = /^https?:\/\/([^/?#:]+)(?::\d+)?([^?#]*)(?:\?([^#]*))?/i.exec(String(url || ''));
    if (!m) return null;
    if (!RETURN_HOSTS.includes(m[1].toLowerCase())) return null;
    if (!String(m[2] || '').startsWith('/booking')) return null;
    const params = {};
    String(m[3] || '').split('&').forEach((pair) => {
        if (!pair) return;
        const i = pair.indexOf('=');
        const key = decodePart(i < 0 ? pair : pair.slice(0, i));
        params[key] = i < 0 ? '' : decodePart(pair.slice(i + 1));
    });
    if (!params.payment) return null;
    return {
        payment: String(params.payment),
        bookingCode: String(params.bookingCode || ''),
        tranId: String(params.tranId || ''),
        reason: String(params.reason || '')
    };
}

/**
 * Confirms a gateway result against the server before anything is claimed.
 * A "success" is verified automatically; `retry()` re-checks any result that carries a booking code.
 *   result: { payment, bookingCode } | null       phone: captain's phone (unlocks the full pass)
 * Returns { verifyState: idle | verifying | verified | unverified, verifiedBooking, retry, canRetry }.
 */
export function usePaymentVerification(result, phone) {
    const { lookupBooking, setActiveTicketPass, refreshBookings } = useArena();
    const [verifyState, setVerifyState] = useState('idle');
    const [verifiedBooking, setVerifiedBooking] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const payment = result?.payment || '';
    const bookingCode = result?.bookingCode || '';

    useEffect(() => {
        if (!payment) return undefined;
        if (payment !== 'success' && attempt === 0) return undefined;
        let cancelled = false;
        (async () => {
            setVerifyState('verifying');
            const r = bookingCode ? await lookupBooking(bookingCode, phone || undefined) : { ok: false };
            if (cancelled) return;
            const booking = r.ok ? r.booking : null;
            if (booking && PAID_STATUSES.includes(booking.paymentStatus)) {
                setVerifiedBooking(booking);
                setVerifyState('verified');
                setActiveTicketPass(booking);
                refreshBookings().catch(() => { /* the grid refreshes on its own timer */ });
            } else {
                setVerifyState('unverified');
            }
        })();
        return () => { cancelled = true; };
    }, [payment, bookingCode, phone, attempt, lookupBooking, setActiveTicketPass, refreshBookings]);

    const retry = useCallback(() => setAttempt(a => a + 1), []);
    return { verifyState, verifiedBooking, retry, canRetry: !!bookingCode };
}
