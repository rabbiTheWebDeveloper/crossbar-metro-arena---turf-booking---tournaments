'use client';
import React, { useState } from 'react';
import { ShoppingBag, MessageSquare } from 'lucide-react';
import { bdt } from './slots';

/** A product can be reserved while it is visible and has stock. */
export const canReserveProduct = (p) => !!p && p.visible !== false && Number(p.stock ?? 0) > 0;

/** { price, regular, saving }: what is charged, and the struck-through regular price when it is on sale. */
export function productPricing(p) {
    const regular = Number(p?.price) || 0;
    const sale = Number(p?.salePrice) || 0;
    const onSale = sale > 0 && sale < regular;
    return { price: onSale ? sale : regular, regular: onSale ? regular : 0, saving: onSale ? regular - sale : 0 };
}

/**
 * Shop product card in the main site design: photo, category and stock, name, sizes, price
 * (with the regular price struck through when on sale) and the reserve action.
 *   onSelect(product): primary action       actionLabel: its label when the product is in stock
 *   whatsappHref: optional "ask on WhatsApp" link        compact: tighter card for 4-up rows
 */
export function ProductCard({ product, onSelect, actionLabel = 'Select & reserve', whatsappHref, compact = false }) {
    const [imageFailed, setImageFailed] = useState(false);
    const inStock = canReserveProduct(product);
    const { price, regular, saving } = productPricing(product);
    const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
    const stock = Number(product.stock ?? 0);
    const lowStock = inStock && stock <= 5;

    return (
        <article className={`group flex h-full flex-col overflow-hidden rounded-[22px] border border-hairline bg-panel transition-colors duration-200 hover:border-neon/60 ${inStock ? '' : 'opacity-70'}`}>
            {/* The photo is taken out of flow so a tall picture cannot stretch the frame past its ratio. */}
            <div className={`relative shrink-0 overflow-hidden bg-moss ${compact ? 'aspect-[4/3]' : 'aspect-[5/4]'}`}>
                {product.image && !imageFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImageFailed(true)}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-paper/25" aria-hidden="true">
                        <ShoppingBag className="h-12 w-12" strokeWidth={1.4} />
                    </span>
                )}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-panel to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    {product.badge
                        ? <span className="rounded-md bg-neon px-2 py-1 font-code text-[11px] uppercase tracking-[0.08em] text-ink">{product.badge}</span>
                        : <span />}
                    <span className={`rounded-md px-2 py-1 font-code text-[11px] uppercase tracking-[0.08em] backdrop-blur-sm ${inStock ? (lowStock ? 'bg-ink/80 text-ember' : 'bg-ink/80 text-paper/85') : 'bg-ink/85 text-paper/55'}`}>
                        {inStock ? (lowStock ? `Only ${stock} left` : `${stock} in stock`) : 'Out of stock'}
                    </span>
                </div>
            </div>

            <div className={`flex flex-1 flex-col ${compact ? 'p-5' : 'p-6'}`}>
                <div className="font-code text-[11px] uppercase tracking-[0.16em] text-neon">{product.category || 'Gear'}</div>
                <h3 className={`mt-2 font-bigs font-bold uppercase leading-[1.05] text-paper line-clamp-2 ${compact ? 'text-[24px]' : 'text-[28px]'}`}>{product.name}</h3>
                {product.description ? <p className="mt-2.5 text-[15px] leading-[1.5] text-paper/60 line-clamp-2">{product.description}</p> : null}

                {sizes.length > 0 && !compact ? (
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Available sizes">
                        {sizes.slice(0, 5).map(size => (
                            <li key={size} className="rounded-md border border-hairline px-2 py-1 font-code text-[11px] tracking-[0.04em] text-paper/75">{size}</li>
                        ))}
                        {sizes.length > 5 ? <li className="px-1 py-1 font-code text-[11px] text-paper/50">+{sizes.length - 5}</li> : null}
                    </ul>
                ) : null}

                <div className="mt-auto pt-6">
                    {regular > 0 ? (
                        <div className="mb-1 flex flex-wrap items-center gap-2 font-code text-[13px] text-paper/50">
                            <s>{bdt(regular)}</s>
                            <span className="rounded bg-neon/15 px-1.5 py-0.5 text-[11px] text-neon">Save {bdt(saving)}</span>
                        </div>
                    ) : null}
                    <div className={`font-bigs font-bold leading-none text-neon ${compact ? 'text-[36px]' : 'text-[44px]'}`}>{bdt(price)}</div>

                    <div className="mt-5 flex items-stretch gap-2">
                        <button
                            type="button"
                            disabled={!inStock}
                            onClick={() => onSelect(product)}
                            className="flex h-[48px] flex-1 items-center justify-center rounded-xl bg-neon px-4 text-[15px] font-semibold text-ink transition-colors hover:bg-neon-dim active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:bg-moss disabled:text-paper/45"
                        >
                            {inStock ? actionLabel : 'Out of stock'}
                        </button>
                        {whatsappHref ? (
                            <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ask on WhatsApp"
                                aria-label={`Ask about ${product.name} on WhatsApp`}
                                className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl border border-hairline text-paper/80 transition-colors hover:border-neon/60 hover:text-neon"
                            >
                                <MessageSquare className="h-[18px] w-[18px]" />
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        </article>
    );
}
