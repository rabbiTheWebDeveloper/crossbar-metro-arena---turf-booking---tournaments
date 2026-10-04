'use client';

import React, { useState } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { INITIAL_SHOP_PRODUCTS, VENUE_INFO } from '../../../data/initialData';
import { ShopProduct, ShopReservation } from '../../../types';
import { PageHero } from '../../../components/PageHero';
import { ShoppingBag, CheckCircle, ShieldCheck, Tag, Sparkles, X, Phone, User, Store, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ShopPage() {
  const { handleSaveShopReservation, shopReservations } = useArena();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reservingProduct, setReservingProduct] = useState<ShopProduct | null>(null);
  
  // Modal form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [confirmedReservation, setConfirmedReservation] = useState<ShopReservation | null>(null);

  const categories = [
    { id: 'all', label: 'All Gear' },
    { id: 'accessories', label: 'Grip Socks & Guards' },
    { id: 'balls', label: 'FIFA Balls' },
    { id: 'apparel', label: 'Arena Jerseys' },
    { id: 'footwear', label: 'Turf Boots' },
    { id: 'drinks', label: 'Hydration' }
  ];

  const filteredProducts = INITIAL_SHOP_PRODUCTS.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservingProduct || !customerName.trim() || !customerPhone.trim()) return;

    const reservationCode = `CMA-SH-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReservation: ShopReservation = {
      id: `shop-res-${Date.now()}`,
      reservationCode,
      productId: reservingProduct.id,
      productName: reservingProduct.name,
      price: reservingProduct.price,
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

  const closeModal = () => {
    setReservingProduct(null);
    setConfirmedReservation(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <>
      <PageHero
        crumb="Arena Shop"
        eyebrow="Official Crossbar Match Gear"
        eyebrowIcon={ShoppingBag}
        title="Pro Turf Gear &"
        highlight="Merchandise"
        description="Pick up authentic grip socks, FIFA match balls, official kits, and ice-cold hydration. Reserve online and collect at the arena counter before kickoff."
        stats={[
          { label: 'Shop Location', value: 'Arena Reception', icon: Store },
          { label: 'Pickup Type', value: 'Instant Counter Hold', icon: Tag },
          { label: 'Quality', value: 'FIFA Standard', icon: ShieldCheck },
          { label: 'Payment', value: 'Cash / bKash / Card', icon: ShoppingBag }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
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

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  {product.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {product.badge}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ৳{product.price.toLocaleString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 font-display">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  {product.description}
                </p>

                {/* Specs */}
                <div className="space-y-1.5 pt-3 border-t border-white/10 mb-6">
                  {product.specs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setReservingProduct(product)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Reserve & Pickup at Counter</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Counter Info Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white">Arena Counter Pickup Rules:</strong> Items are held under your name & phone for your upcoming match. Payment is collected upon pickup via cash, bKash, or card.
            </div>
          </div>
          <a
            href={VENUE_INFO.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 shrink-0"
          >
            Inquire via WhatsApp
          </a>
        </div>
      </div>

      {/* Reservation Modal */}
      {reservingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-[#0c131a] border border-white/15 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0c131a] p-5 border-b border-white/10 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Arena Shop Reservation
                </span>
                <h3 className="text-lg font-bold text-white font-display mt-0.5">
                  {reservingProduct.name}
                </h3>
                <span className="text-xs font-mono text-emerald-300 font-bold">
                  ৳{reservingProduct.price.toLocaleString()} · Pay at Pickup
                </span>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confirmedReservation ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Item Reserved!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Present your pickup code to our staff at the arena counter before your match.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-lg font-black text-emerald-400 tracking-wider">
                  {confirmedReservation.reservationCode}
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReserve} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siam Chowdhury"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01844-332211"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-300">
                  No advance payment needed for shop reservations. Item will be held under your phone number until match day.
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-1/3 py-2.5 rounded-xl border border-white/15 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <span>Confirm Hold</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
