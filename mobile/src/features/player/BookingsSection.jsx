import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Plus } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Button, AppText, Label, SectionHeader, EmptyState, Card, confirm } from '@/components/ui';
import { spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { BookingCard } from './BookingCard';

const PAGE_SIZE = 8;

/** "My Bookings": upcoming and past/cancelled turf bookings with pass and cancel actions. */
export function BookingsSection({ upcomingBookings, pastBookings, canCancelBooking, cancellationHours }) {
    const router = useRouter();
    const { myBookings, handleCancelBooking } = useArena();
    const [cancellingId, setCancellingId] = useState('');
    const [pastShown, setPastShown] = useState(PAGE_SIZE);

    const onCancelBooking = async (b) => {
        if (cancellingId) return;
        const paid = Number(b.advanceAmount) || 0;
        const message = paid > 0
            ? `Cancel booking ${b.bookingCode}? ${formatMoney(paid)} already paid will go to the arena refund queue.`
            : `Cancel booking ${b.bookingCode}?`;
        const ok = await confirm('Cancel slot?', message, { confirmText: 'Cancel slot', cancelText: 'Keep booking', destructive: true });
        if (!ok) return;
        setCancellingId(b.id);
        await handleCancelBooking(b.id); // the context shows the server message (window check, refund)
        setCancellingId('');
    };

    return (
        <>
            <View style={{ gap: spacing.sm }}>
                <SectionHeader
                    title="My Match Bookings & Passes"
                    subtitle={`Upcoming and past turf bookings. Online cancellation is open until ${cancellationHours} hours before kick-off; any amount paid goes to the refund queue.`}
                    style={{ marginBottom: 0 }}
                />
                <Button title="Book Slot" icon={Plus} size="sm" onPress={() => router.navigate('/booking')} style={{ alignSelf: 'flex-start' }} />
            </View>

            {(myBookings || []).length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Calendar}
                        title="No bookings under your account yet"
                        message="Book your first 90-minute turf slot online, any time."
                        action={<Button title="Book a slot" size="sm" onPress={() => router.navigate('/booking')} style={{ marginTop: spacing.sm }} />}
                    />
                </Card>
            ) : (
                <>
                    <View style={{ gap: spacing.md }}>
                        <Label tone="brand">{`Upcoming (${upcomingBookings.length})`}</Label>
                        {upcomingBookings.length === 0 ? (
                            <Card><AppText size="sm" tone="muted">No upcoming bookings.</AppText></Card>
                        ) : upcomingBookings.map(b => (
                            <BookingCard
                                key={b.id}
                                booking={b}
                                past={false}
                                canCancel={canCancelBooking(b)}
                                cancelling={cancellingId === b.id}
                                cancellationHours={cancellationHours}
                                onCancel={onCancelBooking}
                            />
                        ))}
                    </View>
                    <View style={{ gap: spacing.md }}>
                        <Label>{`Past & cancelled (${pastBookings.length})`}</Label>
                        {pastBookings.length === 0 ? (
                            <Card><AppText size="sm" tone="muted">Nothing here yet.</AppText></Card>
                        ) : pastBookings.slice(0, pastShown).map(b => (
                            <BookingCard key={b.id} booking={b} past canCancel={false} cancelling={false} cancellationHours={cancellationHours} onCancel={onCancelBooking} />
                        ))}
                        {pastBookings.length > pastShown ? (
                            <Button title={`Show more (${pastBookings.length - pastShown})`} variant="secondary" size="sm" onPress={() => setPastShown(n => n + PAGE_SIZE)} />
                        ) : null}
                    </View>
                </>
            )}
        </>
    );
}
