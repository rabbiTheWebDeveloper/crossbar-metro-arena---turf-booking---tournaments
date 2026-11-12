import React, { useCallback, useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { confirm } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { BookingSheet } from './BookingSheet';

/**
 * Desk actions on bookings, shared by Today, Schedule and All bookings.
 *
 *   const desk = useBookingDesk({ cancelWithName: true, unpaidLabel: 'Unpaid' });
 *   desk.openBooking(b)      open the actions sheet           desk.openCollect(b)   open the collect form
 *   desk.markPlayed(b)       desk.settleInFull(b)             desk.cancelBooking(b) (both confirm first)
 *   desk.busyId              id of the booking being saved    {desk.sheets}         render once per screen
 *
 * settleInFull / markPlayed / cancelBooking resolve to true / false (saved or failed) or `null`
 * when nothing was attempted (another action is running, or the admin declined the confirmation).
 */
export function useBookingDesk({ cancelWithName = false, unpaidLabel, holdLabel } = {}) {
    const { bookings, handleUpdateBookingStatus, handleMarkPlayed, handleCancelBooking, showNotice, setActiveTicketPass } = useArena();
    const [busyId, setBusyId] = useState(null);
    const [sheet, setSheet] = useState(null); // { id, mode: 'actions' | 'collect', key }

    const openBooking = useCallback((b) => { if (b?.id) setSheet({ id: b.id, mode: 'actions', key: Date.now() }); }, []);
    const openCollect = useCallback((b) => { if (b?.id) setSheet({ id: b.id, mode: 'collect', key: Date.now() }); }, []);
    const closeSheet = useCallback(() => setSheet(null), []);

    const settleInFull = async (b) => {
        if (busyId) return null;
        const ok = await confirm('Settle in full?', `Settle ${b.bookingCode} in full (collect the remaining ${formatMoney(b.dueAmount)})?`, { confirmText: 'Settle in full' });
        if (!ok) return null;
        setBusyId(b.id);
        const res = await handleUpdateBookingStatus(b.id, 'paid_full');
        setBusyId(null);
        if (res?.ok) showNotice('success', `${b.bookingCode} settled in full`);
        return !!res?.ok;
    };

    const markPlayed = async (b, played = true) => {
        if (busyId) return null;
        setBusyId(b.id);
        const res = await handleMarkPlayed(b.id, played);
        setBusyId(null);
        if (res?.ok) showNotice('success', played ? `${b.bookingCode} marked as played` : `${b.bookingCode} play flag removed`);
        return !!res?.ok;
    };

    const cancelBooking = async (b) => {
        if (busyId) return null;
        const paid = Number(b.advanceAmount) || 0;
        const ok = await confirm(
            'Cancel booking?',
            `Cancel booking ${b.bookingCode}${cancelWithName && b.captainName ? ` for ${b.captainName}` : ''}?${paid > 0 ? ` ${formatMoney(paid)} will go to the refund queue.` : ''}`,
            { confirmText: 'Cancel booking', cancelText: 'Keep booking', destructive: true }
        );
        if (!ok) return null;
        setBusyId(b.id);
        const res = await handleCancelBooking(b.id); // shows its own success / error notice
        setBusyId(null);
        return !!res?.ok;
    };

    const active = sheet ? bookings.find(b => b.id === sheet.id) || null : null;

    /** Record a (partial) payment for the booking shown in the sheet. */
    const collect = async (amount) => {
        if (!active) return { ok: false, error: 'This booking is no longer available.' };
        const res = await handleUpdateBookingStatus(active.id, undefined, amount);
        if (res?.ok) {
            closeSheet();
            showNotice('success', `${formatMoney(amount)} collected for ${active.bookingCode}`);
        }
        return res;
    };

    const openPass = (b) => {
        closeSheet();
        // Let the sheet finish closing before the global pass modal opens
        setTimeout(() => setActiveTicketPass(b), 320);
    };

    const sheets = (
        <BookingSheet
            booking={active}
            mode={sheet?.mode}
            formKey={sheet?.key}
            busy={!!active && busyId === active.id}
            unpaidLabel={unpaidLabel}
            holdLabel={holdLabel}
            onClose={closeSheet}
            onModeChange={(mode) => setSheet(prev => (prev ? { ...prev, mode, key: Date.now() } : prev))}
            onCollectSubmit={collect}
            onSettle={settleInFull}
            onMarkPlayed={markPlayed}
            onCancel={cancelBooking}
            onOpenPass={openPass}
        />
    );

    return { busyId, openBooking, openCollect, markPlayed, settleInFull, cancelBooking, sheets };
}
