import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useIsFocused } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { AppText, Mono } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const INTERVAL_SECONDS = 60;

/**
 * "Refreshes in 42s · Refresh now" pill. Re-fetches availability every 60 seconds while the
 * screen is focused. The countdown lives here so it does not re-render the slot grid each second.
 *   onRefresh: async () => void
 */
export function RefreshIndicator({ onRefresh }) {
    const focused = useIsFocused();
    const [countdown, setCountdown] = useState(INTERVAL_SECONDS);
    const [refreshing, setRefreshing] = useState(false);
    const refreshRef = useRef(onRefresh);
    refreshRef.current = onRefresh;
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        if (!focused) return undefined;
        const timer = setInterval(() => setCountdown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(timer);
    }, [focused]);

    // Countdown reached zero: silent background refresh
    useEffect(() => {
        if (countdown > 0) return;
        setCountdown(INTERVAL_SECONDS);
        Promise.resolve(refreshRef.current ? refreshRef.current() : null).catch(() => { /* ignore */ });
    }, [countdown]);

    const refreshNow = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await (refreshRef.current ? refreshRef.current() : null);
        } catch { /* ignore */ } finally {
            if (mounted.current) {
                setRefreshing(false);
                setCountdown(INTERVAL_SECONDS);
            }
        }
    };

    return (
        <View style={styles.wrap}>
            {refreshing ? <ActivityIndicator size="small" color={colors.brand} /> : <RefreshCw size={14} color={colors.brand} />}
            <AppText size="xs" tone="soft">Refreshes in:</AppText>
            <Mono size="xs" tone="brand">{`${countdown}s`}</Mono>
            <Pressable onPress={refreshNow} disabled={refreshing} hitSlop={10} style={refreshing ? { opacity: 0.5 } : null} accessibilityRole="button">
                <AppText size="xs" weight="800" tone="muted" style={{ textDecorationLine: 'underline' }}>Refresh Now</AppText>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: spacing.sm, paddingVertical: 7, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }
});
