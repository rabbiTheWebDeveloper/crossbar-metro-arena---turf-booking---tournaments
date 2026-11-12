import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize } from '../../theme';

const TONE_COLORS = {
    default: colors.text,
    soft: colors.textSoft,
    muted: colors.textMuted,
    dim: colors.textDim,
    brand: colors.brand,
    danger: '#fb7185',
    warning: colors.warning,
    info: colors.info,
    purple: colors.purple,
    onBrand: colors.onBrand,
    white: colors.white
};

/**
 * Base text. Every string in the app must be rendered through this (or a sibling below).
 *   size:   key of theme.fontSize (xxs..hero) or a number
 *   tone:   default | soft | muted | dim | brand | danger | warning | info | purple | onBrand | white
 *   weight: '400'..'900' | 'bold'
 *   mono / upper / center / italic: style flags
 */
export function AppText({ size = 'md', tone = 'default', weight, mono, upper, center, italic, style, children, ...rest }) {
    const fs = typeof size === 'number' ? size : (fontSize[size] || fontSize.md);
    return (
        <Text
            {...rest}
            style={[
                { color: TONE_COLORS[tone] || tone || colors.text, fontSize: fs, lineHeight: Math.round(fs * 1.42) },
                weight ? { fontWeight: weight } : null,
                mono ? { fontFamily: fonts.mono } : null,
                upper ? { textTransform: 'uppercase', letterSpacing: 0.6 } : null,
                center ? { textAlign: 'center' } : null,
                italic ? { fontStyle: 'italic' } : null,
                style
            ]}
        >
            {children}
        </Text>
    );
}

/** Display heading in the brand typeface (Montserrat heavy). level: 1 | 2 | 3 | 4 */
export function Heading({ level = 2, tone = 'default', center, upper, style, children, ...rest }) {
    const map = {
        1: { fontSize: fontSize.xxxl, fontFamily: fonts.display, lineHeight: 36 },
        2: { fontSize: fontSize.xl, fontFamily: fonts.displayBold, lineHeight: 26 },
        3: { fontSize: fontSize.lg, fontFamily: fonts.displayBold, lineHeight: 23 },
        4: { fontSize: fontSize.md, fontFamily: fonts.heading, lineHeight: 20 }
    };
    return (
        <Text
            {...rest}
            style={[map[level] || map[2], { color: TONE_COLORS[tone] || tone }, center ? { textAlign: 'center' } : null, upper ? { textTransform: 'uppercase' } : null, style]}
        >
            {children}
        </Text>
    );
}

/** Small uppercase caption used above fields and sections. */
export function Label({ tone = 'muted', style, children, ...rest }) {
    return (
        <Text {...rest} style={[styles.label, { color: TONE_COLORS[tone] || tone }, style]}>
            {children}
        </Text>
    );
}

/** Monospace value (codes, money, phone numbers). */
export function Mono({ size = 'md', tone = 'default', weight = '700', style, children, ...rest }) {
    return (
        <AppText {...rest} size={size} tone={tone} weight={weight} mono style={style}>
            {children}
        </AppText>
    );
}

const styles = StyleSheet.create({
    label: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' }
});
