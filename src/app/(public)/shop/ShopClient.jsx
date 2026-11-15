'use client';
import React, { useState } from 'react';
import { useArena, cleanPhone } from '../../../context/ArenaContext';
import { BD_PHONE_REGEX } from '../../../lib/dateUtils';
import { homeFontVariables } from '../../../components/home/fonts';
import { Container, Eyebrow, Button } from '../../../components/home/ui';
import { HomeHeader } from '../../../components/home/HomeHeader';
import { HomeFooter } from '../../../components/home/InfoSections';
import { ProductCard, canReserveProduct, productPricing } from '../../../components/home/ProductCard';
import { bdt } from '../../../components/home/slots';
import { ShoppingBag, CheckCircle, X, Search, Plus, Minus, AlertTriangle, Loader2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const whatsappLink = (siteSettings, text) => {
    const base = String(siteSettings?.whatsappUrl || '').split('?')[0];
    if (!base) return '';
    return `${base}?text=${encodeURIComponent(text)}`;
};

const CATEGORIES = [
    { id: 'all', label: 'All match gear' },
    { id: 'accessories', label: 'Grip socks & guards' },
    { id: 'balls', label: 'FIFA balls' },
    { id: 'apparel', label: 'Arena jerseys' },
    { id: 'footwear', label: 'Turf boots (TF/AG)' },
    { id: 'drinks', label: 'Hydration & drinks' }
];

const FACTS = [
    { label: 'Shop location', value: 'Arena reception' },
    { label: 'Pickup type', value: 'Counter hold' },
    { label: 'Quality', value: 'FIFA standard' },
    { label: 'Counter payment', value: 'Cash / bKash / card' }
];

const maxQty = (p) => Math.max(1, Math.min(10, Number(p?.stock ?? 0)));

/**
 * Arena shop in the main site design: browse gear, reserve one item for counter pickup or add it
 * to the bag. Reservation rules are unchanged: stock-limited, name + Bangladeshi mobile required.
 */
export default function ShopPage() {
    const { shopProducts, handleSaveShopReservation, addToCart, currentUser, isVisitor, siteSettings, showNotice, isLoadingData } = useArena();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [customerName, setCustomerName] = useState(!isVisitor ? (currentUser?.name || '') : '');
    const [customerPhone, setCustomerPhone] = useState(!isVisitor ? (currentUser?.phone || '') : '');
    const [confirmedReservation, setConfirmedReservation] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const visibleProducts = (shopProducts || []).filter(p => p.visible !== false);
    const q = searchQuery.trim().toLowerCase();
    const filteredProducts = visibleProducts.filter(p => {
        const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
        const matchSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
        return matchCat && matchSearch;
    });
    const filtering = Boolean(searchQuery) || selectedCategory !== 'all';

    const handleOpenProduct = (product) => {
        setSelectedProduct(product);
        setSelectedSize(product.sizes?.[0] || '');
        setQuantity(1);
        setConfirmedReservation(null);
        setError('');
    };

    const closeProduct = () => {
        if (isSubmitting) return;
        setSelectedProduct(null);
        setError('');
    };

    const handleReserveDirect = async (e) => {
        e.preventDefault();
        if (isSubmitting || !selectedProduct) return;
        if (!canReserveProduct(selectedProduct)) { setError('This item is out of stock right now.'); return; }
        const name = customerName.trim();
        const phone = cleanPhone(customerPhone);
        if (!name) { setError('Please enter your name for the pickup.'); return; }
        if (!BD_PHONE_REGEX.test(phone)) { setError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        setError('');
        setIsSubmitting(true);
        const r = await handleSaveShopReservation({
            customerName: name,
            customerPhone: phone,
            items: [{ productId: selectedProduct.id, quantity: Math.min(quantity, maxQty(selectedProduct)), size: selectedSize || '' }]
        });
        setIsSubmitting(false);
        if (!r.ok) {
            setError(r.error || 'Could not reserve this item. Please try again.');
            return;
        }
        setConfirmedReservation(r.reservation);
        showNotice('success', `Reserved for pickup · code ${r.reservation.reservationCode}`);
        try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } }); } catch { /* ignore */ }
    };

    const handleAddToBag = () => {
        if (!selectedProduct || !canReserveProduct(selectedProduct)) return;
        addToCart(selectedProduct, selectedSize, Math.min(quantity, maxQty(selectedProduct)));
        setSelectedProduct(null);
    };

    const unitPrice = selectedProduct ? productPricing(selectedProduct).price : 0;
    const inputClass = 'h-12 w-full rounded-xl border border-hairline bg-ink px-4 text-[15px] text-paper placeholder:text-paper/35 outline-none transition-colors focus:border-neon';

    return (
        <div className={`home-v2 relative isolate ${homeFontVariables}`}>
            <HomeHeader />

            {/* ---- intro ---- */}
            <section>
                <Container className="pt-8 lg:pt-12 pb-12 lg:pb-16">
                    <Eyebrow>Arena shop</Eyebrow>
                    <h1 className="mt-4 max-w-[900px] font-bigs font-bold uppercase leading-[0.92] text-paper text-[52px] sm:text-[76px] lg:text-[96px]">
                        Pro turf gear &amp; <span className="text-neon">merchandise</span>
                    </h1>
                    <p className="mt-6 max-w-[620px] text-[17px] leading-[1.55] text-paper/80">
                        Grip socks, match balls, official arena kits, and cold electrolyte drinks. Reserve online and collect at reception before kickoff.
                    </p>
                    <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-hairline pt-8 lg:grid-cols-4">
                        {FACTS.map(f => (
                            <div key={f.label}>
                                <dt className="font-code text-[12px] uppercase tracking-[0.16em] text-paper/50">{f.label}</dt>
                                <dd className="mt-2 font-bigs text-[26px] font-bold uppercase leading-none text-paper">{f.value}</dd>
                            </div>
                        ))}
                    </dl>
                </Container>
            </section>

            {/* ---- catalogue ---- */}
            <section id="products" className="scroll-mt-24 bg-ink">
                <Container className="pb-16 lg:pb-[120px]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                            <div className="inline-flex gap-1.5 rounded-2xl border border-hairline bg-panel p-1.5" role="tablist" aria-label="Product categories">
                                {CATEGORIES.map(c => {
                                    const active = selectedCategory === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setSelectedCategory(c.id)}
                                            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-colors cursor-pointer ${active ? 'bg-paper text-ink' : 'text-paper/65 hover:text-paper'}`}
                                        >
                                            {c.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <label className="relative block lg:w-[300px] shrink-0">
                            <span className="sr-only">Search gear by name</span>
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/50" />
                            <input type="search" placeholder="Search gear by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputClass} pl-11`} />
                        </label>
                    </div>

                    <div className="mt-6 font-code text-[12px] uppercase tracking-[0.14em] text-paper/50">
                        {isLoadingData && visibleProducts.length === 0 ? 'Loading the catalogue…' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'items'}${filtering ? ` of ${visibleProducts.length}` : ''}`}
                    </div>

                    {isLoadingData && visibleProducts.length === 0 ? (
                        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[520px] rounded-[22px] border border-hairline bg-panel animate-pulse" />)}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="mt-6 rounded-[22px] border border-hairline bg-panel px-6 py-16 text-center">
                            <ShoppingBag className="mx-auto h-10 w-10 text-neon" strokeWidth={1.6} />
                            <h2 className="mt-5 font-bigs text-[34px] font-bold uppercase leading-none text-paper">No products found</h2>
                            <p className="mx-auto mt-3 max-w-[420px] text-[16px] leading-[1.5] text-paper/60">
                                {filtering
                                    ? 'No gear matches your current search or category filter. Try clearing filters.'
                                    : 'No products currently listed in the shop catalog. Check back soon!'}
                            </p>
                            {filtering ? (
                                <Button variant="outline" size="sm" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }} className="mt-6">Reset filters</Button>
                            ) : null}
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredProducts.map(p => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    onSelect={handleOpenProduct}
                                    whatsappHref={whatsappLink(siteSettings, `Hi ${siteSettings?.businessName || 'Crossbar'} Shop, is ${p.name} available for pickup today?`)}
                                />
                            ))}
                        </div>
                    )}
                </Container>
            </section>

            <HomeFooter />

            {/* ---- product detail & reserve ---- */}
            {selectedProduct ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-4" role="dialog" aria-modal="true" aria-label={selectedProduct.name}>
                    <div className="relative w-full max-w-lg overflow-hidden rounded-[22px] border border-hairline bg-panel shadow-2xl">
                        <button type="button" onClick={closeProduct} disabled={isSubmitting} aria-label="Close" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-ink/80 text-paper/70 transition-colors hover:text-paper cursor-pointer disabled:opacity-50">
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex gap-4 border-b border-hairline bg-ink p-6 pr-16">
                            {selectedProduct.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    key={selectedProduct.id}
                                    src={selectedProduct.image}
                                    alt=""
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    className="h-20 w-20 shrink-0 rounded-xl bg-moss object-cover"
                                />
                            ) : null}
                            <div className="min-w-0">
                                <div className="font-code text-[11px] uppercase tracking-[0.14em] text-neon">
                                    {selectedProduct.category || 'gear'} · Stock: {Number(selectedProduct.stock ?? 0)} units
                                </div>
                                <h2 className="mt-1.5 font-bigs text-[28px] font-bold uppercase leading-[1.05] text-paper">{selectedProduct.name}</h2>
                                <div className="mt-2 font-bigs text-[30px] font-bold leading-none text-neon">{bdt(unitPrice * quantity)}</div>
                            </div>
                        </div>

                        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
                            {confirmedReservation ? (
                                <div className="space-y-4 rounded-2xl border border-neon/40 bg-ink p-6 text-center">
                                    <CheckCircle className="mx-auto h-11 w-11 text-neon" strokeWidth={1.8} />
                                    <h3 className="font-bigs text-[28px] font-bold uppercase leading-none text-paper">Reserved for counter pickup</h3>
                                    <p className="text-[15px] leading-[1.5] text-paper/70">
                                        Show your reservation code at Crossbar reception. Pay cash, bKash or card at the desk.
                                    </p>
                                    <div className="rounded-xl border border-hairline bg-panel p-4">
                                        <div className="font-code text-[11px] uppercase tracking-[0.16em] text-paper/50">Pickup pass code</div>
                                        <div className="mt-1 font-code text-[26px] font-medium text-neon">{confirmedReservation.reservationCode}</div>
                                    </div>
                                    <Button onClick={() => setSelectedProduct(null)} className="w-full">Done</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleReserveDirect} className="space-y-5">
                                    {Array.isArray(selectedProduct.specs) && selectedProduct.specs.length > 0 ? (
                                        <ul className="space-y-2 rounded-xl border border-hairline bg-ink p-4 text-[15px] text-paper/80">
                                            {selectedProduct.specs.map((s, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5"><Check className="mt-1 h-4 w-4 shrink-0 text-neon" strokeWidth={2.4} /><span>{s}</span></li>
                                            ))}
                                        </ul>
                                    ) : null}

                                    {error ? (
                                        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-[14px] text-rose-200" role="alert">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                                            <span>{error}</span>
                                        </div>
                                    ) : null}

                                    {Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0 ? (
                                        <div>
                                            <div className="font-code text-[12px] uppercase tracking-[0.16em] text-paper/60">Select size</div>
                                            <div className="mt-2.5 flex flex-wrap gap-2">
                                                {selectedProduct.sizes.map(sz => (
                                                    <button key={sz} type="button" onClick={() => setSelectedSize(sz)} aria-pressed={selectedSize === sz} className={`rounded-xl border px-4 py-2 text-[14px] font-semibold transition-colors cursor-pointer ${selectedSize === sz ? 'border-neon bg-neon text-ink' : 'border-hairline text-paper/80 hover:border-neon/60'}`}>
                                                        {sz}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    <div>
                                        <div className="font-code text-[12px] uppercase tracking-[0.16em] text-paper/60">Quantity <span className="normal-case tracking-normal text-paper/40">(max {maxQty(selectedProduct)})</span></div>
                                        <div className="mt-2.5 inline-flex items-center gap-4 rounded-xl border border-hairline bg-ink p-1.5">
                                            <button type="button" onClick={() => setQuantity(qv => Math.max(1, qv - 1))} disabled={quantity <= 1} aria-label="Decrease" className="flex h-9 w-9 items-center justify-center rounded-lg bg-moss text-paper cursor-pointer disabled:opacity-40">
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <span className="min-w-[24px] text-center font-code text-[17px] text-paper">{quantity}</span>
                                            <button type="button" onClick={() => setQuantity(qv => Math.min(maxQty(selectedProduct), qv + 1))} disabled={quantity >= maxQty(selectedProduct)} aria-label="Increase" className="flex h-9 w-9 items-center justify-center rounded-lg bg-moss text-paper cursor-pointer disabled:opacity-40">
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t border-hairline pt-5">
                                        <div className="font-code text-[12px] uppercase tracking-[0.16em] text-neon">Pickup reservation details</div>
                                        <label className="block">
                                            <span className="text-[14px] text-paper/70">Your name *</span>
                                            <input type="text" required placeholder="e.g. Siam Chowdhury" value={customerName} onChange={e => setCustomerName(e.target.value)} className={`${inputClass} mt-1.5`} />
                                        </label>
                                        <label className="block">
                                            <span className="text-[14px] text-paper/70">Mobile number *</span>
                                            <input type="tel" required inputMode="numeric" placeholder="01XXXXXXXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className={`${inputClass} mt-1.5 font-code`} />
                                        </label>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                                        <Button variant="outline" onClick={handleAddToBag} disabled={isSubmitting || !canReserveProduct(selectedProduct)} className="flex-1">Add to bag</Button>
                                        <Button type="submit" disabled={isSubmitting || !canReserveProduct(selectedProduct)} className="flex-1">
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                            <span>{isSubmitting ? 'Reserving…' : 'Reserve for pickup'}</span>
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
