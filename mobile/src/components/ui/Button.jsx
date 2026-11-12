import React from 'react';
import { Pressable, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, radius, fontSize } from '../../theme';
import { AppText } from './Typography';

const VARIANTS = {
    primary: { bg: colors.brand, fg: colors.onBrand, border: colors.brand },
    secondary: { bg: colors.glassStrong, fg: colors.text, border: colors.borderStrong },
    outline: { bg: 'transparent', fg: colors.brand, border: colors.borderBrand },
    ghost: { bg: 'transparent', fg: colors.textSoft, border: 'transparent' },
    danger: { bg: colors.dangerSoft, fg: '#fb7185', border: 'rgba(244,63,94,0.4)' },
    dangerSolid: { bg: colors.danger, fg: colors.white, border: colors.danger },
    warning: { bg: colors.warningSoft, fg: colors.warning, border: 'rgba(251,191,36,0.4)' },
    info: { bg: colors.infoSoft, fg: colors.info, border: 'rgba(56,189,248,0.4)' }
};

const SIZES = {
    sm: { py: 7, px: 12, fs: fontSize.xs, icon: 14 },
    md: { py: 11, px: 16, fs: fontSize.sm, icon: 16 },
    lg: { py: 15, px: 20, fs: fontSize.md, icon: 18 }
};

/**
 * Button.
 *   title | children: label
 *   variant: primary | secondary | outline | ghost | danger | dangerSolid | warning | info
 *   size: sm | md | lg       icon / iconRight: a lucide icon component
 *   loading / disabled / block (full width)
 */
export function Button({ title, children, onPress, variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, disabled, block, upper = true, style, textStyle, ...rest }) {
    const v = VARIANTS[variant] || VARIANTS.primary;
    const s = SIZES[size] || SIZES.md;
    const inactive = disabled || loading;
    const label = title ?? children;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !!inactive, busy: !!loading }}
            {...rest}
            onPress={inactive ? undefined : onPress}
            android_ripple={inactive ? undefined : { color: 'rgba(255,255,255,0.12)' }}
            style={({ pressed }) => [
                styles.base,
                { backgroundColor: v.bg, borderColor: v.border, paddingVertical: s.py, paddingHorizontal: s.px },
                block ? { alignSelf: 'stretch' } : null,
                inactive ? { opacity: 0.5 } : null,
                pressed && !inactive ? { opacity: 0.85 } : null,
                style
            ]}
        >
            {loading ? <ActivityIndicator size="small" color={v.fg} /> : (Icon ? <Icon size={s.icon} color={v.fg} strokeWidth={2.4} /> : null)}
            {label !== undefined && label !== null && label !== '' ? (
                <AppText size={s.fs} weight="800" style={[{ color: v.fg, flexShrink: 1 }, upper ? { textTransform: 'uppercase', letterSpacing: 0.5 } : null, textStyle]} numberOfLines={2}>
                    {label}
                </AppText>
            ) : null}
            {IconRight && !loading ? <IconRight size={s.icon} color={v.fg} strokeWidth={2.4} /> : null}
        </Pressable>
    );
}

/** Square icon-only button. */
export function IconButton({ icon: Icon, onPress, size = 38, iconSize = 18, tone = colors.textSoft, bg = colors.glassStrong, border = colors.border, badge, disabled, style, accessibilityLabel, ...rest }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            hitSlop={6}
            {...rest}
            onPress={disabled ? undefined : onPress}
            style={({ pressed }) => [
                { width: size, height: size, borderRadius: size / 2.6, backgroundColor: bg, borderColor: border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
                disabled ? { opacity: 0.4 } : null,
                pressed ? { opacity: 0.7 } : null,
                style
            ]}
        >
            <Icon size={iconSize} color={tone} strokeWidth={2.2} />
            {badge ? (
                <View style={styles.badge}>
                    <AppText size={9} weight="900" style={{ color: colors.onBrand, lineHeight: 12 }}>{badge > 99 ? '99+' : String(badge)}</AppText>
                </View>
            ) : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
    badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }
});
