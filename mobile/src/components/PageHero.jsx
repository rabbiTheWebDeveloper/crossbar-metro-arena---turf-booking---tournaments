import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Heading } from '@/components/ui';
import { colors, radius, spacing, tones, fonts } from '@/theme';

const ACCENTS = {
    emerald: { tone: tones.brand, wash: ['rgba(76,191,2,0.18)', 'rgba(12,19,26,0.96)'] },
    amber: { tone: tones.warning, wash: ['rgba(251,191,36,0.16)', 'rgba(12,19,26,0.96)'] }
};

/**
 * Page header block: the app's version of the website's <PageHero>.
 *   eyebrow / eyebrowIcon: small pill above the title
 *   title + highlight: the highlight part is drawn in the accent colour
 *   description: one short paragraph
 *   stats: [{ label, value, icon }] shown as a two-column grid
 *   actions: node rendered under the description (buttons)
 *   accent: 'emerald' | 'amber'
 */
export function PageHero({ eyebrow, eyebrowIcon: EyebrowIcon, title, highlight, description, accent = 'emerald', stats, actions, style }) {
    const a = ACCENTS[accent] || ACCENTS.emerald;
    const list = Array.isArray(stats) ? stats : [];
    return (
        <LinearGradient colors={a.wash} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: a.tone.border }, style]}>
            {eyebrow ? (
                <View style={[styles.pill, { backgroundColor: a.tone.bg, borderColor: a.tone.border }]}>
                    {EyebrowIcon ? <EyebrowIcon size={12} color={a.tone.fg} strokeWidth={2.4} /> : null}
                    <AppText size="xxs" weight="900" upper numberOfLines={1} style={{ color: a.tone.fg, flexShrink: 1 }}>{eyebrow}</AppText>
                </View>
            ) : null}

            <Heading level={1} upper style={styles.title}>
                {title}
                {highlight ? <Heading level={1} upper style={[styles.title, { color: a.tone.fg }]}>{` ${highlight}`}</Heading> : null}
            </Heading>

            {description ? <AppText size="sm" tone="muted">{description}</AppText> : null}

            {actions ? <View style={styles.actions}>{actions}</View> : null}

            {list.length > 0 ? (
                <View style={styles.stats}>
                    {list.map((s) => {
                        const Icon = s.icon;
                        return (
                            <View key={s.label} style={styles.stat}>
                                {Icon ? (
                                    <View style={[styles.statIcon, { backgroundColor: a.tone.bg, borderColor: a.tone.border }]}>
                                        <Icon size={14} color={a.tone.fg} strokeWidth={2.2} />
                                    </View>
                                ) : null}
                                <View style={{ flex: 1 }}>
                                    <AppText size="xxs" tone="muted" upper numberOfLines={1} style={{ fontFamily: fonts.mono }}>{s.label}</AppText>
                                    <AppText size="sm" weight="900" numberOfLines={2}>{String(s.value)}</AppText>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : null}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    hero: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md, overflow: 'hidden' },
    pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, maxWidth: '100%' },
    title: { fontSize: 25, lineHeight: 30 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    stat: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm + 2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    statIcon: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }
});
