import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Check, ShoppingBag } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, AppText, Label, Mono, Button, Chip, Stepper, Input, Notice, Row, Divider } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { todayDhakaIso } from '@/lib/dateUtils';
import { colors, radius, spacing } from '@/theme';
import { canReserve, maxQty, stockOf, unitPriceOf, validatePickupCustomer } from './shopUtils';
import { usePickupCustomer } from './usePickupCustomer';
import { ProductImage } from './ProductCard';
import { ReservationSuccess } from './ReservationSuccess';

/**
 * Product detail + reserve sheet (the website's product modal).
 * Pick a size and quantity, then either add the item to the bag or reserve it straight away
 * for counter pickup.
 *   product: the product to show (null closes the sheet)
 *   onAdded(product, quantity): called after "Add to Bag"
 */
export function ProductSheet({ product, onClose, onAdded }) {
    const { shopProducts, handleSaveShopReservation, addToCart, showNotice } = useArena();
    const { customerName, setCustomerName, customerPhone, setCustomerPhone } = usePickupCustomer();

    // Keep rendering the last product while the sheet slides away
    const [shown, setShown] = useState(product);
    if (product && product !== shown) setShown(product);

    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [confirmedReservation, setConfirmedReservation] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset the form each time a product is opened (during render, so stale state never flashes)
    const [openId, setOpenId] = useState(null);
    const productId = product ? product.id : null;
    if (productId !== openId) {
        setOpenId(productId);
        if (product) {
            setSelectedSize(product.sizes?.[0] || '');
            setQuantity(1);
            setConfirmedReservation(null);
            setError('');
        }
    }

    // Live stock / price (the catalogue may have refreshed since the sheet was opened)
    const snapshot = product || shown;
    const item = snapshot ? (shopProducts.find(p => p.id === snapshot.id) || snapshot) : null;
    const sizes = Array.isArray(item?.sizes) ? item.sizes : [];
    const specs = Array.isArray(item?.specs) ? item.specs.filter(Boolean) : [];
    const available = canReserve(item);
    const limit = maxQty(item);
    const qty = Math.min(quantity, limit);
    const unitPrice = unitPriceOf(item);

    const close = () => {
        if (isSubmitting) return;
        setError('');
        onClose();
    };

    const handleReserveDirect = async () => {
        if (isSubmitting || !item) return;
        if (!available) { setError('This item is out of stock right now.'); return; }
        const { name, phone, error: invalid } = validatePickupCustomer(customerName, customerPhone);
        if (invalid) { setError(invalid); return; }
        setError('');
        setIsSubmitting(true);
        const r = await handleSaveShopReservation({
            customerName: name,
            customerPhone: phone,
            items: [{ productId: item.id, quantity: qty, size: selectedSize || '' }],
            pickupDate: todayDhakaIso()
        });
        setIsSubmitting(false);
        if (!r.ok) {
            setError(r.error || 'Could not reserve this item. Please try again.');
            return;
        }
        setConfirmedReservation(r.reservation);
        showNotice('success', `Reserved for pickup · code ${r.reservation.reservationCode}`);
    };

    const handleAddToBag = () => {
        if (!item || !available) return;
        addToCart(item, selectedSize, qty);
        if (onAdded) onAdded(item, qty);
        onClose();
    };

    const footer = confirmedReservation ? (
        <Button title="Done" icon={Check} block onPress={close} />
    ) : (
        <Row>
            <Button title="Add to Bag" variant="secondary" icon={ShoppingBag} onPress={handleAddToBag} disabled={isSubmitting || !available} style={{ flex: 1 }} />
            <Button title={isSubmitting ? 'Reserving…' : 'Reserve for Pickup'} loading={isSubmitting} onPress={handleReserveDirect} disabled={!available} style={{ flex: 1.2 }} />
        </Row>
    );

    return (
        <Sheet
            visible={!!product}
            onClose={close}
            dismissable={!isSubmitting}
            title={item?.name || 'Product'}
            subtitle={item ? `${String(item.category || 'gear').toUpperCase()} · Stock: ${stockOf(item)} units` : undefined}
            icon={ShoppingBag}
            footer={item ? footer : null}
        >
            {item ? (
                <>
                    <Row gap={spacing.md} align="center">
                        <ProductImage uri={item.image} style={styles.thumb} iconSize={22} />
                        <View style={{ flex: 1, gap: 2 }}>
                            <Mono size="xl" tone="brand" weight="900">{formatMoney(unitPrice * qty)}</Mono>
                            <AppText size="xs" tone="muted">{qty > 1 ? `${qty} × ${formatMoney(unitPrice)}` : 'Pay at the arena counter'}</AppText>
                        </View>
                    </Row>

                    {confirmedReservation ? (
                        <ReservationSuccess
                            reservation={confirmedReservation}
                            title="Reserved for counter pickup"
                            message="Show your reservation code at Crossbar reception. Pay cash, bKash or card at the desk."
                        />
                    ) : (
                        <>
                            {item.description ? <AppText size="sm" tone="soft">{item.description}</AppText> : null}

                            {specs.length > 0 ? (
                                <View style={styles.specs}>
                                    {specs.map((s, idx) => (
                                        <Row key={`${idx}-${s}`} gap={6} align="flex-start">
                                            <Check size={13} color={colors.brand} strokeWidth={3} style={{ marginTop: 3 }} />
                                            <AppText size="sm" tone="soft" style={{ flex: 1 }}>{String(s)}</AppText>
                                        </Row>
                                    ))}
                                </View>
                            ) : null}

                            {error ? <Notice type="error" message={error} /> : null}

                            {sizes.length > 0 ? (
                                <View style={{ gap: 6 }}>
                                    <Label tone="soft">Select Size</Label>
                                    <Row wrap>
                                        {sizes.map(sz => (
                                            <Chip key={String(sz)} label={String(sz)} selected={selectedSize === sz} onPress={() => setSelectedSize(sz)} />
                                        ))}
                                    </Row>
                                </View>
                            ) : null}

                            <View style={{ gap: 6 }}>
                                <Label tone="soft">{`Quantity (max ${limit})`}</Label>
                                <Stepper value={qty} onChange={setQuantity} min={1} max={limit} />
                            </View>

                            <Divider style={{ marginVertical: 0 }} />

                            <Label tone="brand">Pickup Reservation Details</Label>
                            <Input label="Your Name" required placeholder="e.g. Siam Chowdhury" value={customerName} onChangeText={setCustomerName} autoCapitalize="words" maxLength={80} editable={!isSubmitting} />
                            <Input label="Mobile Number" required type="phone" placeholder="01XXXXXXXXX" value={customerPhone} onChangeText={setCustomerPhone} maxLength={14} editable={!isSubmitting} />
                        </>
                    )}
                </>
            ) : null}
        </Sheet>
    );
}

const styles = StyleSheet.create({
    thumb: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    specs: { gap: 4, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
