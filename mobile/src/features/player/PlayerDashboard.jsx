import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Calendar, Users, PlusCircle, MessageSquare, ShoppingBag, User, Ticket, LogOut } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Segmented, IconButton, Row, Loading, Notice } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { usePlayerBookings, useMyGoalsCount, useLogout } from './hooks';
import { OverviewSection } from './OverviewSection';
import { BookingsSection } from './BookingsSection';
import { TeamsSection } from './TeamsSection';
import { PostResultSection } from './PostResultSection';
import { ChallengesSection } from './ChallengesSection';
import { OrdersSection } from './OrdersSection';
import { ProfileSection } from './ProfileSection';

/**
 * The player's "Matchday Hub" (Me tab): bookings and passes, squads and rosters, match results,
 * opponent challenges, orders and profile settings.
 *
 * Sections are mounted on first visit and then kept mounted (hidden) so half-filled forms survive
 * switching between them, exactly like the single-page dashboard on the website.
 */
export function PlayerDashboard() {
    const router = useRouter();
    const { teams, myTeams, myBookings, isLoadingData, loadError, refreshData } = useArena();
    const { confirmLogout, loggingOut } = useLogout();
    const bookingState = usePlayerBookings();
    const myGoalsCount = useMyGoalsCount();

    const [activeTab, setActiveTab] = useState('overview');
    const [visited, setVisited] = useState(['overview']);
    const [createTeamOpen, setCreateTeamOpen] = useState(false);
    const [pullRefreshing, setPullRefreshing] = useState(false);

    const hasTeam = myTeams.length > 0;
    const otherTeams = useMemo(() => (teams || []).filter(t => !myTeams.some(m => m.id === t.id)), [teams, myTeams]);

    const openTab = useCallback((id) => {
        setActiveTab(id);
        setVisited(prev => (prev.includes(id) ? prev : [...prev, id]));
    }, []);

    // Posting results is for captains only: leave that section when the last team is gone
    useEffect(() => {
        if (!hasTeam && activeTab === 'post_score') openTab('overview');
    }, [hasTeam, activeTab, openTab]);

    // Pull-to-refresh keeps the sections on screen (the spinner in the header is enough)
    const handleRefresh = useCallback(async () => {
        setPullRefreshing(true);
        try { await refreshData(); } finally { setPullRefreshing(false); }
    }, [refreshData]);

    const tabs = [
        { value: 'overview', label: 'Overview', icon: Trophy },
        { value: 'bookings', label: `My Bookings (${(myBookings || []).length})`, icon: Calendar },
        { value: 'teams', label: `My Teams (${myTeams.length})`, icon: Users },
        ...(hasTeam ? [{ value: 'post_score', label: 'Post Match Result', icon: PlusCircle }] : []),
        { value: 'find_opponent', label: 'Find an Opponent', icon: MessageSquare },
        { value: 'orders', label: 'Orders & Events', icon: ShoppingBag },
        { value: 'profile', label: 'Profile & Settings', icon: User }
    ];

    const loading = isLoadingData && !pullRefreshing;
    const section = (id, node) => (visited.includes(id) ? <View key={id} style={activeTab === id ? styles.section : styles.hidden}>{node}</View> : null);

    return (
        <Screen
            tab
            title="Matchday Hub"
            subtitle="Player & Team Portal"
            onRefresh={handleRefresh}
            right={(
                <Row gap={8}>
                    <IconButton icon={Ticket} onPress={() => router.push('/passes')} tone={colors.brand} accessibilityLabel="My match passes" />
                    <IconButton icon={LogOut} onPress={confirmLogout} disabled={loggingOut} accessibilityLabel="Log out" />
                </Row>
            )}
        >
            <Segmented scroll value={activeTab} onChange={openTab} options={tabs} />

            {loadError ? <Notice type="error" message={loadError} /> : null}
            {loading ? <Loading label="Loading your bookings, teams and results…" /> : null}

            <View style={loading ? styles.hidden : null}>
                {section('overview', <OverviewSection upcomingBookings={bookingState.upcomingBookings} myGoalsCount={myGoalsCount} />)}
                {section('bookings', (
                    <BookingsSection
                        upcomingBookings={bookingState.upcomingBookings}
                        pastBookings={bookingState.pastBookings}
                        canCancelBooking={bookingState.canCancelBooking}
                        cancellationHours={bookingState.cancellationHours}
                    />
                ))}
                {section('teams', (
                    <TeamsSection createOpen={createTeamOpen} onOpenCreate={() => setCreateTeamOpen(true)} onCloseCreate={() => setCreateTeamOpen(false)} />
                ))}
                {hasTeam ? section('post_score', <PostResultSection otherTeams={otherTeams} />) : null}
                {section('find_opponent', <ChallengesSection onCreateTeam={() => { openTab('teams'); setCreateTeamOpen(true); }} />)}
                {section('orders', <OrdersSection />)}
                {section('profile', <ProfileSection onLogout={confirmLogout} loggingOut={loggingOut} />)}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    section: { gap: spacing.lg },
    hidden: { display: 'none' }
});
