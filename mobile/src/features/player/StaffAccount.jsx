import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LayoutDashboard, TrendingUp, ChevronRight, User, Lock, Ticket, Calendar, LogOut } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Card, Button, AppText, Heading, ListItem, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { AccountCard } from './AccountCard';
import { PassCard } from './PassCard';
import { ProfileSheet, PasswordSheet } from './ProfileForms';
import { useActivePasses, useLogout } from './hooks';

const MAX_PASSES = 3;

function PortalButton({ icon: Icon, title, subtitle, onPress }) {
    return (
        <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.portal, pressed ? { opacity: 0.85 } : null]}>
            <View style={styles.portalIcon}>
                <Icon size={22} color={colors.onBrand} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
                <Heading level={3}>{title}</Heading>
                <AppText size="sm" tone="muted">{subtitle}</AppText>
            </View>
            <ChevronRight size={20} color={colors.brand} />
        </Pressable>
    );
}

/** Me tab for admins and investors: account card, portal shortcuts, own passes and logout. */
export function StaffAccount() {
    const router = useRouter();
    const { currentUser, isAdmin, setActiveTicketPass } = useArena();
    const { confirmLogout, loggingOut } = useLogout();
    const passes = useActivePasses();
    const [profileOpen, setProfileOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);

    return (
        <Screen tab title="My account" subtitle={isAdmin ? 'Arena admin' : 'Investor partner'}>
            <AccountCard user={currentUser} />

            <View style={{ gap: spacing.md }}>
                {isAdmin ? (
                    <PortalButton icon={LayoutDashboard} title="Arena Desk" subtitle="Bookings, schedule, finance and arena management" onPress={() => router.push('/admin')} />
                ) : null}
                <PortalButton icon={TrendingUp} title="Investor portal" subtitle="Profit share, expenses and payout reports" onPress={() => router.push('/investor')} />
            </View>

            <Card padded={false} style={{ paddingVertical: spacing.xs }}>
                <ListItem icon={User} title="Edit profile" subtitle="Name and e-mail address" onPress={() => setProfileOpen(true)} />
                <ListItem icon={Lock} title="Change password" onPress={() => setPasswordOpen(true)} />
                <ListItem icon={Calendar} title="Book a slot" subtitle="Pick a 90-minute kickoff on the turf" onPress={() => router.navigate('/booking')} />
                <ListItem icon={Ticket} title="My match passes" subtitle="Bookings made with your mobile number" badge={passes.length} onPress={() => router.push('/passes')} />
            </Card>

            {passes.length > 0 ? (
                <View style={{ gap: spacing.md }}>
                    <SectionHeader
                        title="My bookings"
                        action={passes.length > MAX_PASSES ? `All ${passes.length}` : undefined}
                        onAction={() => router.push('/passes')}
                        style={{ marginBottom: 0 }}
                    />
                    {passes.slice(0, MAX_PASSES).map(b => (
                        <PassCard key={b.id} booking={b} onPress={() => setActiveTicketPass(b)} />
                    ))}
                </View>
            ) : null}

            <Button title={loggingOut ? 'Logging out…' : 'Logout'} icon={LogOut} variant="danger" block loading={loggingOut} onPress={confirmLogout} />

            <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} showPosition={false} />
            <PasswordSheet visible={passwordOpen} onClose={() => setPasswordOpen(false)} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    portal: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderBrand, backgroundColor: colors.brandSoft },
    portalIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }
});
