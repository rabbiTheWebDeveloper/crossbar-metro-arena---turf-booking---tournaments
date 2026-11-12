import React, { useMemo, useState } from 'react';
import { Plus, Package } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { AppText, Button, Segmented, EmptyState, Loading, confirm } from '@/components/ui';
import { usePaged, ShowMoreButton } from '@/features/admin/content/paging';
import { ProductCard } from '@/features/admin/products/ProductCard';
import { ProductFormSheet } from '@/features/admin/products/ProductFormSheet';
import { filterProducts } from '@/features/admin/products/helpers';

/** Admin · Pro Shop Inventory & Products: stock, pricing, visibility and catalogue items. */
export default function AdminProductsScreen() {
    const { shopProducts, handleSaveShopProduct, handleDeleteShopProduct, showNotice, isLoadingData } = useArena();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [filter, setFilter] = useState('all');

    const products = useMemo(() => filterProducts(shopProducts, filter), [shopProducts, filter]);
    const paged = usePaged(products, filter);

    const filterOptions = [
        { value: 'all', label: `All (${shopProducts.length})` },
        { value: 'featured', label: 'Featured' },
        { value: 'hidden', label: 'Hidden' },
        { value: 'out', label: 'Out of stock' }
    ];

    const openAdd = () => { setEditing(null); setSheetOpen(true); };
    const openEdit = (prod) => { setEditing(prod); setSheetOpen(true); };

    const toggleVisible = async (prod) => {
        if (busyId) return;
        setBusyId(prod.id);
        const res = await handleSaveShopProduct({ id: prod.id, visible: prod.visible === false });
        setBusyId(null);
        if (res?.ok) showNotice('success', prod.visible === false ? `${prod.name} is now visible in the shop` : `${prod.name} hidden from the shop`);
    };

    const toggleFeatured = async (prod) => {
        if (busyId) return;
        setBusyId(prod.id);
        await handleSaveShopProduct({ id: prod.id, featured: !prod.featured });
        setBusyId(null);
    };

    const remove = async (prod) => {
        if (busyId) return;
        const ok = await confirm('Delete product?', `Delete "${prod.name}" permanently? Existing orders keep their line items.`, { confirmText: 'Delete', destructive: true });
        if (!ok) return;
        setBusyId(prod.id);
        const res = await handleDeleteShopProduct(prod.id);
        setBusyId(null);
        if (res?.ok) showNotice('success', `${prod.name} deleted`);
    };

    return (
        <AdminScreen title="Products" subtitle="Pro Shop Inventory & Products">
            <AppText size="sm" tone="muted">
                Control stock quantities, retail pricing, and catalog items for turf visitors.
            </AppText>
            <Button title="Add New Product" icon={Plus} onPress={openAdd} block />

            <Segmented scroll size="sm" value={filter} onChange={setFilter} options={filterOptions} />

            {isLoadingData && shopProducts.length === 0 ? (
                <Loading label="Loading products…" />
            ) : products.length === 0 ? (
                <EmptyState icon={Package} message={shopProducts.length === 0 ? 'No products yet. Add your first item to open the shop.' : 'No products match this filter.'} />
            ) : (
                <>
                    {paged.visible.map(prod => (
                        <ProductCard
                            key={prod.id}
                            product={prod}
                            busy={busyId === prod.id}
                            onEdit={() => openEdit(prod)}
                            onToggleFeatured={() => toggleFeatured(prod)}
                            onToggleVisible={() => toggleVisible(prod)}
                            onDelete={() => remove(prod)}
                        />
                    ))}
                    <ShowMoreButton paged={paged} />
                </>
            )}

            <ProductFormSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} product={editing} />
        </AdminScreen>
    );
}
