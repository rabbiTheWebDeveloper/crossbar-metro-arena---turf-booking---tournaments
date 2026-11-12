import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Trophy, Calendar, Award, Shield, Phone, MessageCircle } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Button, EmptyState, Notice, Loading, AppText, Heading, GradientCard, Row } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { todayDhakaIso } from '@/lib/dateUtils';
import { cleanPhone } from '@/lib/phone';
import { PageHero } from '@/components/PageHero';
import { openLink } from '@/features/matchday/matchdayUtils';
import { TournamentCard } from '@/features/events/TournamentCard';
import { TournamentRegistrationSheet } from '@/features/events/TournamentRegistrationSheet';
import { orderTournaments } from '@/features/events/tournamentUtils';

/** Tournaments & events: every listed cup with its details and the team registration form. */
export default function EventsScreen() {
    const { tournaments, handleRegistrationSuccess, siteSettings, isInitialized, isLoadingData, loadError, showNotice } = useArena();
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [justRegistered, setJustRegistered] = useState(null); // { teamName, tournamentTitle, message }
    const today = todayDhakaIso();

    const list = tournaments || [];
    const totalPrizePool = list.reduce((sum, t) => sum + (Number(t.prizePool) || 0), 0);
    // Open tournaments first, then full / closed ones (kept visible with a badge)
    const ordered = useMemo(() => orderTournaments(tournaments, today), [tournaments, today]);
    const hasOpen = ordered.some(x => x.availability === 'open');

    const phoneDigits = siteSettings?.phone ? cleanPhone(siteSettings.phone) : '';
    const phoneLabel = siteSettings?.phoneFormatted || siteSettings?.phone || '';
    const callArena = () => openLink(`tel:${phoneDigits}`, () => showNotice('error', 'Could not open the phone dialler on this device.'));
    const messageArena = () => openLink(siteSettings?.whatsappUrl, () => showNotice('error', 'Could not open WhatsApp on this device.'));

    const openRegistration = (t) => {
        setSelectedTournament(t);
        setSheetOpen(true);
    };

    const handleRegister = async (payload) => {
        const result = await handleRegistrationSuccess(payload);
        if (result && result.ok) {
            setJustRegistered({ teamName: payload.teamName, tournamentTitle: payload.tournamentTitle, message: result.message });
        }
        return result;
    };

    const booting = !isInitialized || (isLoadingData && list.length === 0);

    return (
        <Screen back title="Tournaments & Events" subtitle="Arena events">
            <PageHero
                eyebrow="Competitive Football & Corporate Cups"
                eyebrowIcon={Trophy}
                title="Tournaments &"
                highlight="Events"
                description="Compete in high-stakes 7v7 and 5v5 weekend blitz tournaments under 400-lux stadium floodlights. Register your squad online today."
                stats={[
                    { label: 'Active Cups', value: `${list.length} Tournaments`, icon: Trophy },
                    { label: 'Total Prize Pool', value: `৳${(totalPrizePool / 1000).toFixed(0)}K+`, icon: Award },
                    { label: 'Officiating', value: 'BFF Certified', icon: Shield },
                    { label: 'Format', value: '7-a-side & 5-a-side', icon: Calendar }
                ]}
            />

            {loadError ? <Notice type="error" message={loadError} /> : null}

            {justRegistered ? (
                <Notice
                    type="success"
                    title="Registration received."
                    message={justRegistered.message || `Team ${justRegistered.teamName} has been entered into ${justRegistered.tournamentTitle}. The match committee will confirm your spot after checking the entry fee.`}
                >
                    <Button title="Dismiss" variant="ghost" size="sm" onPress={() => setJustRegistered(null)} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                </Notice>
            ) : null}

            {booting ? <Loading label="Loading tournaments…" /> : null}

            {!booting && ordered.length === 0 ? (
                <EmptyState
                    icon={Trophy}
                    title="No tournaments announced"
                    message="There are no tournament registrations open right now. Check back soon, or contact the arena to host a private cup."
                    action={phoneDigits ? <Button title={`Call the arena (${phoneLabel})`} icon={Phone} variant="warning" size="sm" upper={false} onPress={callArena} /> : null}
                />
            ) : null}

            {!booting && ordered.length > 0 ? (
                <View style={{ gap: spacing.lg }}>
                    {!hasOpen ? <AppText size="xs" tone="muted" center>Registration is currently closed for all listed tournaments.</AppText> : null}
                    {ordered.map(({ t, availability }) => (
                        <TournamentCard key={t.id} tournament={t} availability={availability} onRegister={() => openRegistration(t)} />
                    ))}
                </View>
            ) : null}

            <GradientCard>
                <Row align="flex-start" gap={spacing.md}>
                    <View style={{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand }}>
                        <Shield size={20} color={colors.brand} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Heading level={3} upper>Host a Corporate Cup or Private Tournament</Heading>
                        <AppText size="sm" tone="soft">
                            Need an all-day booking, referees and a custom format for your company, university or friends' league? Talk to the arena desk and we will put a package together.
                        </AppText>
                    </View>
                </Row>
                {phoneDigits ? (
                    <Button title={`Call the arena (${phoneLabel})`} icon={Phone} block upper={false} onPress={callArena} style={{ marginTop: spacing.md }} />
                ) : (siteSettings?.whatsappUrl ? (
                    <Button title="Message on WhatsApp" icon={MessageCircle} block upper={false} onPress={messageArena} style={{ marginTop: spacing.md }} />
                ) : null)}
            </GradientCard>

            <TournamentRegistrationSheet
                visible={sheetOpen}
                tournament={selectedTournament}
                onClose={() => setSheetOpen(false)}
                onRegister={handleRegister}
            />
        </Screen>
    );
}
