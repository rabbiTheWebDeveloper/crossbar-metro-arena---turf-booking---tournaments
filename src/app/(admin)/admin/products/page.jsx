'use client';
import React, { useState } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Plus } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default function AdminProductsPage() {
    const { shopProducts, handleSaveShopProduct } = useArena();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    // Form
    const [name, setName] = useState('');
    const [category, setCategory] = useState('accessories');
    const [price, setPrice] = useState(450);
    const [stock, setStock] = useState(20);
    const [badge, setBadge] = useState('Pro Spec');
    const [image, setImage] = useState('');
    const handleOpenAdd = () => {
        setEditingProduct(null);
        setName('');
        setCategory('accessories');
        setPrice(450);
        setStock(25);
        setBadge('Arena Spec');
        setImage('https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80');
        setShowAddModal(true);
    };
    const handleOpenEdit = (prod) => {
        setEditingProduct(prod);
        setName(prod.name);
        setCategory(prod.category);
        setPrice(prod.price);
        setStock(prod.stock);
        setBadge(prod.badge || '');
        setImage(prod.image || '');
        setShowAddModal(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || price <= 0)
            return;
        const newProd = {
            id: editingProduct ? editingProduct.id : `shop-${Date.now()}`,
            name: name.trim(),
            category,
            price: Number(price),
            stock: Number(stock),
            badge: badge.trim(),
            description: 'Official Crossbar Metro Arena gear and accessories.',
            specs: ['Pitch tested', 'High durability'],
            inStock: Number(stock) > 0,
            visible: true,
            image: image.trim() || 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80'
        };
        handleSaveShopProduct(newProd);
        setShowAddModal(false);
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

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {shopProducts.map(prod => (<div key={prod.id} className="p-4 rounded-3xl bg-[#0c131a] border border-white/5 space-y-3 hover:border-lime-400/30 transition-all flex flex-col justify-between">
            <div>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#080d12] border border-white/5 mb-3">
                <img src={prod.image || 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80'} alt={prod.name} className="w-full h-full object-cover" onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=600&q=80';
            }}/>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-black/70 text-lime-400 border border-lime-400/30">
                  {prod.category}
                </span>
              </div>

              <h4 className="font-bold text-white text-sm line-clamp-1">{prod.name}</h4>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="font-mono text-lime-400 font-bold text-base">
                  ৳{prod.price.toLocaleString()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${prod.stock > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex gap-2">
              <button type="button" onClick={() => handleOpenEdit(prod)} className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs">
                Edit Details
              </button>
            </div>
          </div>))}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white font-display">
              {editingProduct ? 'Edit Product' : 'Add New Inventory Item'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Product Name *</label>
                <input type="text" required placeholder="e.g. Nike Phantom Grip Socks" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white">
                    <option value="accessories">Accessories</option>
                    <option value="footwear">Footwear / Turf Shoes</option>
                    <option value="balls">Match Balls</option>
                    <option value="apparel">Jerseys &amp; Apparel</option>
                    <option value="drinks">Hydration &amp; Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Price (৳) *</label>
                  <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Stock Quantity</label>
                  <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Badge Tag</label>
                  <input type="text" value={badge} onChange={e => setBadge(e.target.value)} placeholder="e.g. Best Seller" className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Image URL</label>
                <input type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://images.unsplash.com/..." className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[11px]"/>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
