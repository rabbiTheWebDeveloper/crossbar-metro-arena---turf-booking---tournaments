import React, { useMemo, useState } from 'react';
import { View, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag, ShieldCheck, Tag, Store } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, IconButton, SearchInput, Segmented, EmptyState, Loading, Notice, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { PageHero } from '@/components/PageHero';
import { ProductCard } from '@/features/shop/ProductCard';
import { ProductSheet } from '@/features/shop/ProductSheet';
import { SHOP_CATEGORIES, whatsappLink } from '@/features/shop/shopUtils';

const PAGE_SIZE = 12;
const CATEGORY_OPTIONS = SHOP_CATEGORIES.map(c => ({ value: c.id, label: c.label }));
const HERO_STATS = [
    { label: 'Shop Location', value: 'Arena Reception', icon: Store },
    { label: 'Pickup Type', value: 'Counter Hold', icon: Tag },
    { label: 'Quality', value: 'FIFA Standard', icon: ShieldCheck },
    { label: 'Counter Payment', value: 'Cash / bKash / Card', icon: ShoppingBag }
];

/** Shop tab: browse match gear, reserve an item for counter pickup or add it to the bag. */
export default function ShopScreen() {
    const router = useRouter();
    const { shopProducts, cartCount, siteSettings, isLoadingData, loadError, showNotice } = useArena();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const q = searchQuery.trim().toLowerCase();
    const filteredProducts = useMemo(() => (Array.isArray(shopProducts) ? shopProducts : []).filter(p => {
        if (!p || p.visible === false) return false;
        const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
        const matchSearch = !q || String(p.name || '').toLowerCase().includes(q) || String(p.description || '').toLowerCase().includes(q);
        return matchCat && matchSearch;
    }), [shopProducts, selectedCategory, q]);

    // Two products per row (rows keep both tiles the same height)
    const rows = useMemo(() => {
        const shown = filteredProducts.slice(0, visibleCount);
        const out = [];
        for (let i = 0; i < shown.length; i += 2) out.push(shown.slice(i, i + 2));
        return out;
    }, [filteredProducts, visibleCount]);

    const hasFilters = !!searchQuery || selectedCategory !== 'all';
    const remaining = Math.max(0, filteredProducts.length - visibleCount);
    const canAsk = !!String(siteSettings?.whatsappUrl || '').split('?')[0];

    const changeCategory = (id) => { setSelectedCategory(id); setVisibleCount(PAGE_SIZE); };
    const changeSearch = (text) => { setSearchQuery(text); setVisibleCount(PAGE_SIZE); };
    const resetFilters = () => { setSelectedCategory('all'); setSearchQuery(''); setVisibleCount(PAGE_SIZE); };

    const askOnWhatsApp = (p) => {
        const url = whatsappLink(siteSettings, `Hi ${siteSettings?.businessName || 'Crossbar'} Shop, is ${p.name} available for pickup today?`);
        if (!url) return;
        Linking.openURL(url).catch(() => showNotice('error', 'Could not open WhatsApp on this device.'));
    };

    const handleAdded = (p, qty) => {
        showNotice('success', `${qty} × ${p.name} added to your bag. Tap the bag icon at the top to reserve it for pickup.`);
    };

    const isFirstLoad = isLoadingData && filteredProducts.length === 0 && !hasFilters;

    return (
        <>
            <Screen
                tab
                title="Arena Shop"
                subtitle="Reserve online · collect at reception"
                right={(
                    <IconButton
                        icon={ShoppingBag}
                        onPress={() => router.push('/cart')}
                        badge={cartCount}
                        tone={cartCount > 0 ? colors.brand : colors.textSoft}
                        accessibilityLabel={cartCount > 0 ? `Open your bag, ${cartCount} items` : 'Open your bag'}
                    />
                )}
            >
                <PageHero
                    eyebrow="Official Crossbar Match Gear"
                    eyebrowIcon={ShoppingBag}
                    title="Pro Turf Gear &"
                    highlight="Merchandise"
                    description="Grip socks, match balls, official arena kits, and cold electrolyte drinks. Reserve online and collect at reception before kickoff."
                    stats={HERO_STATS}
                />

                <View style={{ gap: spacing.md }}>
                    <SearchInput value={searchQuery} onChangeText={changeSearch} placeholder="Search gear by name..." />
                    <Segmented scroll size="sm" value={selectedCategory} onChange={changeCategory} options={CATEGORY_OPTIONS} />
                </View>

                {isFirstLoad ? (
                    <Loading label="Loading the shop…" />
                ) : filteredProducts.length === 0 ? (
                    <>
                        {loadError && !hasFilters ? <Notice type="error" message={loadError} /> : null}
                        <EmptyState
                            icon={ShoppingBag}
                            title="No products found"
                            message={hasFilters
                                ? 'No gear matches your current search or category filter. Try clearing filters.'
                                : 'No products currently listed in the shop catalog. Check back soon!'}
                            action={hasFilters ? <Button title="Reset Filters" variant="secondary" size="sm" onPress={resetFilters} style={{ marginTop: spacing.sm }} /> : null}
                        />
                    </>
                ) : (
                    <View style={{ gap: spacing.md }}>
                        {rows.map(row => (
                            <View key={row.map(p => p.id).join('-')} style={{ flexDirection: 'row', gap: spacing.md }}>
                                {row.map(p => (
                                    <View key={p.id} style={{ flex: 1 }}>
                                        <ProductCard product={p} onOpen={setSelectedProduct} onAsk={canAsk ? askOnWhatsApp : undefined} />
                                    </View>
                                ))}
                                {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                            </View>
                        ))}
                        {remaining > 0 ? (
                            <Button title={`Show more (${remaining})`} variant="secondary" block onPress={() => setVisibleCount(c => c + PAGE_SIZE)} />
                        ) : null}
                    </View>
                )}
            </Screen>

            <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdded={handleAdded} />
        </>
    );
}
