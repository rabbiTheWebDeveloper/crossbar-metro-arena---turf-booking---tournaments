import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Trash2, AlertTriangle } from 'lucide-react-native';
import { AppText, Mono, Row, Stepper, IconButton } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { colors, radius, spacing, tones } from '@/theme';
import { ProductImage } from './ProductCard';
import { maxQty, unitPriceOf } from './shopUtils';

/**
 * One line of the shop bag.
 *   item: { product, selectedSize, quantity } from the cart
 *   live: the current catalogue entry for the product (undefined when it was removed / hidden)
 *   problem: '' or the reason this line cannot be reserved ("Only 2 left", "No longer available")
 *   onQuantity(quantity) / onRemove()
 */
export function CartLineItem({ item, live, problem, onQuantity, onRemove, disabled }) {
    const product = live || item.product;
    const price = unitPriceOf(product);
    const gone = !live || live.visible === false;
    return (
        <View style={[styles.line, problem ? { borderColor: tones.danger.border, backgroundColor: colors.dangerSoft } : null]}>
            <ProductImage uri={product.image} style={styles.thumb} iconSize={20} />
            <View style={{ flex: 1, gap: 3 }}>
                <AppText size="sm" weight="800" numberOfLines={2}>{item.product.name}</AppText>
                <Row gap={spacing.sm} wrap>
                    {item.selectedSize ? <AppText size="xs" tone="brand" weight="700">{`Size: ${item.selectedSize}`}</AppText> : null}
                    <AppText size="xs" tone="muted">{`${formatMoney(price)} each`}</AppText>
                </Row>
                {problem ? (
                    <Row gap={4}>
                        <AlertTriangle size={12} color={tones.danger.fg} />
                        <AppText size="xs" tone="danger" weight="700" style={{ flex: 1 }}>{problem}</AppText>
                    </Row>
                ) : null}
                <Row justify="space-between" style={{ marginTop: 4 }}>
                    {gone ? (
                        <AppText size="xs" tone="muted">{`Qty: ${item.quantity}`}</AppText>
                    ) : (
                        <Stepper value={item.quantity} onChange={disabled ? () => { } : onQuantity} min={1} max={maxQty(live)} />
                    )}
                    <Mono size="md" tone="brand" weight="900">{formatMoney(price * item.quantity)}</Mono>
                </Row>
            </View>
            <IconButton icon={Trash2} onPress={onRemove} disabled={disabled} size={34} iconSize={16} tone={tones.danger.fg} bg="transparent" border="transparent" accessibilityLabel={`Remove ${item.product.name}`} />
        </View>
    );
}

const styles = StyleSheet.create({
    line: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    thumb: { width: 58, height: 58, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }
});
