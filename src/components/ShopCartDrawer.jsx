'use client';
import React, { useState } from 'react';
import { useArena, cleanPhone } from '../context/ArenaContext';
import { BD_PHONE_REGEX } from '../lib/dateUtils';
import { X, ShoppingBag, Trash2, CheckCircle2, Store, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ShopCartDrawer = () => {
    const { cartItems, removeFromCart, clearCart, setShowCartDrawer, handleSaveShopReservation, currentUser, isVisitor, shopProducts, showNotice } = useArena();
    const [customerName, setCustomerName] = useState(!isVisitor ? (currentUser?.name || '') : '');
    const [customerPhone, setCustomerPhone] = useState(!isVisitor ? (currentUser?.phone || '') : '');
    const [reservationConfirmed, setReservationConfirmed] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Live product data (stock/visibility may have changed since the item was bagged)
    const liveProduct = (id) => shopProducts.find(p => p.id === id);
    const lineProblems = cartItems.map(item => {
        const live = liveProduct(item.product.id);
        if (!live || live.visible === false) return 'No longer available';
        if ((live.stock ?? 0) < item.quantity) return `Only ${live.stock || 0} left`;
        return '';
    });
    const hasProblems = lineProblems.some(Boolean);
    const totalAmount = cartItems.reduce((sum, item) => {
        const live = liveProduct(item.product.id) || item.product;
        return sum + (Number(live.salePrice) || Number(live.price) || 0) * item.quantity;
    }, 0);

    const handleReserveAll = async (e) => {
        e.preventDefault();
        if (isSubmitting || cartItems.length === 0) return;
        const name = customerName.trim();
        const phone = cleanPhone(customerPhone);
        if (!name) { setError('Please enter your name for the pickup.'); return; }
        if (!BD_PHONE_REGEX.test(phone)) { setError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        if (hasProblems) { setError('Some items in your bag are unavailable in that quantity. Remove them and try again.'); return; }
        setError('');
        setIsSubmitting(true);
        const r = await handleSaveShopReservation({
            customerName: name,
            customerPhone: phone,
            items: cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity, size: item.selectedSize || '' }))
        });
        setIsSubmitting(false);
        if (!r.ok) {
            setError(r.error || 'Could not reserve your items. Please try again.');
            return;
        }
        setReservationConfirmed(r.reservation);
        clearCart();
        showNotice('success', `Reserved for pickup · code ${r.reservation.reservationCode}`);
        try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } }); } catch { /* ignore */ }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setShowCartDrawer(false);
        setReservationConfirmed(null);
    };

    const confirmedTotal = reservationConfirmed
        ? Number(reservationConfirmed.totalAmount ?? reservationConfirmed.price ?? (reservationConfirmed.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0))
        : 0;

    return (<div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="relative w-full max-w-md bg-[#0a0f15] border-l border-emerald-500/30 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2 text-white font-display">
            <ShoppingBag className="w-5 h-5 text-emerald-400"/>
            <h3 className="text-lg font-black uppercase tracking-wide">Arena Shop Bag</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <button type="button" onClick={handleClose} disabled={isSubmitting} aria-label="Close" className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 transition-colors cursor-pointer disabled:opacity-50">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {reservationConfirmed ? (<div className="p-6 text-center space-y-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-7 h-7"/>
              </div>
              <h4 className="text-lg font-bold text-white uppercase font-display">
                Gear reserved for counter pickup
              </h4>
              <p className="text-xs text-slate-300">
                Show this pickup code at Crossbar reception. Pay cash, bKash or card at the desk.
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 text-center">
                <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Pickup Pass Code</div>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{reservationConfirmed.reservationCode}</div>
                {confirmedTotal > 0 && <div className="text-xs text-white font-bold mt-1">Total payable: ৳{confirmedTotal.toLocaleString()}</div>}
              </div>
              <button type="button" onClick={handleClose} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer">
                Done
              </button>
            </div>) : cartItems.length === 0 ? (<div className="text-center py-16 text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 stroke-1"/>
              <div className="text-sm font-semibold text-slate-300">Your bag is empty</div>
              <p className="text-xs max-w-xs mx-auto">
                Browse grip socks, match balls, and jerseys in the Arena Shop.
              </p>
            </div>) : (<>
              {/* Items */}
              <div className="space-y-3">
                {cartItems.map((item, idx) => {
                    const live = liveProduct(item.product.id) || item.product;
                    const price = Number(live.salePrice) || Number(live.price) || 0;
                    const problem = lineProblems[idx];
                    return (<div key={`${item.product.id}-${item.selectedSize || idx}`} className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${problem ? 'bg-rose-950/20 border-rose-500/30' : 'bg-white/[0.03] border-white/10'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{item.product.name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {item.selectedSize && <span className="text-emerald-400">Size: {item.selectedSize}</span>}
                          <span>Qty: {item.quantity}</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                          ৳{(price * item.quantity).toLocaleString()}
                        </div>
                        {problem && (<div className="text-[11px] text-rose-300 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3"/> {problem}
                          </div>)}
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.product.id, item.selectedSize)} aria-label="Remove" className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>);
                })}
              </div>

              {/* Reserve form */}
              <form onSubmit={handleReserveAll} className="pt-4 border-t border-white/10 space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Store className="w-4 h-4"/>
                  <span>Reserve for desk pickup (pay at the arena)</span>
                </div>

                {error && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5"/>
                    <span>{error}</span>
                  </div>)}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                  <input type="text" required placeholder="e.g. Siam Chowdhury" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"/>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number</label>
                  <input type="tel" required inputMode="numeric" placeholder="01XXXXXXXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"/>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs font-bold text-white">
                  <span>Total due at counter</span>
                  <span className="text-base text-emerald-400 font-mono">৳{totalAmount.toLocaleString()}</span>
                </div>

                <button type="submit" disabled={isSubmitting || hasProblems} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                  <span>{isSubmitting ? 'Reserving…' : 'Reserve for Pickup'}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4"/>}
                </button>
              </form>
            </>)}
        </div>

      </div>
    </div>);
};
