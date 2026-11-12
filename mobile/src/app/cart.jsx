import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useOpenTab } from '@/lib/navigation';
import { ShoppingBag, Store, ArrowRight, Check } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, AppText, Mono, Button, Input, DateField, Notice, EmptyState, Row, Card } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { todayDhakaIso, isIsoDate } from '@/lib/dateUtils';
import { colors, spacing } from '@/theme';
import { CartLineItem } from '@/features/shop/CartLineItem';
import { ReservationSuccess } from '@/features/shop/ReservationSuccess';
import { usePickupCustomer } from '@/features/shop/usePickupCustomer';
import { unitPriceOf, validatePickupCustomer } from '@/features/shop/shopUtils';

const NOTES_MAX = 300;

/** Shop bag + counter-pickup checkout (the website's cart drawer). Payment happens at the arena desk. */
export default function CartScreen() {
    const router = useRouter();
    const openTab = useOpenTab();
    const { cartItems, removeFromCart, updateCartQuantity, clearCart, handleSaveShopReservation, shopProducts, showNotice } = useArena();
    const { customerName, setCustomerName, customerPhone, setCustomerPhone } = usePickupCustomer();
    const [pickupDate, setPickupDate] = useState(todayDhakaIso());
    const [notes, setNotes] = useState('');
    const [reservationConfirmed, setReservationConfirmed] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = todayDhakaIso();

    // Live product data (stock / visibility may have changed since the item was bagged)
    const liveProduct = (id) => shopProducts.find(p => p.id === id);
    const lineProblems = cartItems.map(item => {
        const live = liveProduct(item.product.id);
        if (!live || live.visible === false) return 'No longer available';
        if ((Number(live.stock) || 0) < item.quantity) return `Only ${Number(live.stock) || 0} left`;
        return '';
    });
    const hasProblems = lineProblems.some(Boolean);
    const totalAmount = cartItems.reduce((sum, item) => sum + unitPriceOf(liveProduct(item.product.id) || item.product) * item.quantity, 0);

    const goToShop = () => openTab('/shop');
    const leave = () => {
        if (router.canGoBack()) router.back();
        else openTab('/shop');
    };

    const handleReserveAll = async () => {
        if (isSubmitting || cartItems.length === 0) return;
        const { name, phone, error: invalid } = validatePickupCustomer(customerName, customerPhone);
        if (invalid) { setError(invalid); return; }
        if (!isIsoDate(pickupDate) || pickupDate < today) { setError('Choose a pickup date from today onwards.'); return; }
        if (hasProblems) { setError('Some items in your bag are unavailable in that quantity. Remove them and try again.'); return; }
        setError('');
        setIsSubmitting(true);
        const r = await handleSaveShopReservation({
            customerName: name,
            customerPhone: phone,
            items: cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, size: item.selectedSize || '' })),
            pickupDate,
            notes: notes.trim().slice(0, NOTES_MAX)
        });
        setIsSubmitting(false);
        if (!r.ok) {
            setError(r.error || 'Could not reserve your items. Please try again.');
            return;
        }
        setReservationConfirmed(r.reservation);
        clearCart();
        showNotice('success', `Reserved for pickup · code ${r.reservation.reservationCode}`);
    };

    const showCheckout = !reservationConfirmed && cartItems.length > 0;
    const itemCountLabel = `${cartItems.length} ${cartItems.length === 1 ? 'Item' : 'Items'}`;

    return (
        <Screen
            back
            onBack={() => { if (!isSubmitting) leave(); }}
            title="Arena Shop Bag"
            subtitle={reservationConfirmed ? 'Reserved for counter pickup' : itemCountLabel}
            footer={showCheckout ? (
                <>
                    {error ? <Notice type="error" message={error} /> : null}
                    <Row justify="space-between">
                        <AppText size="sm" weight="800">Total due at counter</AppText>
                        <Mono size="lg" tone="brand" weight="900">{formatMoney(totalAmount)}</Mono>
                    </Row>
                    <Button
                        title={isSubmitting ? 'Reserving…' : 'Reserve for Pickup'}
                        iconRight={ArrowRight}
                        size="lg"
                        block
                        loading={isSubmitting}
                        disabled={hasProblems}
                        onPress={handleReserveAll}
                    />
                </>
            ) : null}
        >
            {reservationConfirmed ? (
                <ReservationSuccess
                    reservation={reservationConfirmed}
                    title="Gear reserved for counter pickup"
                    message="Show this pickup code at Crossbar reception. Pay cash, bKash or card at the desk."
                    showTotal
                    showPickupDate
                >
                    <Button title="Done" icon={Check} block onPress={leave} />
                </ReservationSuccess>
            ) : cartItems.length === 0 ? (
                <EmptyState
                    icon={ShoppingBag}
                    title="Your bag is empty"
                    message="Browse grip socks, match balls, and jerseys in the Arena Shop."
                    action={<Button title="Browse the Arena Shop" icon={Store} onPress={goToShop} style={{ marginTop: spacing.sm }} />}
                />
            ) : (
                <>
                    <View style={{ gap: spacing.md }}>
                        {cartItems.map((item, idx) => (
                            <CartLineItem
                                key={`${item.product.id}-${item.selectedSize || idx}`}
                                item={item}
                                live={liveProduct(item.product.id)}
                                problem={lineProblems[idx]}
                                disabled={isSubmitting}
                                onQuantity={(qty) => updateCartQuantity(item.product.id, item.selectedSize, qty)}
                                onRemove={() => removeFromCart(item.product.id, item.selectedSize)}
                            />
                        ))}
                    </View>

                    {hasProblems ? (
                        <Notice type="warning" message="Some items in your bag are unavailable in that quantity. Remove them and try again." />
                    ) : null}

                    <Card style={{ gap: spacing.md }}>
                        <Row gap={6}>
                            <Store size={16} color={colors.brand} />
                            <AppText size="xs" tone="brand" weight="800" upper style={{ flex: 1 }}>Reserve for desk pickup (pay at the arena)</AppText>
                        </Row>
                        <Input label="Your Name" required placeholder="e.g. Siam Chowdhury" value={customerName} onChangeText={setCustomerName} autoCapitalize="words" maxLength={80} editable={!isSubmitting} />
                        <Input label="Mobile Number" required type="phone" placeholder="01XXXXXXXXX" value={customerPhone} onChangeText={setCustomerPhone} maxLength={14} editable={!isSubmitting} />
                        <DateField label="Pickup Date" required value={pickupDate} onChange={setPickupDate} minDate={today} hint="The day you will collect the gear at reception." />
                        <Input
                            label="Notes (optional)"
                            multiline
                            placeholder="Anything the desk should know"
                            value={notes}
                            onChangeText={setNotes}
                            maxLength={NOTES_MAX}
                            editable={!isSubmitting}
                            hint={`${notes.length}/${NOTES_MAX}`}
                        />
                    </Card>
                </>
            )}
        </Screen>
    );
}
