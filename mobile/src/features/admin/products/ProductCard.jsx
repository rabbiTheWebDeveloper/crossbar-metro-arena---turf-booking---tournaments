import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Eye, EyeOff, Trash2, Star } from 'lucide-react-native';
import { Card, Row, AppText, Mono, Badge, Button, IconButton } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { FALLBACK_IMAGE } from './helpers';

/**
 * One shop product with its inventory actions.
 *   busy: an action on this card is in flight
 */
export function ProductCard({ product: prod, busy, onEdit, onToggleFeatured, onToggleVisible, onDelete }) {
    const [failedUri, setFailedUri] = useState(null);
    const hidden = prod.visible === false;
    const stock = Number(prod.stock) || 0;
    const onSale = prod.salePrice !== null && prod.salePrice !== undefined && Number(prod.salePrice) < Number(prod.price);
    const sizes = Array.isArray(prod.sizes) ? prod.sizes : [];
    // Broken image links fall back to the default product picture
    const sourceUri = absoluteUrl(prod.image || FALLBACK_IMAGE);
    const imageUri = failedUri === sourceUri ? FALLBACK_IMAGE : sourceUri;

    return (
        <Card style={[{ gap: spacing.md }, hidden ? { opacity: 0.6 } : null]}>
            <Row align="flex-start" gap={spacing.md}>
                <View style={styles.thumb}>
                    <Image source={{ uri: imageUri }} style={styles.thumbImage} contentFit="cover" transition={150} onError={() => setFailedUri(sourceUri)} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                    <AppText size="md" weight="800" numberOfLines={1}>{prod.name}</AppText>
                    {prod.description ? <AppText size="xs" tone="dim" numberOfLines={2}>{prod.description}</AppText> : null}
                    <Row wrap gap={4}>
                        {prod.category ? <Badge tone="brand" label={String(prod.category)} /> : null}
                        {prod.featured ? <Badge tone="warning" solid label="Featured" /> : null}
                        {hidden ? <Badge tone="neutral" label="Hidden" /> : null}
                        {prod.badge ? <Badge tone="neutral" label={String(prod.badge)} /> : null}
                    </Row>
                </View>
            </Row>

            <Row justify="space-between">
                <Row gap={6} align="baseline">
                    <Mono size="lg" tone="brand">{formatMoney(onSale ? prod.salePrice : prod.price)}</Mono>
                    {onSale ? <Mono size="xs" tone="dim" style={{ textDecorationLine: 'line-through' }}>{formatMoney(prod.price)}</Mono> : null}
                </Row>
                <Badge tone={stock > 0 ? 'success' : 'danger'} label={stock > 0 ? `${stock} in stock` : 'Out of stock'} />
            </Row>
            {sizes.length > 0 ? <AppText size="xs" tone="dim" mono numberOfLines={1}>{`Sizes: ${sizes.join(' · ')}`}</AppText> : null}

            <Row gap={6} style={styles.actions}>
                <Button title="Edit" variant="secondary" size="sm" disabled={busy} onPress={onEdit} style={{ flex: 1 }} />
                <IconButton
                    icon={Star}
                    size={34}
                    iconSize={15}
                    tone={prod.featured ? colors.gold : colors.textMuted}
                    bg={prod.featured ? colors.warningSoft : colors.glassStrong}
                    border={prod.featured ? colors.gold : colors.border}
                    disabled={busy}
                    onPress={onToggleFeatured}
                    accessibilityLabel={prod.featured ? 'Remove from featured' : 'Feature on the shop front'}
                />
                <IconButton icon={hidden ? EyeOff : Eye} size={34} iconSize={15} disabled={busy} onPress={onToggleVisible} accessibilityLabel={hidden ? 'Show in shop' : 'Hide from shop'} />
                <IconButton icon={Trash2} size={34} iconSize={15} tone={colors.danger} disabled={busy} onPress={onDelete} accessibilityLabel="Delete product" />
            </Row>
        </Card>
    );
}

const styles = StyleSheet.create({
    thumb: { width: 84, height: 84, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border },
    thumbImage: { width: 84, height: 84 },
    actions: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }
});
