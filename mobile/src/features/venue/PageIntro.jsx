import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GradientCard, Heading, AppText, Badge, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

/**
 * Page introduction block (the app's version of the website's PageHero).
 *   eyebrow / eyebrowIcon: small pill above the title
 *   title + highlight: headline; `highlight` is rendered in the brand colour
 *   description: lead paragraph
 *   stats: [{ label, value, icon }] shown in a two-column grid
 *   children: action buttons
 */
export function PageIntro({ eyebrow, eyebrowIcon, title, highlight, description, stats, children }) {
    return (
        <GradientCard>
            <View style={{ gap: spacing.md }}>
                {eyebrow ? <Badge tone="brand" icon={eyebrowIcon} label={eyebrow} /> : null}
                <Heading level={1} upper>
                    {title}
                    {highlight ? <Heading level={1} tone="brand" upper>{` ${highlight}`}</Heading> : null}
                </Heading>
                {description ? <AppText size="sm" tone="soft">{description}</AppText> : null}
                {children ? <Row wrap gap={spacing.sm}>{children}</Row> : null}
                {Array.isArray(stats) && stats.length > 0 ? (
                    <View style={styles.grid}>
                        {stats.map((s) => {
                            const Icon = s.icon;
                            return (
                                <View key={s.label} style={styles.stat}>
                                    {Icon ? (
                                        <View style={styles.statIcon}>
                                            <Icon size={15} color={colors.brand} strokeWidth={2.2} />
                                        </View>
                                    ) : null}
                                    <View style={{ flex: 1 }}>
                                        <AppText size="sm" weight="800" numberOfLines={2}>{String(s.value)}</AppText>
                                        <AppText size="xxs" tone="muted" upper numberOfLines={1}>{s.label}</AppText>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : null}
            </View>
        </GradientCard>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    stat: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    statIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' }
});
