import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Package } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Select, ToggleRow, Button, Notice, Row } from '@/components/ui';
import { ImageUrlField } from '../content/ImageUrlField';
import { CATEGORIES, emptyProductForm, productToForm, buildProductPayload } from './helpers';

/**
 * Add / edit a shop product.
 *   product: the product being edited, or null to add a new one
 */
export function ProductFormSheet({ visible, onClose, product }) {
    const { handleSaveShopProduct } = useArena();
    const [form, setForm] = useState(emptyProductForm());
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const editing = product || null;

    // Load the form each time the sheet opens
    useEffect(() => {
        if (!visible) return;
        setForm(product ? productToForm(product) : emptyProductForm());
        setError('');
        setSubmitting(false);
    }, [visible, product]);

    const close = () => { if (!submitting) onClose(); };

    const submit = async () => {
        if (submitting) return;
        setError('');
        const built = buildProductPayload(form, editing);
        if (built.error) { setError(built.error); return; }
        if (built.unchanged) { onClose(); return; }
        setSubmitting(true);
        const res = await handleSaveShopProduct(built.payload);
        setSubmitting(false);
        if (res?.ok && res.product) onClose();
        else setError(res?.error || 'Could not save the product.');
    };

    return (
        <Sheet
            visible={visible}
            onClose={close}
            dismissable={!submitting}
            title={editing ? 'Edit Product' : 'Add New Inventory Item'}
            icon={Package}
            footer={(
                <>
                    {error ? <Notice type="error" message={error} /> : null}
                    <Row>
                        <Button title="Cancel" variant="secondary" disabled={submitting} onPress={close} style={{ flex: 1 }} />
                        <Button title={submitting ? 'Saving…' : 'Save Product'} loading={submitting} onPress={submit} style={{ flex: 1.4 }} />
                    </Row>
                </>
            )}
        >
            <Input label="Product Name" required placeholder="e.g. Nike Phantom Grip Socks" value={form.name} onChangeText={v => set('name', v)} autoCapitalize="words" />
            <Select label="Category" value={form.category} onChange={v => set('category', v)} options={CATEGORIES} />

            <Row align="flex-start">
                <View style={{ flex: 1 }}>
                    <Input label="Price (৳)" required type="number" value={form.price} onChangeText={v => set('price', v)} />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="Sale Price (৳)" type="number" value={form.salePrice} onChangeText={v => set('salePrice', v)} placeholder="Optional" hint="Leave blank = no sale" />
                </View>
            </Row>
            <Input label="Stock Quantity" type="number" value={form.stock} onChangeText={v => set('stock', v)} />

            <Input label="Sizes" hint="Comma separated" value={form.sizes} onChangeText={v => set('sizes', v)} placeholder="e.g. S, M, L, XL" autoCapitalize="none" />
            <Input label="Badge Tag" value={form.badge} onChangeText={v => set('badge', v)} placeholder="e.g. Best Seller" />
            <Input label="Description" multiline value={form.description} onChangeText={v => set('description', v)} placeholder="Short description shown in the shop" inputStyle={{ minHeight: 60 }} />

            <ImageUrlField
                label="Image URL"
                value={form.image}
                onChangeText={v => set('image', v)}
                placeholder="https://... (ImageKit / Cloudinary / Unsplash)"
                hint={!editing && !form.image.trim() ? 'Leave blank to use the default placeholder image.' : undefined}
            />

            <ToggleRow label="Featured" value={form.featured} onValueChange={v => set('featured', v)} />
            <ToggleRow label="Visible in shop" value={form.visible} onValueChange={v => set('visible', v)} />
        </Sheet>
    );
}
