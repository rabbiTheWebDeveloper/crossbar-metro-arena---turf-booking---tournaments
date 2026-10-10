'use client';

import React, { useState } from 'react';
import { useArena } from '../context/ArenaContext';
import { ShopReservation } from '../types';
import {
  X,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Store,
  Phone,
  User,
  Tag,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ShopCartDrawer: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    showCartDrawer,
    setShowCartDrawer,
    handleSaveShopReservation,
    currentUser
  } = useArena();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [reservationConfirmed, setReservationConfirmed] = useState<ShopReservation | null>(null);

  if (!showCartDrawer) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity,
    0
  );

  const handleReserveAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || !customerName.trim() || !customerPhone.trim()) return;

    // Create reservation for each item or primary bundle
    const firstItem = cartItems[0];
    const code = `CMA-SH-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRes: ShopReservation = {
      id: `res-${Date.now()}`,
      reservationCode: code,
      productId: firstItem.product.id,
      productName: cartItems.length > 1
        ? `${firstItem.product.name} + ${cartItems.length - 1} more items`
        : firstItem.product.name,
      size: firstItem.selectedSize,
      quantity: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      price: totalAmount,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      status: 'reserved_pickup',
      reservedAt: new Date().toISOString()
    };

    handleSaveShopReservation(newRes);
    setReservationConfirmed(newRes);
    clearCart();

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  const handleClose = () => {
    setShowCartDrawer(false);
    setReservationConfirmed(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-md bg-[#0a0f15] border-l border-emerald-500/30 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2 text-white font-display">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-black uppercase tracking-wide">Arena Shop Bag</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              {cartItems.length} Items
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {reservationConfirmed ? (
            <div className="p-6 text-center space-y-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-white uppercase font-display">
                Gear Reserved for Counter Pickup!
              </h4>
              <p className="text-xs text-slate-300">
                Show this pickup code upon arrival at Crossbar reception. Pay cash, bKash or card at desk.
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Pickup Pass Code</div>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{reservationConfirmed.reservationCode}</div>
                <div className="text-xs text-white font-bold mt-1">Total Payable: ৳{reservationConfirmed.price.toLocaleString()}</div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 stroke-1" />
              <div className="text-sm font-semibold text-slate-300">Your bag is empty</div>
              <p className="text-xs max-w-xs mx-auto">
                Browse official grip socks, FIFA balls, and jerseys in the Arena Shop.
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                {cartItems.map((item, idx) => {
                  const price = item.product.salePrice || item.product.price;
                  return (
                    <div
                      key={`${item.product.id}-${item.selectedSize || idx}`}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{item.product.name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {item.selectedSize && <span className="text-emerald-400">Size: {item.selectedSize}</span>}
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                          ৳{(price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Reserve for Pickup Form */}
              <form onSubmit={handleReserveAll} className="pt-4 border-t border-white/10 space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Store className="w-4 h-4" />
                  <span>Reserve for Desk Pickup (Pay at Arena)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Siam Chowdhury"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs font-bold text-white">
                  <span>Total Due at Counter</span>
                  <span className="text-base text-emerald-400 font-mono">৳{totalAmount.toLocaleString()}</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Reserve for Pickup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
