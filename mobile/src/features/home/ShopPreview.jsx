import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShoppingBag } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, SectionHeader, AppText, Label, Mono, Badge, Button, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { absoluteUrl } from '@/lib/api';

const CARD_WIDTH = 176;
const IMAGE_HEIGHT = 116;

/** Home preview of the in-house shop: up to four featured, in-stock products. */
export function ShopPreview({ onSeeAll }) {
    const { shopProducts, addToCart, showNotice } = useArena();

    const featured = useMemo(
        () => shopProducts.filter(p => p.visible !== false && (Number(p.stock) || 0) > 0 && (p.featured || p.inStock)).slice(0, 4),
        [shopProducts]
    );

    const reserve = (product) => {
        addToCart(product, product.sizes?.[0]);
        showNotice('success', `${product.name} added to your shop bag.`);
    };

    return (
        <View>
            <SectionHeader eyebrow="In-House Sports Shop" title="Featured Turf Gear & Merchandise" action="Visit shop" onAction={onSeeAll} />

            {featured.length === 0 ? (
                <Card>
                    <View style={{ alignItems: 'center', gap: spacing.sm }}>
                        <ShoppingBag size={24} color={colors.textDim} />
                        <AppText size="sm" tone="muted" center>Match balls, anti-slip socks, and hydration drinks available at the arena counter.</AppText>
                        <Button title="Explore Shop Gear" variant="outline" size="sm" onPress={onSeeAll} />
                    </View>
                </Card>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                    {featured.map((product) => {
                        const uri = absoluteUrl(product.image);
                        return (
                            <View key={product.id} style={styles.card}>
                                <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel={`Open the shop: ${product.name}`}>
                                    {uri ? (
                                        <Image source={{ uri }} style={styles.image} contentFit="cover" transition={150} />
                                    ) : (
                                        <View style={[styles.image, styles.imageFallback]}>
                                            <ShoppingBag size={26} color={colors.textDim} />
                                        </View>
                                    )}
                                    <View style={styles.body}>
                                        {product.badge ? <Badge tone="brand" label={String(product.badge)} /> : null}
                                        <AppText size="sm" weight="800" numberOfLines={2}>{String(product.name || '')}</AppText>
                                        {product.description ? <AppText size="xs" tone="muted" numberOfLines={2}>{String(product.description)}</AppText> : null}
                                    </View>
                                </Pressable>
                                <Row justify="space-between" style={styles.footer}>
                                    <View style={{ flex: 1 }}>
                                        <Label>Counter Price</Label>
                                        <Mono size="md" tone="brand" weight="900">{formatMoney(product.salePrice || product.price)}</Mono>
                                    </View>
                                    <Button title="Reserve" size="sm" onPress={() => reserve(product)} />
                                </Row>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { width: CARD_WIDTH, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' },
    image: { width: CARD_WIDTH, height: IMAGE_HEIGHT, backgroundColor: colors.cardAlt },
    imageFallback: { alignItems: 'center', justifyContent: 'center' },
    body: { gap: 4, padding: spacing.md, minHeight: 86 },
    footer: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }
});
