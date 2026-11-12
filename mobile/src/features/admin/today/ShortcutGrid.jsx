import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { ADMIN_NAV } from '../nav';
import { useAdminBadges } from '../AdminScreen';

/** Compact grid of shortcuts to every other Arena Desk section, with pending-work counters. */
export function ShortcutGrid() {
    const router = useRouter();
    const badges = useAdminBadges();
    return (
        <View style={styles.grid}>
            {ADMIN_NAV.filter(item => item.key !== 'today').map(item => {
                const Icon = item.icon;
                const count = item.badge ? badges[item.badge] : 0;
                return (
                    <Pressable key={item.key} onPress={() => router.navigate(item.href)} style={({ pressed }) => [styles.tile, pressed ? { backgroundColor: colors.glassStrong } : null]} accessibilityRole="button" accessibilityLabel={item.label}>
                        <View style={styles.icon}>
                            <Icon size={17} color={colors.brand} strokeWidth={2.2} />
                            {count > 0 ? (
                                <View style={styles.count}>
                                    <AppText size={9} weight="900" style={{ color: colors.onBrand, lineHeight: 12 }}>{count > 99 ? '99+' : String(count)}</AppText>
                                </View>
                            ) : null}
                        </View>
                        <AppText size="xs" weight="700" center numberOfLines={2}>{item.label}</AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 6, paddingVertical: spacing.md, paddingHorizontal: 6, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
    count: { position: 'absolute', top: -5, right: -7, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center' }
});
