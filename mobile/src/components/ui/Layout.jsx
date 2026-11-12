import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { colors, radius, spacing, tones } from '../../theme';
import { AppText, Heading, Label } from './Typography';

/**
 * Card surface.  tone: undefined | brand | danger | warning | info | purple   onPress: makes it tappable
 */
export function Card({ children, tone, onPress, padded = true, style, ...rest }) {
    const t = tone ? tones[tone] : null;
    const base = [
        styles.card,
        padded ? { padding: spacing.lg } : null,
        t ? { borderColor: t.border, backgroundColor: colors.card } : null,
        style
    ];
    if (onPress) {
        return (
            <Pressable {...rest} onPress={onPress} style={({ pressed }) => [...base, pressed ? { opacity: 0.85 } : null]}>
                {children}
            </Pressable>
        );
    }
    return <View {...rest} style={base}>{children}</View>;
}

/** Card with the green brand gradient wash used for hero / highlight blocks. */
export function GradientCard({ children, colors: gradient = ['rgba(76,191,2,0.20)', 'rgba(12,19,26,0.95)'], style, padded = true }) {
    return (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderColor: colors.borderBrand }, padded ? { padding: spacing.lg } : null, style]}>
            {children}
        </LinearGradient>
    );
}

/** Horizontal flex row. */
export function Row({ children, gap = spacing.sm, align = 'center', justify = 'flex-start', wrap, style, ...rest }) {
    return (
        <View {...rest} style={[{ flexDirection: 'row', alignItems: align, justifyContent: justify, gap }, wrap ? { flexWrap: 'wrap' } : null, style]}>
            {children}
        </View>
    );
}

/** Vertical stack with a gap. */
export function Stack({ children, gap = spacing.md, style, ...rest }) {
    return <View {...rest} style={[{ gap }, style]}>{children}</View>;
}

export function Divider({ style }) {
    return <View style={[styles.divider, style]} />;
}

export function Spacer({ size = spacing.md }) {
    return <View style={{ height: size, width: size }} />;
}

/** Section title with optional eyebrow, subtitle and a right-side action. */
export function SectionHeader({ eyebrow, title, subtitle, action, onAction, right, style }) {
    return (
        <View style={[{ gap: 2, marginBottom: spacing.sm }, style]}>
            {eyebrow ? <Label tone="brand">{eyebrow}</Label> : null}
            <Row justify="space-between" align="center">
                <Heading level={3} style={{ flex: 1 }}>{title}</Heading>
                {right}
                {action ? (
                    <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <AppText size="xs" tone="brand" weight="800" upper>{action}</AppText>
                        <ChevronRight size={14} color={colors.brand} />
                    </Pressable>
                ) : null}
            </Row>
            {subtitle ? <AppText size="sm" tone="muted">{subtitle}</AppText> : null}
        </View>
    );
}

/** "Label ........ value" line used in summaries and receipts. */
export function KeyValue({ label, value, tone = 'default', mono, bold, style, valueStyle }) {
    return (
        <Row justify="space-between" align="flex-start" style={[{ paddingVertical: 3 }, style]}>
            <AppText size="sm" tone="muted" style={{ flexShrink: 1, paddingRight: spacing.sm }}>{label}</AppText>
            {typeof value === 'string' || typeof value === 'number' ? (
                <AppText size="sm" tone={tone} mono={mono} weight={bold ? '800' : '600'} style={[{ flexShrink: 1, textAlign: 'right' }, valueStyle]}>{value}</AppText>
            ) : value}
        </Row>
    );
}

/** Tappable list row with icon, title, subtitle and chevron (menus, settings). */
export function ListItem({ icon: Icon, iconTone = colors.brand, title, subtitle, right, onPress, badge, chevron = true, style }) {
    return (
        <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listItem, pressed ? { backgroundColor: colors.glassStrong } : null, style]}>
            {Icon ? (
                <View style={styles.listIcon}>
                    <Icon size={18} color={iconTone} strokeWidth={2.2} />
                </View>
            ) : null}
            <View style={{ flex: 1 }}>
                <AppText size="md" weight="700">{title}</AppText>
                {subtitle ? <AppText size="xs" tone="muted">{subtitle}</AppText> : null}
            </View>
            {badge ? (
                <View style={styles.listBadge}>
                    <AppText size="xs" weight="900" style={{ color: colors.onBrand }}>{String(badge)}</AppText>
                </View>
            ) : null}
            {right}
            {onPress && chevron ? <ChevronRight size={18} color={colors.textDim} /> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    divider: { height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border, marginVertical: spacing.md },
    listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md },
    listIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
    listBadge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }
});
