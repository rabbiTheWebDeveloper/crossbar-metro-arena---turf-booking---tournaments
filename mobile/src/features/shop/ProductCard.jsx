import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShoppingBag, MessageSquare } from 'lucide-react-native';
import { AppText, Badge, Button, Mono } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { colors, radius, spacing, fonts } from '@/theme';
import { canReserve, priceInfo, stockOf } from './shopUtils';

/**
 * Product photo with a bag icon behind it (visible while loading or when the photo is missing).
 *   uri: product.image      style: size of the box (width/height or aspectRatio)
 */
export function ProductImage({ uri, style, iconSize = 26 }) {
    const src = absoluteUrl(uri);
    return (
        <View style={[styles.imageBox, style]}>
            <ShoppingBag size={iconSize} color={colors.textDim} strokeWidth={1.6} />
            {src ? <Image source={{ uri: src }} style={styles.imageFill} contentFit="cover" transition={150} /> : null}
        </View>
    );
}

/**
 * One tile of the 2-column shop grid.
 *   onOpen(product): opens the detail / reserve sheet (only when the item is in stock)
 *   onAsk(product): "Ask on WhatsApp"; omit to hide the button
 */
export function ProductCard({ product, onOpen, onAsk }) {
    const { price, hasSale, unit } = priceInfo(product);
    const inStock = canReserve(product);
    const open = () => { if (inStock) onOpen(product); };

    return (
        <Pressable
            onPress={open}
            disabled={!inStock}
            accessibilityRole="button"
            accessibilityLabel={`${product.name}, ${inStock ? `${stockOf(product)} in stock` : 'out of stock'}`}
            style={({ pressed }) => [styles.card, pressed ? { borderColor: colors.borderBrand, opacity: 0.9 } : null]}
        >
            <View>
                <ProductImage uri={product.image} style={styles.image} />
                <View style={styles.stockBadge}>
                    <Badge tone={inStock ? 'success' : 'danger'} label={inStock ? `${stockOf(product)} in stock` : 'Out of stock'} style={styles.badgeSolid} />
                </View>
                {onAsk ? (
                    <Pressable onPress={() => onAsk(product)} hitSlop={8} style={styles.askBtn} accessibilityRole="button" accessibilityLabel="Ask on WhatsApp">
                        <MessageSquare size={15} color={colors.brand} strokeWidth={2.2} />
                    </Pressable>
                ) : null}
            </View>

            <View style={styles.body}>
                <AppText size="xxs" weight="800" tone="muted" upper numberOfLines={1}>{String(product.category || 'gear')}</AppText>
                <AppText size="sm" weight="800" style={{ fontFamily: fonts.heading }} numberOfLines={2}>{product.name}</AppText>
                {product.description ? <AppText size="xs" tone="muted" numberOfLines={2}>{product.description}</AppText> : null}

                <View style={styles.priceRow}>
                    <Mono size="lg" tone="brand" weight="900">{formatMoney(unit)}</Mono>
                    {hasSale ? <Mono size="xs" tone="dim" weight="600" style={{ textDecorationLine: 'line-through' }}>{formatMoney(price)}</Mono> : null}
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    title={inStock ? 'Select & Reserve' : 'Out of stock'}
                    size="sm"
                    block
                    disabled={!inStock}
                    onPress={open}
                    style={{ paddingHorizontal: 6 }}
                    textStyle={{ letterSpacing: 0 }}
                />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    imageBox: { backgroundColor: colors.glassStrong, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    imageFill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
    image: { width: '100%', aspectRatio: 1.15 },
    stockBadge: { position: 'absolute', left: 8, top: 8 },
    badgeSolid: { backgroundColor: 'rgba(7,11,14,0.82)' },
    askBtn: { position: 'absolute', right: 8, top: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(7,11,14,0.82)', borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' },
    body: { flex: 1, padding: spacing.md, paddingBottom: spacing.sm, gap: 3 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    footer: { paddingHorizontal: spacing.md, paddingBottom: spacing.md }
});
