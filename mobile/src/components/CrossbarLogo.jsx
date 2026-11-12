import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Polygon, Line, Ellipse, Circle, G } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { AppText } from './ui/Typography';

const SIZES = { sm: 32, responsive: 40, md: 44, lg: 60, xl: 88 };

/** The goal + ball + turf emblem. */
export function LogoMark({ size = 40 }) {
    return (
        <Svg width={size} height={size * 0.88} viewBox="0 0 200 170" fill="none" accessibilityLabel="Crossbar Metro Arena emblem">
            <Defs>
                <LinearGradient id="grassLight" x1="100" y1="80" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#95e05a" />
                    <Stop offset="1" stopColor="#398f02" />
                </LinearGradient>
                <LinearGradient id="grassDark" x1="100" y1="80" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#4cbf02" />
                    <Stop offset="1" stopColor="#2d7102" />
                </LinearGradient>
            </Defs>
            <Path d="M 46 95 L 46 28 L 154 28 L 154 95" stroke="#0F172A" strokeWidth="9" strokeLinecap="square" strokeLinejoin="miter" />
            <Path d="M 46 95 L 46 28 L 154 28 L 154 95" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
            <Polygon points="18,145 52,88 72,88 48,145" fill="url(#grassDark)" />
            <Polygon points="48,145 72,88 88,88 78,145" fill="url(#grassLight)" />
            <Polygon points="78,145 88,88 100,88 98,145" fill="url(#grassDark)" />
            <Polygon points="98,145 100,88 112,88 122,145" fill="url(#grassLight)" />
            <Polygon points="122,145 112,88 128,88 152,145" fill="url(#grassDark)" />
            <Polygon points="152,145 128,88 148,88 182,145" fill="url(#grassLight)" />
            <Polygon points="18,145 52,88 148,88 182,145" fill="none" stroke="#4cbf02" strokeWidth="1.5" />
            <Line x1="100" y1="88" x2="100" y2="145" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.95" />
            <Ellipse cx="100" cy="94" rx="22" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.9" />
            <Polygon points="94,44 95,84 92,84" fill="#4cbf02" />
            <Polygon points="99,44 101,96 99,96" fill="#95e05a" />
            <Polygon points="106,44 107,84 104,84" fill="#4cbf02" />
            <G>
                <Circle cx="100" cy="27" r="16" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
                <Polygon points="100,21 106,25 104,31 96,31 94,25" fill="#0F172A" />
                <Line x1="100" y1="21" x2="100" y2="13" stroke="#0F172A" strokeWidth="2" />
                <Line x1="106" y1="25" x2="114" y2="22" stroke="#0F172A" strokeWidth="2" />
                <Line x1="104" y1="31" x2="111" y2="38" stroke="#0F172A" strokeWidth="2" />
                <Line x1="96" y1="31" x2="89" y2="38" stroke="#0F172A" strokeWidth="2" />
                <Line x1="94" y1="25" x2="86" y2="22" stroke="#0F172A" strokeWidth="2" />
            </G>
        </Svg>
    );
}

/**
 * Brand lockup: emblem + CROSSBAR / METRO / ARENA wordmark.
 *   size: sm | responsive | md | lg | xl      variant: 'full' | 'mark'
 */
export function CrossbarLogo({ size = 'responsive', variant = 'full', showSubtitle = true, style }) {
    const mark = SIZES[size] || SIZES.responsive;
    if (variant === 'mark') return <View style={style}><LogoMark size={mark} /></View>;
    const scale = mark / 40;
    const word = { fontFamily: fonts.displayBold, fontSize: 17 * scale, lineHeight: 21 * scale, letterSpacing: 1 };
    return (
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
            <LogoMark size={mark} />
            <View>
                <View style={{ flexDirection: 'row' }}>
                    <AppText style={[word, { color: colors.white }]}>CROSS</AppText>
                    <AppText style={[word, { color: colors.brand }]}>BAR</AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ height: 2, width: 10 * scale, backgroundColor: colors.brand }} />
                    <AppText style={{ fontSize: 10 * scale, lineHeight: 13 * scale, fontWeight: '900', letterSpacing: 2.5, color: colors.brand }}>METRO</AppText>
                    <View style={{ height: 2, width: 10 * scale, backgroundColor: colors.brand }} />
                </View>
                {showSubtitle ? (
                    <AppText style={{ fontSize: 8 * scale, lineHeight: 11 * scale, fontWeight: '700', letterSpacing: 2.6, color: colors.textSoft }}>ARENA · DHAKA</AppText>
                ) : null}
            </View>
        </View>
    );
}
