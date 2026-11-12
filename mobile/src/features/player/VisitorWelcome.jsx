import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ticket, Users, Trophy, MessageSquare, LogIn, UserPlus, Search, Calendar } from 'lucide-react-native';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { Screen, Card, GradientCard, Row, Button, AppText, Heading, Label, ListItem } from '@/components/ui';
import { colors, spacing } from '@/theme';

const BENEFITS = [
    { icon: Ticket, title: 'Bookings & match passes', text: 'See every slot you booked, open the digital pass and cancel online inside the cancellation window.' },
    { icon: Users, title: 'Your squad roster', text: 'Register a team and add players with jersey numbers and positions.' },
    { icon: Trophy, title: 'Match results & leaderboard', text: 'Submit scores, scorers and cards to the public Match Day leaderboard.' },
    { icon: MessageSquare, title: 'Challenge other teams', text: 'Post an opponent-wanted challenge for your preferred date and slot.' }
];

/** Me tab for visitors: what an account gives you, sign-in / sign-up and the booking lookup. */
export function VisitorWelcome() {
    const router = useRouter();
    return (
        <Screen tab title="Player & Team Portal" subtitle="My Squad · Bookings · Match Records">
            <GradientCard style={{ gap: spacing.md, alignItems: 'center' }}>
                <CrossbarLogo size="lg" />
                <Heading level={2} center>Player & Team Matchday Hub</Heading>
                <AppText size="sm" tone="soft" center>
                    Manage your bookings and passes, build your squad roster, submit match results to the public leaderboard, and challenge other teams.
                </AppText>
                <AppText size="sm" tone="muted" center>
                    You are browsing as a <AppText size="sm" weight="800">Visitor</AppText>. Log in with your mobile number to see your bookings, teams and results.
                </AppText>
                <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
                    <Button title="Log In" icon={LogIn} size="lg" block onPress={() => router.push('/login')} />
                    <Button title="Create Player Account" icon={UserPlus} variant="outline" size="lg" block onPress={() => router.push('/register')} />
                </View>
            </GradientCard>

            <Card style={{ gap: spacing.md }}>
                <Label tone="brand">With a Crossbar account</Label>
                {BENEFITS.map(b => {
                    const Icon = b.icon;
                    return (
                        <Row key={b.title} gap={spacing.md} align="flex-start">
                            <View style={styles.icon}>
                                <Icon size={17} color={colors.brand} strokeWidth={2.2} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <AppText size="md" weight="800">{b.title}</AppText>
                                <AppText size="sm" tone="muted">{b.text}</AppText>
                            </View>
                        </Row>
                    );
                })}
            </Card>

            <Card padded={false} style={{ paddingVertical: spacing.xs }}>
                <ListItem icon={Search} title="Find a booking" subtitle="Booked without an account? Open your pass with the booking code and phone number." onPress={() => router.push('/passes')} />
                <ListItem icon={Calendar} title="Book a slot" subtitle="Pick a 90-minute kickoff on the turf" onPress={() => router.navigate('/booking')} />
            </Card>
        </Screen>
    );
}

const styles = StyleSheet.create({
    icon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }
});
