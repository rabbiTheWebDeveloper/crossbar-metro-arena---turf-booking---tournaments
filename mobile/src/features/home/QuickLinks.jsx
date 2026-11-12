import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Trophy, Swords, Award, ShoppingBag, Camera, Users, MapPin, Info, Ticket, ShieldCheck, TrendingUp, BookOpen, User, LogIn } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, SectionHeader, AppText, ListItem, Divider } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { titleCase } from '@/lib/format';

const SECTIONS = [
    { href: '/events', label: 'Events', hint: 'Tournaments', icon: Trophy },
    { href: '/matches', label: 'Matches', hint: 'Fixtures & challenges', icon: Swords },
    { href: '/results', label: 'Match Day', hint: 'Results & standings', icon: Award },
    { href: '/shop', label: 'Shop', hint: 'Reserve & pick up', icon: ShoppingBag },
    { href: '/gallery', label: 'Gallery', hint: 'Arena photos', icon: Camera },
    { href: '/squad-builder', label: 'Squad builder', hint: 'Tag your line-up', icon: Users },
    { href: '/venue', label: 'Venue', hint: 'Metro guide', icon: MapPin },
    { href: '/about', label: 'About', hint: 'Price table & FAQ', icon: Info },
    { href: '/passes', label: 'My passes', hint: 'Match tickets', icon: Ticket }
];

/**
 * Shortcuts to every section of the app plus the role portals
 * (Arena Desk for admins, the investor portal, and the account screen).
 *   go(href): navigate      onOpenGuide: opens the admin handover guide
 */
export function QuickLinks({ go, onOpenGuide }) {
    const { isAdmin, isInvestor, isVisitor, currentUser } = useArena();

    return (
        <View>
            <SectionHeader eyebrow="Explore" title="Everything at the arena" />
            <View style={styles.grid}>
                {SECTIONS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Pressable key={item.href} onPress={() => go(item.href)} style={({ pressed }) => [styles.tile, pressed ? styles.tilePressed : null]} accessibilityRole="button" accessibilityLabel={item.label}>
                            <View style={styles.tileIcon}>
                                <Icon size={18} color={colors.brand} strokeWidth={2.2} />
                            </View>
                            <AppText size="sm" weight="800" center numberOfLines={1}>{item.label}</AppText>
                            <AppText size="xxs" tone="muted" center numberOfLines={1}>{item.hint}</AppText>
                        </Pressable>
                    );
                })}
            </View>

            <Card padded={false} style={{ marginTop: spacing.md, padding: spacing.xs }}>
                {isAdmin ? <ListItem icon={ShieldCheck} title="Arena Desk" subtitle="Bookings, pricing, expenses and reports" onPress={() => go('/admin')} /> : null}
                {isAdmin || isInvestor ? <ListItem icon={TrendingUp} title="Investor portal" subtitle="Monthly reports and payouts" onPress={() => go('/investor')} /> : null}
                {isAdmin ? <ListItem icon={BookOpen} iconTone={colors.warning} title="Handover Guide" subtitle="Operating manual for owners & managers" onPress={onOpenGuide} /> : null}
                {isAdmin || isInvestor ? <Divider style={{ marginVertical: 2 }} /> : null}
                {isVisitor ? (
                    <ListItem icon={LogIn} title="Log in / Sign up" subtitle="See your passes, manage your team and post results" onPress={() => go('/me')} />
                ) : (
                    <ListItem icon={User} title="My account" subtitle={`${currentUser?.name || 'Signed in'} · ${titleCase(currentUser?.role || 'player')}`} onPress={() => go('/me')} />
                )}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md, paddingHorizontal: spacing.xs, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    tilePressed: { borderColor: colors.borderBrand, backgroundColor: colors.brandSoft },
    tileIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }
});
