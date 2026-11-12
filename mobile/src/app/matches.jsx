import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOpenTab } from '@/lib/navigation';
import { Flame, Calendar, Users, Swords, Ticket, Clock, Plus, User } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Segmented, Button, EmptyState, Notice, Loading, AppText, Row } from '@/components/ui';
import { todayDhakaIso } from '@/lib/dateUtils';
import { PageHero } from '@/components/PageHero';
import { FixtureCard } from '@/features/matchday/FixtureCard';
import { ChallengeCard } from '@/features/matchday/ChallengeCard';
import { MyChallengesList } from '@/features/matchday/MyChallengesList';
import { PostChallengeSheet } from '@/features/matchday/PostChallengeSheet';
import { ContactButtons } from '@/features/matchday/ContactButtons';
import { upcomingFixtures } from '@/features/matchday/matchdayUtils';

const MAX_FIXTURES = 12;
const TABS = ['fixtures', 'challenges', 'mine'];

/**
 * Matchday hub: confirmed upcoming fixtures and the community squad challenge board
 * (post, accept and manage challenges). Open with `/matches?tab=challenges` to land on the board.
 */
export default function MatchesScreen() {
    const router = useRouter();
    const openTab = useOpenTab();
    const params = useLocalSearchParams();
    const {
        bookings, challenges, myChallenges, siteSettings, isVisitor, isInitialized, isLoadingData, loadError,
        promptLogin, showNotice, handleUpdateChallenge
    } = useArena();
    const today = todayDhakaIso();

    const initialTab = TABS.includes(String(params.tab)) ? String(params.tab) : 'fixtures';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showPostSheet, setShowPostSheet] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [acceptResult, setAcceptResult] = useState(null); // { message, teamName, captainName, captainPhone }

    const fixtures = useMemo(() => upcomingFixtures(bookings, today), [bookings, today]);
    const openChallenges = useMemo(() => (challenges || []).filter(c => (c.status || 'open') === 'open'), [challenges]);
    const myIds = useMemo(() => new Set((myChallenges || []).map(c => c.id)), [myChallenges]);
    const tab = activeTab === 'mine' && isVisitor ? 'challenges' : activeTab;

    const requireLogin = () => {
        if (!isVisitor) return true;
        promptLogin('login');
        showNotice('info', 'Please log in to post or accept a squad challenge.');
        return false;
    };

    const openPostSheet = () => {
        if (!requireLogin()) return;
        setShowPostSheet(true);
    };

    const handleAccept = async (c) => {
        if (!requireLogin()) return;
        setBusyId(c.id);
        const res = await handleUpdateChallenge(c.id, { action: 'accept' });
        setBusyId(null);
        if (res && res.ok) {
            // The accepted challenge leaves the open board, so the reveal message is kept in a banner
            const accepted = res.challenge || c;
            setAcceptResult({ message: res.message, teamName: accepted.teamName || c.teamName, captainName: accepted.captainName || c.captainName, captainPhone: accepted.captainPhone });
        }
    };

    const handleCloseOwn = async (c) => {
        setBusyId(c.id);
        await handleUpdateChallenge(c.id, { status: 'closed' });
        setBusyId(null);
    };

    const goBooking = () => openTab('/booking');
    const kickoffWindow = String(siteSettings?.openingHours || '6 AM – 12 AM').replace(/\s*\(Midnight\)/i, '').replace(/ Every Day/i, '');
    const booting = !isInitialized || (isLoadingData && (bookings || []).length === 0 && (challenges || []).length === 0);

    const tabOptions = [
        { value: 'fixtures', label: `Confirmed Fixtures (${fixtures.length})`, icon: Calendar },
        { value: 'challenges', label: `Squad Challenges (${openChallenges.length})`, icon: Users }
    ];
    if (!isVisitor) tabOptions.push({ value: 'mine', label: `My Challenges (${(myChallenges || []).length})`, icon: User });

    return (
        <Screen back title="Fixtures & Challenges" subtitle="Matchday hub">
            <PageHero
                eyebrow="Matchday Hub"
                eyebrowIcon={Flame}
                title="Fixtures &"
                highlight="Squad Challenges"
                description="Track upcoming kickoffs on the arena turf, find opponents for a scrimmage, or recruit guest players to complete your squad."
                stats={[
                    { label: 'Confirmed Fixtures', value: `${fixtures.length}`, icon: Ticket },
                    { label: 'Open Challenges', value: `${openChallenges.length}`, icon: Swords },
                    { label: 'Turf', value: '1 Floodlit Pitch', icon: Users },
                    { label: 'Kickoff Window', value: kickoffWindow, icon: Calendar }
                ]}
                actions={(
                    <>
                        <Button title="Schedule A Fixture" icon={Calendar} size="sm" onPress={goBooking} />
                        <Button title="Build Your Squad" icon={Users} variant="secondary" size="sm" onPress={() => router.push('/squad-builder')} />
                    </>
                )}
            />

            {loadError ? <Notice type="error" message={loadError} /> : null}

            <Segmented value={tab} onChange={setActiveTab} options={tabOptions} scroll />

            {tab === 'fixtures' ? (
                <Button title="Book a Slot" icon={Clock} variant="secondary" block onPress={goBooking} />
            ) : (
                <Button title="Post Match Challenge" icon={Plus} block onPress={openPostSheet} />
            )}

            {booting ? <Loading label="Loading fixtures and challenges…" /> : null}

            {!booting && tab === 'fixtures' ? (
                fixtures.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="No confirmed fixtures in the booking window yet"
                        message="Be the first squad to book a slot at Crossbar Metro Arena."
                        action={<Button title="Book Playing Slot" size="sm" onPress={goBooking} />}
                    />
                ) : (
                    <View style={{ gap: 12 }}>
                        {fixtures.slice(0, MAX_FIXTURES).map(b => <FixtureCard key={b.id || `${b.date}_${b.slotNumber}`} booking={b} today={today} />)}
                        {fixtures.length > MAX_FIXTURES ? (
                            <AppText size="xs" tone="muted" center>
                                {`Showing the next ${MAX_FIXTURES} of ${fixtures.length} confirmed fixtures. Open the booking calendar for the full schedule.`}
                            </AppText>
                        ) : null}
                    </View>
                )
            ) : null}

            {!booting && tab === 'challenges' ? (
                <View style={{ gap: 12 }}>
                    {acceptResult ? (
                        <Notice type="success" title={`Challenge accepted${acceptResult.teamName ? `: ${acceptResult.teamName}` : ''}`} message={acceptResult.message || 'Challenge accepted. The captain will be in touch.'}>
                            <Row wrap style={{ marginTop: 8 }}>
                                <ContactButtons
                                    phone={acceptResult.captainPhone}
                                    message={`Hi Captain ${acceptResult.captainName || ''}, we want to play against ${acceptResult.teamName || 'your squad'} at Crossbar Metro Arena!`}
                                />
                                <Button title="Dismiss" variant="ghost" size="sm" onPress={() => setAcceptResult(null)} />
                            </Row>
                        </Notice>
                    ) : null}
                    {openChallenges.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No open challenges right now"
                            message="Post your squad's challenge or ask for guest players and other Dhaka captains can accept it."
                            action={<Button title="Post a Match Challenge" size="sm" onPress={openPostSheet} />}
                        />
                    ) : (
                        openChallenges.map(c => (
                            <ChallengeCard
                                key={c.id}
                                challenge={c}
                                own={myIds.has(c.id)}
                                busy={busyId === c.id}
                                onAccept={() => handleAccept(c)}
                                onClose={() => handleCloseOwn(c)}
                            />
                        ))
                    )}
                </View>
            ) : null}

            {!booting && tab === 'mine' ? <MyChallengesList onPost={openPostSheet} /> : null}

            <PostChallengeSheet visible={showPostSheet} onClose={() => setShowPostSheet(false)} onPosted={() => setActiveTab('challenges')} />
        </Screen>
    );
}
