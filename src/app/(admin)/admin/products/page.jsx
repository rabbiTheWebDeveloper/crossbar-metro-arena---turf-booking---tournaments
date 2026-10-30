'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Plus, Eye, EyeOff, Trash2, Star } from 'lucide-react';
export const dynamic = 'force-dynamic';

const CATEGORIES = [
    { value: 'accessories', label: 'Accessories' },
    { value: 'footwear', label: 'Footwear / Turf Shoes' },
    { value: 'balls', label: 'Match Balls' },
    { value: 'apparel', label: 'Jerseys & Apparel' },
    { value: 'drinks', label: 'Hydration & Drinks' },
    { value: 'equipment', label: 'Equipment' }
];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80';
const parseSizes = (s) => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

const emptyForm = () => ({ name: '', category: 'accessories', price: '', salePrice: '', stock: '', badge: '', description: '', sizes: '', featured: false, visible: true, image: '' });
const formFromProduct = (p) => ({
    name: p.name || '',
    category: p.category || 'accessories',
    price: p.price ?? '',
    salePrice: p.salePrice ?? '',
    stock: p.stock ?? '',
    badge: p.badge || '',
    description: p.description || '',
    sizes: (p.sizes || []).join(', '),
    featured: !!p.featured,
    visible: p.visible !== false,
    image: p.image || ''
});

export default function AdminProductsPage() {
    const { shopProducts, handleSaveShopProduct, handleDeleteShopProduct, showNotice, isLoadingData } = useArena();
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [filter, setFilter] = useState('all');

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const products = useMemo(() => {
        if (filter === 'hidden') return shopProducts.filter(p => p.visible === false);
        if (filter === 'out') return shopProducts.filter(p => Number(p.stock) <= 0);
        if (filter === 'featured') return shopProducts.filter(p => p.featured);
        return shopProducts;
    }, [shopProducts, filter]);

    const handleOpenAdd = () => { setEditingProduct(null); setForm(emptyForm()); setFormError(''); setShowModal(true); };
    const handleOpenEdit = (prod) => { setEditingProduct(prod); setForm(formFromProduct(prod)); setFormError(''); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setFormError('');
        const name = form.name.trim();
        const price = Number(form.price);
        const stock = form.stock === '' ? 0 : Number(form.stock);
        const salePrice = form.salePrice === '' ? null : Number(form.salePrice);
        if (!name) { setFormError('Product name is required.'); return; }
        if (Number.isNaN(price) || price < 0) { setFormError('Price must be ৳0 or more.'); return; }
        if (Number.isNaN(stock) || stock < 0) { setFormError('Stock must be 0 or more.'); return; }
        if (salePrice !== null && (Number.isNaN(salePrice) || salePrice < 0)) { setFormError('Sale price must be ৳0 or more.'); return; }
        if (salePrice !== null && salePrice > price) { setFormError('Sale price cannot be higher than the regular price.'); return; }
        if (form.image.trim() && !/^https?:\/\//i.test(form.image.trim())) { setFormError('Image must be an http(s) URL.'); return; }
        const sizes = parseSizes(form.sizes);

        let payload;
        if (editingProduct) {
            // Only send what changed
            payload = { id: editingProduct.id };
            if (name !== editingProduct.name) payload.name = name;
            if (form.category !== editingProduct.category) payload.category = form.category;
            if (price !== Number(editingProduct.price)) payload.price = price;
            const prevSale = editingProduct.salePrice ?? null;
            if ((salePrice ?? price) !== (prevSale ?? Number(editingProduct.price))) payload.salePrice = salePrice ?? price;
            if (stock !== Number(editingProduct.stock)) payload.stock = stock;
            if (!sameList(sizes, editingProduct.sizes || [])) payload.sizes = sizes;
            if (form.badge.trim() !== (editingProduct.badge || '')) payload.badge = form.badge.trim();
            if (form.description.trim() !== (editingProduct.description || '')) payload.description = form.description.trim();
            if (form.image.trim() && form.image.trim() !== editingProduct.image) payload.image = form.image.trim();
            if (form.featured !== !!editingProduct.featured) payload.featured = form.featured;
            if (form.visible !== (editingProduct.visible !== false)) payload.visible = form.visible;
            if (Object.keys(payload).length === 1) { setShowModal(false); return; }
        } else {
            payload = {
                name, category: form.category, price, stock, sizes,
                badge: form.badge.trim(),
                description: form.description.trim(),
                featured: form.featured,
                image: form.image.trim() || undefined
            };
            if (salePrice !== null) payload.salePrice = salePrice;
        }
        setIsSubmitting(true);
        const res = await handleSaveShopProduct(payload);
        setIsSubmitting(false);
        if (res?.ok && res.product) {
            setShowModal(false);
            setEditingProduct(null);
        } else {
            setFormError(res?.error || 'Could not save the product.');
        }
    };

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
        if (!confirm(`Delete "${prod.name}" permanently? Existing orders keep their line items.`)) return;
        setBusyId(prod.id);
        const res = await handleDeleteShopProduct(prod.id);
        setBusyId(null);
        if (res?.ok) showNotice('success', `${prod.name} deleted`);
    };

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
            Pro Shop Inventory &amp; Products
          </h2>
          <p className="text-xs text-slate-400">
            Control stock quantities, retail pricing, and catalog items for turf visitors.
          </p>
        </div>

        <button type="button" onClick={handleOpenAdd} className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-lime-400/20">
          <Plus className="w-4 h-4 stroke-[3]"/>
          <span>Add New Product</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        {[['all', `All (${shopProducts.length})`], ['featured', 'Featured'], ['hidden', 'Hidden'], ['out', 'Out of stock']].map(([k, label]) => (<button key={k} type="button" onClick={() => setFilter(k)} className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold transition-colors cursor-pointer ${filter === k ? 'bg-lime-400 text-slate-950 font-black' : 'bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white'}`}>
            {label}
          </button>))}
      </div>

      {/* Product Grid */}
      {isLoadingData && shopProducts.length === 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 rounded-3xl bg-[#0c131a] border border-white/5"/>)}
        </div>) : products.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
          {shopProducts.length === 0 ? 'No products yet. Add your first item to open the shop.' : 'No products match this filter.'}
        </div>) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(prod => {
            const hidden = prod.visible === false;
            const stock = Number(prod.stock) || 0;
            const onSale = prod.salePrice != null && Number(prod.salePrice) < Number(prod.price);
            const isBusy = busyId === prod.id;
            return (<div key={prod.id} className={`p-4 rounded-3xl bg-[#0c131a] border space-y-3 transition-all flex flex-col justify-between ${hidden ? 'border-white/5 opacity-60' : 'border-white/5 hover:border-lime-400/30'}`}>
            <div>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#080d12] border border-white/5 mb-3">
                <img loading="lazy" decoding="async" src={prod.image || FALLBACK_IMAGE} alt={prod.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = FALLBACK_IMAGE; }}/>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono bg-black/70 text-lime-400 border border-lime-400/30">
                  {prod.category}
                </span>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {prod.featured && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-400/90 text-slate-950">FEATURED</span>}
                  {hidden && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-black/70 text-slate-300 border border-white/20">HIDDEN</span>}
                </div>
                {prod.badge ? (<span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-black/70 text-white border border-white/20">{prod.badge}</span>) : null}
              </div>

              <h4 className="font-bold text-white text-sm line-clamp-1">{prod.name}</h4>
              {prod.description ? <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{prod.description}</p> : null}
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="font-mono font-bold text-base">
                  <span className="text-lime-400">৳{(Number(onSale ? prod.salePrice : prod.price) || 0).toLocaleString()}</span>
                  {onSale && <span className="text-slate-500 line-through text-xs ml-1.5">৳{Number(prod.price).toLocaleString()}</span>}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${stock > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                </span>
              </div>
              {prod.sizes && prod.sizes.length > 0 && (<div className="text-[10px] font-mono text-slate-500 mt-1 truncate">Sizes: {prod.sizes.join(' · ')}</div>)}
            </div>

            <div className="pt-3 border-t border-white/5 flex gap-1.5">
              <button type="button" disabled={isBusy} onClick={() => handleOpenEdit(prod)} className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs disabled:opacity-50">
                Edit
              </button>
              <button type="button" disabled={isBusy} onClick={() => toggleFeatured(prod)} title={prod.featured ? 'Remove from featured' : 'Feature on the shop front'} className={`p-1.5 rounded-xl border text-xs disabled:opacity-50 ${prod.featured ? 'bg-amber-400/15 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
                <Star className={`w-3.5 h-3.5 ${prod.featured ? 'fill-amber-400' : ''}`}/>
              </button>
              <button type="button" disabled={isBusy} onClick={() => toggleVisible(prod)} title={hidden ? 'Show in shop' : 'Hide from shop'} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs disabled:opacity-50">
                {hidden ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
              </button>
              <button type="button" disabled={isBusy} onClick={() => remove(prod)} title="Delete product" className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-300 text-xs disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>);
        })}
      </div>)}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white font-display">
              {editingProduct ? 'Edit Product' : 'Add New Inventory Item'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Product Name *</label>
                <input type="text" required placeholder="e.g. Nike Phantom Grip Socks" value={form.name} onChange={e => set('name', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Price (৳) *</label>
                  <input type="number" required min={0} value={form.price} onChange={e => set('price', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Sale Price (৳) <span className="text-slate-500">optional</span></label>
                  <input type="number" min={0} value={form.salePrice} onChange={e => set('salePrice', e.target.value)} placeholder="Leave blank = no sale" className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Stock Quantity</label>
                  <input type="number" min={0} value={form.stock} onChange={e => set('stock', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Sizes <span className="text-slate-500">comma separated</span></label>
                  <input type="text" value={form.sizes} onChange={e => set('sizes', e.target.value)} placeholder="e.g. S, M, L, XL" className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Badge Tag</label>
                  <input type="text" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="e.g. Best Seller" className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description shown in the shop" className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white resize-none"/>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Image URL</label>
                <input type="url" value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://... (ImageKit / Cloudinary / Unsplash)" className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[12px]"/>
                {!editingProduct && !form.image.trim() && <span className="text-[10px] text-slate-500">Leave blank to use the default placeholder image.</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="w-4 h-4 accent-lime-400"/>
                  <span className="text-slate-300">Featured</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input type="checkbox" checked={form.visible} onChange={e => set('visible', e.target.checked)} className="w-4 h-4 accent-lime-400"/>
                  <span className="text-slate-300">Visible in shop</span>
                </label>
              </div>

              {formError && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">{formError}</div>)}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl disabled:opacity-60">
                  {isSubmitting ? 'Saving…' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
