import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag, Star, AlertCircle, Award, ChevronRight } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { radius, spacing, tones } from '@/theme';
import { useAdminBadges } from '../AdminScreen';

/** Banners for work that is waiting on the desk (orders, registrations, refunds, results). */
export function PendingAlerts() {
    const router = useRouter();
    const badges = useAdminBadges();
    const alerts = [
        { key: 'orders', count: badges.orders, icon: ShoppingBag, tone: 'warning', href: '/admin/shop-orders', text: `${badges.orders} shop reservation(s) waiting for pickup` },
        { key: 'registrations', count: badges.registrations, icon: Star, tone: 'warning', href: '/admin/registrations', text: `${badges.registrations} event registration(s) to review` },
        { key: 'refunds', count: badges.refunds, icon: AlertCircle, tone: 'danger', href: '/admin/refunds', text: `${badges.refunds} refund(s) pending` },
        { key: 'results', count: badges.results, icon: Award, tone: 'brand', href: '/admin/match-results', text: `${badges.results} match result(s) awaiting approval` }
    ].filter(a => a.count > 0);
    if (alerts.length === 0) return null;

    return (
        <View style={{ gap: spacing.sm }}>
            {alerts.map(a => {
                const t = tones[a.tone];
                const Icon = a.icon;
                return (
                    <Pressable key={a.key} onPress={() => router.navigate(a.href)} style={({ pressed }) => [styles.alert, { backgroundColor: t.bg, borderColor: t.border }, pressed ? { opacity: 0.8 } : null]} accessibilityRole="button">
                        <Icon size={16} color={t.fg} />
                        <AppText size="sm" weight="600" style={{ flex: 1, color: t.fg }}>{a.text}</AppText>
                        <ChevronRight size={16} color={t.fg} />
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    alert: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 }
});
