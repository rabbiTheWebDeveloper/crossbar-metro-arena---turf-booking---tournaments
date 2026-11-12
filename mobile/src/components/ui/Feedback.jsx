import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Animated, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertTriangle, Info, X, Inbox } from 'lucide-react-native';
import { colors, radius, spacing, tones } from '../../theme';
import { AppText, Heading } from './Typography';
import { useArena } from '../../context/ArenaContext';

/** Small status pill. tone: brand | success | danger | warning | info | purple | neutral */
export function Badge({ label, children, tone = 'neutral', icon: Icon, solid, style }) {
    const t = tones[tone] || tones.neutral;
    const fg = solid ? colors.onBrand : t.fg;
    return (
        <View style={[styles.badge, { backgroundColor: solid ? t.fg : t.bg, borderColor: solid ? t.fg : t.border }, style]}>
            {Icon ? <Icon size={11} color={fg} strokeWidth={2.6} /> : null}
            <AppText size="xxs" weight="900" style={{ color: fg, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 14 }} numberOfLines={1}>
                {label ?? children}
            </AppText>
        </View>
    );
}

/** Centered spinner with an optional caption. */
export function Loading({ label, style }) {
    return (
        <View style={[{ alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.sm }, style]}>
            <ActivityIndicator size="large" color={colors.brand} />
            {label ? <AppText size="sm" tone="muted">{label}</AppText> : null}
        </View>
    );
}

/** Placeholder for empty lists. */
export function EmptyState({ icon: Icon = Inbox, title, message, action, style }) {
    return (
        <View style={[styles.empty, style]}>
            <View style={styles.emptyIcon}>
                <Icon size={26} color={colors.textDim} strokeWidth={1.8} />
            </View>
            {title ? <Heading level={4} center>{title}</Heading> : null}
            {message ? <AppText size="sm" tone="muted" center>{message}</AppText> : null}
            {action}
        </View>
    );
}

const NOTICE_ICONS = { success: CheckCircle2, error: AlertTriangle, danger: AlertTriangle, warning: AlertTriangle, info: Info };
const NOTICE_TONES = { success: 'success', error: 'danger', danger: 'danger', warning: 'warning', info: 'info' };

/** Inline message box. type: success | error | warning | info */
export function Notice({ type = 'info', title, message, children, style }) {
    const t = tones[NOTICE_TONES[type] || 'info'];
    const Icon = NOTICE_ICONS[type] || Info;
    return (
        <View style={[styles.notice, { backgroundColor: t.bg, borderColor: t.border }, style]}>
            <Icon size={16} color={t.fg} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 2 }}>
                {title ? <AppText size="sm" weight="800" style={{ color: t.fg }}>{title}</AppText> : null}
                {message ? <AppText size="sm" tone="soft">{message}</AppText> : null}
                {children}
            </View>
        </View>
    );
}

/** Thin progress bar (0..100). */
export function ProgressBar({ value = 0, tone = 'brand', height = 6, style }) {
    const t = tones[tone] || tones.brand;
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    return (
        <View style={[{ height, borderRadius: height, backgroundColor: colors.glassStrong, overflow: 'hidden' }, style]}>
            <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: t.fg }} />
        </View>
    );
}

/**
 * Global toast fed by `showNotice()` from the ArenaContext. Rendered once in the root layout.
 */
export function Toast() {
    const { notice, setNotice } = useArena();
    const insets = useSafeAreaInsets();
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!notice) return;
        anim.setValue(0);
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 80 }).start();
    }, [notice, anim]);

    if (!notice) return null;
    const type = notice.type || 'info';
    const t = tones[NOTICE_TONES[type] || 'info'];
    const Icon = NOTICE_ICONS[type] || Info;
    return (
        <Animated.View
            pointerEvents="box-none"
            style={[styles.toastWrap, { top: insets.top + 8, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}
        >
            <Pressable onPress={() => setNotice(null)} style={[styles.toast, { borderColor: t.border }]}>
                <Icon size={18} color={t.fg} />
                <AppText size="sm" weight="600" style={{ flex: 1 }}>{notice.message}</AppText>
                <X size={14} color={colors.textDim} />
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
    empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
    emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    notice: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
    toastWrap: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 1000, elevation: 20 },
    toast: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#111a24', borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12 }
});
