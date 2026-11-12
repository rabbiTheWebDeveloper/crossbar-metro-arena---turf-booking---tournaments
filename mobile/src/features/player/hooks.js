import { useCallback, useMemo, useState } from 'react';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { SCHEDULE_SLOTS_DEFINITION } from '@/data/initialData';
import { kickoffDate } from '@/lib/dateUtils';
import { confirm } from '@/components/ui';

/** The 12 slot definitions currently configured by the arena (falls back to the built-in list). */
export function useSlotOptions() {
    const { pricing } = useArena();
    return useMemo(
        () => (Array.isArray(pricing?.slotPrices) && pricing.slotPrices.length === 12 ? pricing.slotPrices : SCHEDULE_SLOTS_DEFINITION),
        [pricing?.slotPrices]
    );
}

/**
 * The signed-in user's bookings split into upcoming and past/cancelled (Dhaka kick-off time),
 * plus the online cancellation rule (allowed until `pricing.cancellationHours` before kick-off).
 */
export function usePlayerBookings() {
    const { myBookings, pricing } = useArena();
    const slotOptions = useSlotOptions();
    const cancellationHours = Number(pricing?.cancellationHours) || 24;

    const kickoffOf = useCallback((b) => {
        const start = b?.startTime || slotOptions.find(s => s.slotNumber === b?.slotNumber)?.startTime || '00:00';
        return kickoffDate(b?.date, start);
    }, [slotOptions]);

    const canCancelBooking = useCallback((b) => {
        const diffHours = (kickoffOf(b).getTime() - Date.now()) / (1000 * 60 * 60);
        return diffHours >= cancellationHours;
    }, [kickoffOf, cancellationHours]);

    const { upcomingBookings, pastBookings } = useMemo(() => {
        const now = Date.now();
        const upcoming = [];
        const past = [];
        (myBookings || []).forEach(b => {
            const k = kickoffOf(b).getTime();
            if (!Number.isNaN(k) && k >= now && b.paymentStatus !== 'cancelled') upcoming.push(b);
            else past.push(b);
        });
        const time = (b) => { const t = kickoffOf(b).getTime(); return Number.isNaN(t) ? 0 : t; };
        upcoming.sort((a, b) => time(a) - time(b));
        past.sort((a, b) => time(b) - time(a));
        return { upcomingBookings: upcoming, pastBookings: past };
    }, [myBookings, kickoffOf]);

    return { upcomingBookings, pastBookings, canCancelBooking, cancellationHours };
}

/** The signed-in user's match passes: every booking that is not cancelled, newest first. */
export function useActivePasses() {
    const { myBookings } = useArena();
    return useMemo(() => (Array.isArray(myBookings) ? myBookings : [])
        .filter(b => b && b.paymentStatus !== 'cancelled')
        .slice()
        .sort((a, b) => {
            const da = String(a.date || '');
            const db = String(b.date || '');
            if (da !== db) return da < db ? 1 : -1; // ISO dates sort as plain strings
            return (Number(b.slotNumber) || 0) - (Number(a.slotNumber) || 0);
        }), [myBookings]);
}

/** Goals credited to the signed-in user on any team roster (matched by name or phone). */
export function useMyGoalsCount() {
    const { teams, currentUser, isVisitor } = useArena();
    return useMemo(() => {
        if (isVisitor) return 0;
        const name = String(currentUser?.name || '').trim().toLowerCase();
        const phone = cleanPhone(currentUser?.phone);
        let total = 0;
        (teams || []).forEach(t => (t?.players || []).forEach(p => {
            const sameName = name && String(p?.name || '').trim().toLowerCase() === name;
            const samePhone = phone && p?.phone && cleanPhone(p.phone) === phone;
            if (sameName || samePhone) total += Number(p?.goals) || 0;
        }));
        return total;
    }, [teams, currentUser, isVisitor]);
}

/** Confirm-then-logout used by every account screen. */
export function useLogout() {
    const { logout, showNotice } = useArena();
    const [loggingOut, setLoggingOut] = useState(false);

    const confirmLogout = useCallback(async () => {
        const ok = await confirm('Log out?', 'You will need to sign in again to see your bookings, passes and teams.', { confirmText: 'Log out', destructive: true });
        if (!ok) return false;
        setLoggingOut(true);
        try {
            await logout();
            showNotice('success', 'You have been signed out of Crossbar Metro Arena. Your bookings and team stats stay safe in your account.');
        } finally {
            setLoggingOut(false);
        }
        return true;
    }, [logout, showNotice]);

    return { confirmLogout, loggingOut };
}
