import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useOpenTab } from '@/lib/navigation';
import { Ticket, ChevronRight, LogIn } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Card, Button, EmptyState, Notice, Loading, Label } from '@/components/ui';
import { spacing } from '@/theme';
import { PassCard } from '@/features/player/PassCard';
import { FindBookingCard } from '@/features/player/FindBookingCard';
import { useActivePasses } from '@/features/player/hooks';

const PAGE_SIZE = 12;

/**
 * My Match Passes: the signed-in user's active bookings (tap one to open the digital pass), plus
 * a lookup by booking code + phone for guests and bookings made under another number.
 */
export default function PassesScreen() {
    const router = useRouter();
    const openTab = useOpenTab();
    const { isVisitor, isLoadingData, isInitialized, setActiveTicketPass } = useArena();
    const passes = useActivePasses();
    const [shown, setShown] = useState(PAGE_SIZE);

    const bookSlot = () => openTab('/booking');
    const firstLoad = isLoadingData && !isInitialized;

    return (
        <Screen
            back
            title="My Match Passes"
            subtitle="Your slots at Crossbar Metro Arena"
            footer={<Button title={passes.length > 0 ? 'Book Another Slot' : 'Book Playing Slot'} iconRight={ChevronRight} block onPress={bookSlot} />}
        >
            {isVisitor ? (
                <>
                    <Notice type="info" title="Booked as a guest?" message="Open your pass below with the booking code and the mobile number you booked with. Log in to see all your passes in one place.">
                        <Button title="Log In / Sign Up" icon={LogIn} size="sm" onPress={() => router.push('/login')} style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} />
                    </Notice>
                    <FindBookingCard />
                </>
            ) : (
                <>
                    {firstLoad ? <Loading label="Loading your passes…" /> : null}

                    {!firstLoad && passes.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={Ticket}
                                title="No Active Match Passes"
                                message="Book an open slot for your squad to get a matchday pass you can share on WhatsApp."
                                action={<Button title="Book Playing Slot" size="sm" onPress={bookSlot} style={{ marginTop: spacing.sm }} />}
                            />
                        </Card>
                    ) : null}

                    {passes.length > 0 ? (
                        <View style={{ gap: spacing.md }}>
                            <Label tone="brand">{`Active passes (${passes.length})`}</Label>
                            {passes.slice(0, shown).map(b => (
                                <PassCard key={b.id} booking={b} onPress={() => setActiveTicketPass(b)} />
                            ))}
                            {passes.length > shown ? (
                                <Button title={`Show more (${passes.length - shown})`} variant="secondary" size="sm" onPress={() => setShown(n => n + PAGE_SIZE)} />
                            ) : null}
                        </View>
                    ) : null}

                    <FindBookingCard title="Find another booking" subtitle="Booked with a different number? Open that pass with its booking code and mobile number." />
                </>
            )}
        </Screen>
    );
}
