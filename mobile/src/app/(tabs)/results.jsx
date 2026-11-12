import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Award, Calendar, Clock, Users, PlusCircle, Swords } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Segmented, Button, EmptyState, Notice, Loading, Card, ListItem, Divider, SectionHeader, confirm } from '@/components/ui';
import { todayDhakaIso, addDaysIso } from '@/lib/dateUtils';
import { PageHero } from '@/components/PageHero';
import { ResultFilters } from '@/features/matchday/ResultFilters';
import { MatchResultCard } from '@/features/matchday/MatchResultCard';
import { MyResultsCard } from '@/features/matchday/MyResultsCard';
import { StandingsTable } from '@/features/matchday/StandingsTable';
import { GoldenBoot } from '@/features/matchday/GoldenBoot';
import { OpponentBoard } from '@/features/matchday/OpponentBoard';
import { SubmitResultSheet } from '@/features/matchday/SubmitResultSheet';
import { isPublishedResult, buildTopScorers, upcomingFixtures } from '@/features/matchday/matchdayUtils';

const PAGE = 10;

/**
 * "Match Day" tab: published scores (with date filters), the league table, the Golden Boot
 * leaderboard, the opponent finder and result submission for captains.
 */
export default function MatchDayScreen() {
    const router = useRouter();
    const {
        matchResults, myMatchResults, teams, challenges, bookings, tournaments, myTeams, isVisitor, isInitialized, isLoadingData, loadError,
        promptLogin, showNotice
    } = useArena();

    const [activeTab, setActiveTab] = useState('matches');
    const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'custom'
    const [customDate, setCustomDate] = useState('');
    const [scorerPeriod, setScorerPeriod] = useState('all_time'); // 'all_time' | 'this_month'
    const [visibleCount, setVisibleCount] = useState(PAGE);
    const [showResultSheet, setShowResultSheet] = useState(false);

    const todayStr = todayDhakaIso();
    const yesterdayStr = addDaysIso(todayStr, -1);
    const currentMonthStr = todayStr.slice(0, 7);

    // Published results, newest match day first
    const publishedMatches = useMemo(
        () => (matchResults || []).filter(isPublishedResult).sort((a, b) => (a.date === b.date ? 0 : (String(a.date) < String(b.date) ? 1 : -1))),
        [matchResults]
    );
    const filteredMatches = useMemo(() => publishedMatches.filter(m => {
        if (dateFilter === 'today') return m.date === todayStr;
        if (dateFilter === 'yesterday') return m.date === yesterdayStr;
        if (dateFilter === 'custom' && customDate) return m.date === customDate;
        return true;
    }), [publishedMatches, dateFilter, todayStr, yesterdayStr, customDate]);
    const topScorers = useMemo(() => buildTopScorers(teams, matchResults, scorerPeriod, currentMonthStr), [teams, matchResults, scorerPeriod, currentMonthStr]);
    const openChallenges = useMemo(() => (challenges || []).filter(c => (c.status || 'open') === 'open'), [challenges]);
    const fixtureCount = useMemo(() => upcomingFixtures(bookings, todayStr).length, [bookings, todayStr]);

    // Back to the first page whenever the filter changes
    useEffect(() => { setVisibleCount(PAGE); }, [dateFilter, customDate]);

    const openPostResult = async () => {
        if (isVisitor) {
            promptLogin('login');
            showNotice('info', 'Please log in to post a match result.');
            return;
        }
        if (myTeams.length === 0) {
            const go = await confirm('Register a team first', 'Register a squad to post match results and challenge other teams.', { confirmText: 'Open my teams' });
            if (go) router.navigate('/me');
            return;
        }
        setShowResultSheet(true);
    };

    // Captains (and anyone with a past submission) see their own results with the review status
    const showMyResults = !isVisitor && ((myMatchResults || []).length > 0 || myTeams.length > 0);
    const openChallengeBoard = () => router.push('/matches?tab=challenges');
    const booting = !isInitialized || (isLoadingData && (matchResults || []).length === 0 && (teams || []).length === 0);

    return (
        <Screen tab title="Match Day" subtitle="Official scores & arena standings">
            <PageHero
                eyebrow="Certified Dhaka Turf Scores & Standings"
                eyebrowIcon={Trophy}
                title="Official Scores &"
                highlight="Arena Standings"
                description="Results filtered by date, certified goal scorers, cards, match reports, the Golden Boot leaderboard, and live opponent matchmaking."
                stats={[
                    { label: 'Matches Recorded', value: `${publishedMatches.length} Games`, icon: Calendar },
                    { label: 'Registered Teams', value: `${(teams || []).length} Squads`, icon: Users },
                    { label: 'Top Scorer', value: topScorers[0] ? `${topScorers[0].name}` : 'No stats yet', icon: Award },
                    { label: 'Schedule', value: '12 Slots Daily', icon: Clock }
                ]}
                actions={<Button title="Post Match Result" icon={PlusCircle} size="sm" onPress={openPostResult} />}
            />

            {loadError ? <Notice type="error" message={loadError} /> : null}

            <Card padded={false}>
                <ListItem
                    icon={Swords}
                    title="Fixtures & Squad Challenges"
                    subtitle={`${fixtureCount} confirmed fixtures · ${openChallenges.length} open challenges`}
                    onPress={() => router.push('/matches')}
                />
                <Divider style={{ marginVertical: 0 }} />
                <ListItem
                    icon={Trophy}
                    title="Tournaments & Events"
                    subtitle={`${(tournaments || []).length} tournaments · register your squad`}
                    onPress={() => router.push('/events')}
                />
            </Card>

            <Segmented
                scroll
                value={activeTab}
                onChange={setActiveTab}
                options={[
                    { value: 'matches', label: `Match Scores (${filteredMatches.length})` },
                    { value: 'leaderboard', label: 'Leaderboard & Tables' },
                    { value: 'find_opponent', label: `Find an Opponent (${openChallenges.length})` }
                ]}
            />

            {booting ? <Loading label="Loading match day data…" /> : null}

            {!booting && activeTab === 'matches' ? (
                <View style={{ gap: 12 }}>
                    <ResultFilters dateFilter={dateFilter} onChangeFilter={setDateFilter} customDate={customDate} onChangeDate={setCustomDate} />
                    {showMyResults ? <MyResultsCard /> : null}
                    {filteredMatches.length === 0 ? (
                        <EmptyState
                            icon={Calendar}
                            title="No matches found for this date"
                            message="Captains can post match scores directly from their Player Portal after full-time."
                            action={<Button title="Post a Score" size="sm" onPress={openPostResult} />}
                        />
                    ) : (
                        <>
                            {filteredMatches.slice(0, visibleCount).map(match => <MatchResultCard key={match.id} match={match} />)}
                            {filteredMatches.length > visibleCount ? (
                                <Button title={`Show more (${filteredMatches.length - visibleCount})`} variant="secondary" onPress={() => setVisibleCount(v => v + PAGE)} />
                            ) : null}
                        </>
                    )}
                </View>
            ) : null}

            {!booting && activeTab === 'leaderboard' ? (
                <View style={{ gap: 12 }}>
                    <SectionHeader
                        title="Arena League Standings"
                        subtitle="Calculated from certified matches between registered squads (3 pts win, 1 pt draw)"
                        style={{ marginBottom: 0 }}
                    />
                    <StandingsTable teams={teams} />
                    <SectionHeader
                        title="Golden Boot Leaderboard"
                        subtitle="Top goal scorers across all registered 90-minute fixtures"
                        style={{ marginBottom: 0, marginTop: 8 }}
                    />
                    <GoldenBoot scorers={topScorers} period={scorerPeriod} onChangePeriod={setScorerPeriod} />
                </View>
            ) : null}

            {!booting && activeTab === 'find_opponent' ? (
                <OpponentBoard challenges={openChallenges} onOpenBoard={openChallengeBoard} />
            ) : null}

            <SubmitResultSheet visible={showResultSheet} onClose={() => setShowResultSheet(false)} />
        </Screen>
    );
}
