import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing } from '../../theme';
import { AppText, Heading } from './Typography';
import { useArena } from '../../context/ArenaContext';

/**
 * Top bar: back button (when `back`), title/subtitle and an optional right slot.
 * Used by Screen; exported for screens that manage their own scrolling (FlatList).
 */
export function ScreenHeader({ title, subtitle, back, onBack, right, left, style }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const goBack = () => {
        if (onBack) return onBack();
        if (router.canGoBack()) router.back();
        else router.replace('/');
    };
    return (
        <View style={[styles.header, { paddingTop: insets.top + 8 }, style]}>
            {back ? (
                <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
                    <ChevronLeft size={20} color={colors.text} />
                </Pressable>
            ) : left}
            <View style={{ flex: 1 }}>
                {typeof title === 'string' ? <Heading level={3} numberOfLines={1}>{title}</Heading> : title}
                {subtitle ? <AppText size="xs" tone="muted" numberOfLines={1}>{subtitle}</AppText> : null}
            </View>
            {right}
        </View>
    );
}

/**
 * Standard screen shell.
 *   title / subtitle / back / right / left: header (omit `title` and pass header={false} for none)
 *   scroll (default true): wraps children in a ScrollView with pull-to-refresh
 *   onRefresh: custom refresh handler (defaults to reloading all arena data); refreshable={false} disables
 *   footer: node pinned to the bottom (e.g. a checkout bar)
 *   tab: the screen lives inside the bottom tab bar (no bottom safe-area padding needed)
 */
export function Screen({ title, subtitle, back, onBack, right, left, header = true, scroll = true, refreshable = true, onRefresh, footer, tab, padded = true, children, contentStyle, style, scrollRef }) {
    const insets = useSafeAreaInsets();
    const { refreshData } = useArena();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try { await (onRefresh ? onRefresh() : refreshData()); } finally { setRefreshing(false); }
    }, [onRefresh, refreshData]);

    const showHeader = header && (title || back || right || left);
    const bottomPad = tab ? spacing.xl : Math.max(insets.bottom, spacing.md) + spacing.md;

    return (
        <KeyboardAvoidingView behavior="padding" style={[styles.root, style]}>
            {showHeader ? <ScreenHeader title={title} subtitle={subtitle} back={back} onBack={onBack} right={right} left={left} /> : <View style={{ height: header === false ? 0 : insets.top }} />}
            {scroll ? (
                <ScrollView
                    ref={scrollRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={[padded ? { padding: spacing.lg } : null, { gap: spacing.lg, paddingBottom: footer ? spacing.lg : bottomPad }, contentStyle]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    refreshControl={refreshable ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brand} colors={[colors.brand]} progressBackgroundColor={colors.card} /> : undefined}
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[{ flex: 1 }, padded ? { padding: spacing.lg } : null, contentStyle]}>{children}</View>
            )}
            {footer ? <View style={[styles.footer, { paddingBottom: tab ? spacing.md : Math.max(insets.bottom, spacing.md) }]}>{footer}</View> : null}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: 10, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.glassStrong, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, gap: spacing.sm }
});
