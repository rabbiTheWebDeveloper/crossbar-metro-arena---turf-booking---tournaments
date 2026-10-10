'use client';

import React, { useState } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { ShopProduct, ShopReservation } from '../../../types';
import { PageHero } from '../../../components/PageHero';
import {
  ShoppingBag,
  CheckCircle,
  ShieldCheck,
  Tag,
  Sparkles,
  X,
  Phone,
  User,
  Store,
  ArrowRight,
  Search,
  MessageSquare,
  Plus,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ShopPage() {
  const {
    shopProducts,
    handleSaveShopReservation,
    addToCart,
    setShowCartDrawer,
    currentUser
  } = useArena();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  
  // Modal state for selected product
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [confirmedReservation, setConfirmedReservation] = useState<ShopReservation | null>(null);

  const categories = [
    { id: 'all', label: 'All Match Gear' },
    { id: 'accessories', label: 'Grip Socks & Guards' },
    { id: 'balls', label: 'FIFA Balls' },
    { id: 'apparel', label: 'Arena Jerseys' },
    { id: 'footwear', label: 'Turf Boots (TF/AG)' },
    { id: 'drinks', label: 'Hydration & Drinks' }
  ];

  const filteredProducts = shopProducts.filter(p => {
    if (p.visible === false) return false;
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenProduct = (product: ShopProduct) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes?.[0] || '');
    setQuantity(1);
    setConfirmedReservation(null);
  };

  const handleReserveDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !customerName.trim() || !customerPhone.trim()) return;

    const price = selectedProduct.salePrice || selectedProduct.price;
    const reservationCode = `CMA-SH-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReservation: ShopReservation = {
      id: `shop-res-${Date.now()}`,
      reservationCode,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      size: selectedSize,
      quantity,
      price: price * quantity,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      status: 'reserved_pickup',
      reservedAt: new Date().toISOString()
    };

    handleSaveShopReservation(newReservation);
    setConfirmedReservation(newReservation);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  return (
    <>
      <PageHero
        crumb="Arena Shop"
        eyebrow="Official Crossbar Match Gear"
        eyebrowIcon={ShoppingBag}
        title="Pro Turf Gear &"
        highlight="Merchandise"
        description="Authentic grip socks, FIFA match balls, official arena kits, and ice-cold electrolyte drinks. Reserve online and collect at reception before kickoff."
        stats={[
          { label: 'Shop Location', value: 'Arena Reception', icon: Store },
          { label: 'Pickup Type', value: 'Instant Counter Hold', icon: Tag },
          { label: 'Quality', value: 'FIFA Standard', icon: ShieldCheck },
          { label: 'Counter Payment', value: 'Cash / bKash / Card', icon: ShoppingBag }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search gear by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(p => {
            const hasSale = p.salePrice && p.salePrice < p.price;
            return (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {p.category.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.stock > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-display">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>

                  {/* Price */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-black font-mono text-emerald-400">
                      ৳{(p.salePrice || p.price).toLocaleString()}
                    </span>
                    {hasSale && (
                      <span className="text-xs text-slate-500 line-through font-mono">
                        ৳{p.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenProduct(p)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    Select &amp; Reserve
                  </button>

                  <a
                    href={`https://wa.me/8801796337133?text=Hi%20Crossbar%20Shop%2C%20is%20${encodeURIComponent(p.name)}%20available%20for%20pickup%20today%3F`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 transition-colors cursor-pointer"
                    title="Ask on WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Product Detail & Instant Reserve Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-b border-white/10 bg-slate-900/90">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {selectedProduct.category} · Stock: {selectedProduct.stock} Units
              </span>
              <h3 className="text-xl font-black text-white font-display mt-1">
                {selectedProduct.name}
              </h3>
              <div className="text-lg font-black font-mono text-emerald-400 mt-2">
                ৳{((selectedProduct.salePrice || selectedProduct.price) * quantity).toLocaleString()}
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {confirmedReservation ? (
                <div className="p-6 text-center space-y-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white uppercase">
                    Reserved for Counter Pickup!
                  </h4>
                  <p className="text-xs text-slate-300">
                    Show your reservation code at Crossbar reception. Pay cash, bKash or card at desk.
                  </p>
                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 text-center font-mono">
                    <div className="text-[10px] text-slate-400 uppercase">Pickup Pass Code</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{confirmedReservation.reservationCode}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReserveDirect} className="space-y-4">
                  {/* Specs */}
                  {selectedProduct.specs && (
                    <div className="text-xs text-slate-300 space-y-1 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      {selectedProduct.specs.map((s, idx) => (
                        <div key={idx}>✓ {s}</div>
                      ))}
                    </div>
                  )}

                  {/* Size selection */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Select Size
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.sizes.map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              selectedSize === sz
                                ? 'bg-emerald-500 text-slate-950 font-black'
                                : 'bg-white/5 text-slate-300 border border-white/10'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-white text-base">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Customer info for pickup */}
                  <div className="pt-2 border-t border-white/10 space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Pickup Reservation Details
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Siam Chowdhury"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(selectedProduct, selectedSize, quantity);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Add to Bag
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      Reserve for Pickup
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
