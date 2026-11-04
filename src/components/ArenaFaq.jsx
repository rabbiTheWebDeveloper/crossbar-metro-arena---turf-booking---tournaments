import React from 'react';
import Link from 'next/link';

/**
 * Accessible, crawlable FAQ block built on native <details>. No client JS, so the answers are in the
 * server HTML that Googlebot reads, which is required for the matching FAQPage JSON-LD.
 */
export function ArenaFaq({ items = [], eyebrow = 'Good to know', title = 'Frequently asked questions', intro, ctaHref = '/booking', ctaLabel = 'Book a slot' }) {
    if (!items.length) return null;
    return (<section aria-labelledby="arena-faq-title" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{eyebrow}</span>
            <h2 id="arena-faq-title" className="text-2xl sm:text-3xl font-black uppercase text-white font-display mt-1">{title}</h2>
            {intro && <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl">{intro}</p>}
          </div>
          {ctaHref && (<Link href={ctaHref} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/20 self-start sm:self-auto">
              {ctaLabel}
            </Link>)}
        </div>
        <div className="divide-y divide-white/10">
          {items.map((item, i) => (<details key={i} className="group py-3" open={i === 0}>
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none text-sm sm:text-base font-bold text-white hover:text-emerald-300 transition-colors">
                <span>{item.q}</span>
                <span aria-hidden="true" className="shrink-0 mt-0.5 w-6 h-6 rounded-full border border-white/15 flex items-center justify-center text-emerald-400 text-base leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-2 pr-10 text-xs sm:text-sm text-slate-300 leading-relaxed">{item.a}</p>
            </details>))}
        </div>
      </div>
    </section>);
}

export default ArenaFaq;
