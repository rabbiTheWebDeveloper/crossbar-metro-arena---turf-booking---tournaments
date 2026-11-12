import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import { usePortalNav } from '@/lib/navigation';
import { Menu, Plus, Globe, TrendingUp, LogOut, DatabaseBackup, UserCheck } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Sheet, IconButton, AppText, Badge, Row, Divider, ListItem, confirm } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { ADMIN_NAV } from './nav';
import { WalkInBookingSheet } from './WalkInBookingSheet';

/** Pending-work counters shown as badges in the admin menu. */
export function useAdminBadges() {
    const { refunds, shopReservations, registrations, matchResults } = useArena();
    return useMemo(() => ({
        refunds: refunds.filter(r => r.status === 'pending').length,
        orders: shopReservations.filter(r => r.status === 'reserved_pickup').length,
        registrations: registrations.filter(r => r.status === 'pending').length,
        results: matchResults.filter(r => r.status === 'pending_approval').length
    }), [refunds, shopReservations, registrations, matchResults]);
}

/** Sheet listing every admin section (the app's version of the website sidebar). */
export function AdminMenuSheet({ visible, onClose }) {
    const pathname = usePathname();
    const openSection = usePortalNav('/admin');
    const badges = useAdminBadges();
    const { logout, switchDemoUser, demoMode, exportDatabaseBackup, currentUser } = useArena();

    const go = (href) => { onClose(); openSection(href); };
    const handleLogout = async () => {
        const ok = await confirm('Log out?', 'You will need to sign in again to manage the arena.', { confirmText: 'Log out', destructive: true });
        if (!ok) return;
        onClose();
        openSection('/');
        await logout();
    };

    return (
        <Sheet visible={visible} onClose={onClose} title="Arena Desk" subtitle={currentUser?.name ? `Signed in as ${currentUser.name}` : 'Admin console'} full>
            <View style={styles.grid}>
                {ADMIN_NAV.map(item => {
                    const active = item.href === '/admin' ? pathname === '/admin' : pathname === item.href;
                    const count = item.badge ? badges[item.badge] : 0;
                    const Icon = item.icon;
                    return (
                        <Pressable key={item.key} onPress={() => go(item.href)} style={[styles.tile, active ? styles.tileActive : null]}>
                            <Row justify="space-between">
                                <View style={[styles.tileIcon, active ? { backgroundColor: colors.brand } : null]}>
                                    <Icon size={17} color={active ? colors.onBrand : colors.brand} strokeWidth={2.2} />
                                </View>
                                {count > 0 ? <Badge tone="warning" label={String(count)} /> : null}
                            </Row>
                            <AppText size="sm" weight="800" numberOfLines={1}>{item.label}</AppText>
                            <AppText size="xs" tone="muted" numberOfLines={2}>{item.description}</AppText>
                        </Pressable>
                    );
                })}
            </View>
            <Divider style={{ marginVertical: 4 }} />
            <ListItem icon={Globe} title="Public app" subtitle="Back to the player-facing home" onPress={() => go('/')} />
            <ListItem icon={TrendingUp} title="Investor portal" subtitle="View the partner dashboards" onPress={() => go('/investor')} />
            <ListItem icon={DatabaseBackup} title="Export backup" subtitle="Share a JSON snapshot of all arena data" onPress={() => { onClose(); exportDatabaseBackup(); }} />
            {demoMode ? (
                <>
                    <ListItem icon={UserCheck} title="Switch to Player demo" onPress={async () => { onClose(); const r = await switchDemoUser('player'); if (r?.success) openSection('/me'); }} />
                    <ListItem icon={TrendingUp} title="Switch to Investor demo" onPress={async () => { onClose(); const r = await switchDemoUser('investor'); if (r?.success) openSection('/investor'); }} />
                </>
            ) : null}
            <ListItem icon={LogOut} iconTone={colors.danger} title="Log out" onPress={handleLogout} chevron={false} />
        </Sheet>
    );
}

/**
 * Shell for every admin screen: header with the section menu and the walk-in booking shortcut.
 * Accepts all <Screen> props (title, subtitle, scroll, footer, onRefresh, ...).
 *   right: extra header actions rendered before the built-in buttons
 *   walkIn: show the "+" walk-in booking button (default true)
 */
export function AdminScreen({ title, subtitle, right, walkIn = true, children, ...screenProps }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [walkInOpen, setWalkInOpen] = useState(false);
    const badges = useAdminBadges();
    const pending = badges.refunds + badges.orders + badges.registrations + badges.results;

    return (
        <>
            <Screen
                back
                title={title}
                subtitle={subtitle}
                right={(
                    <Row gap={8}>
                        {right}
                        {walkIn ? <IconButton icon={Plus} onPress={() => setWalkInOpen(true)} tone={colors.onBrand} bg={colors.brand} border={colors.brand} accessibilityLabel="Walk-in booking" /> : null}
                        <IconButton icon={Menu} onPress={() => setMenuOpen(true)} badge={pending} accessibilityLabel="Admin menu" />
                    </Row>
                )}
                {...screenProps}
            >
                {children}
            </Screen>
            <AdminMenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} />
            {walkIn ? <WalkInBookingSheet visible={walkInOpen} onClose={() => setWalkInOpen(false)} /> : null}
        </>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { flexBasis: '47%', flexGrow: 1, gap: 4, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    tileActive: { borderColor: colors.borderBrand, backgroundColor: colors.brandSoft },
    tileIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }
});
