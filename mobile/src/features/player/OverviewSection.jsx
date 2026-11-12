import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Users, Target, User, Ticket, Swords, Trophy, LayoutGrid, ShoppingBag } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, Row, Button, AppText, Mono, SectionHeader, StatCard, StatGrid, ListItem, Divider } from '@/components/ui';
import { spacing } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';
import { AccountCard } from './AccountCard';

/** Dashboard landing section: who you are, headline numbers, the next fixtures and shortcuts. */
export function OverviewSection({ upcomingBookings, myGoalsCount }) {
    const router = useRouter();
    const { currentUser, myTeams, setActiveTicketPass } = useArena();

    return (
        <>
            <AccountCard user={currentUser} />

            <StatGrid>
                <StatCard label="Upcoming Fixtures" value={String(upcomingBookings.length)} hint="Booked on the turf" icon={Calendar} />
                <StatCard label="My Squads" value={String(myTeams.length)} hint={myTeams[0]?.name || 'No team yet'} icon={Users} tone="info" />
                <StatCard label="Career Goals" value={String(myGoalsCount)} hint="From published results" icon={Target} />
                <StatCard label="Preferred Position" value={currentUser?.playingPosition || '—'} hint="Player Profile" icon={User} tone="purple" />
            </StatGrid>

            <Card style={{ gap: spacing.md }}>
                <SectionHeader title="Upcoming Match Bookings" action="Book Another Slot" onAction={() => router.navigate('/booking')} style={{ marginBottom: 0 }} />
                {upcomingBookings.length === 0 ? (
                    <AppText size="sm" tone="muted" center style={{ paddingVertical: spacing.lg }}>
                        No upcoming games booked yet. Book a slot to pick your 90-minute kickoff.
                    </AppText>
                ) : (
                    upcomingBookings.slice(0, 6).map((b, i) => (
                        <View key={b.id} style={{ gap: spacing.md }}>
                            {i > 0 ? <Divider style={{ marginVertical: 0 }} /> : null}
                            <Row justify="space-between" gap={spacing.md}>
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Mono size="xs" tone="brand">{b.bookingCode || ''}</Mono>
                                    <AppText size="md" weight="800" numberOfLines={1}>{b.teamName || 'My squad'}</AppText>
                                    <AppText size="xs" tone="muted">{`${formatIsoDate(b.date)} · ${b.displayTime || ''}`}</AppText>
                                    <AppText size="xs" tone="soft">
                                        {`Paid: ${formatMoney(b.advanceAmount)} · Due: `}<AppText size="xs" tone="warning" weight="800">{formatMoney(b.dueAmount)}</AppText>
                                    </AppText>
                                </View>
                                <Button title="Open Pass" icon={Ticket} variant="outline" size="sm" onPress={() => setActiveTicketPass(b)} />
                            </Row>
                        </View>
                    ))
                )}
            </Card>

            <Card padded={false} style={{ paddingVertical: spacing.xs }}>
                <ListItem icon={Calendar} title="Book a slot" subtitle="Pick a 90-minute kickoff on the turf" onPress={() => router.navigate('/booking')} />
                <ListItem icon={Ticket} title="My match passes" subtitle="Digital passes for your booked slots" onPress={() => router.push('/passes')} />
                <ListItem icon={Swords} title="Matches & challenges" subtitle="Public Match Day board" onPress={() => router.push('/matches')} />
                <ListItem icon={Trophy} title="Events & tournaments" subtitle="Enter your squad" onPress={() => router.push('/events')} />
                <ListItem icon={LayoutGrid} title="Squad builder" subtitle="Plan your line-up" onPress={() => router.push('/squad-builder')} />
                <ListItem icon={ShoppingBag} title="Arena shop" subtitle="Reserve gear for pickup" onPress={() => router.navigate('/shop')} />
            </Card>
        </>
    );
}
