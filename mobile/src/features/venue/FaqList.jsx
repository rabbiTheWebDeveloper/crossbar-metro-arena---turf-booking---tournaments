import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { Card, Heading, AppText, Label, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

/**
 * FAQ accordion (port of the website's ArenaFaq). The first answer starts open and several
 * answers can be open at once, like the native <details> elements on the web.
 *   items: [{ q, a }]     ctaLabel + onCta: optional action button under the heading
 */
export function FaqList({ items = [], eyebrow = 'Good to know', title = 'Frequently asked questions', intro, ctaLabel, onCta }) {
    const [open, setOpen] = useState({ 0: true });
    if (!items.length) return null;
    const toggle = (i) => setOpen(prev => ({ ...prev, [i]: !prev[i] }));

    return (
        <Card>
            <View style={{ gap: spacing.xs }}>
                <Label tone="brand">{eyebrow}</Label>
                <Heading level={2} upper>{title}</Heading>
                {intro ? <AppText size="sm" tone="muted">{intro}</AppText> : null}
            </View>
            {ctaLabel && onCta ? <Button title={ctaLabel} size="sm" onPress={onCta} style={{ alignSelf: 'flex-start', marginTop: spacing.md }} /> : null}
            <View style={{ marginTop: spacing.md }}>
                {items.map((item, i) => {
                    const isOpen = !!open[i];
                    const Icon = isOpen ? Minus : Plus;
                    return (
                        <View key={item.q} style={[styles.item, i === 0 ? { borderTopWidth: 0 } : null]}>
                            <Pressable onPress={() => toggle(i)} style={styles.question} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
                                <AppText size="md" weight="800" tone={isOpen ? 'brand' : 'default'} style={{ flex: 1 }}>{item.q}</AppText>
                                <View style={styles.toggle}>
                                    <Icon size={14} color={colors.brand} strokeWidth={2.6} />
                                </View>
                            </Pressable>
                            {isOpen ? <AppText size="sm" tone="soft" style={{ marginTop: spacing.sm }}>{item.a}</AppText> : null}
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    item: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    question: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    toggle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }
});
