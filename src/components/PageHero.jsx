import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
const accents = {
    emerald: {
        pill: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        glow: 'bg-emerald-500/15',
        glow2: 'bg-green-500/10',
        grad: 'text-gradient',
        icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
    },
    amber: {
        pill: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        glow: 'bg-amber-500/15',
        glow2: 'bg-orange-500/10',
        grad: 'text-gradient-gold',
        icon: 'text-amber-400 bg-amber-500/10 border-amber-500/25'
    }
};
export const PageHero = ({ eyebrow, eyebrowIcon: EyebrowIcon, title, highlight, description, crumb, accent = 'emerald', stats, actions }) => {
    const a = accents[accent];
    return (<section className="relative overflow-hidden border-b border-white/5">
      <div className={`absolute -top-24 left-[10%] w-[420px] h-[280px] ${a.glow} rounded-full blur-[110px] pointer-events-none`}/>
      <div className={`absolute -top-20 right-[8%] w-[380px] h-[260px] ${a.glow2} rounded-full blur-[110px] pointer-events-none`}/>
      <div className="absolute inset-0 pitch-grid pointer-events-none"/>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-12 sm:pb-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="page-enter flex items-center gap-1.5 text-xs text-slate-500 mb-5">
          <Link href="/" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
            <Home className="w-3.5 h-3.5"/>
            <span>Arena</span>
          </Link>
          <ChevronRight className="w-3 h-3"/>
          <span className="text-slate-300 font-medium">{crumb}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl page-enter-2">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] mb-4 ${a.pill}`}>
              <EyebrowIcon className="w-3.5 h-3.5"/>
              <span>{eyebrow}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display uppercase tracking-tight leading-[1.02] text-white">
              {title}{' '}
              {highlight && <span className={a.grad}>{highlight}</span>}
            </h1>

            <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
              {description}
            </p>

            {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
          </div>

          {stats && stats.length > 0 && (<div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[360px] page-enter-3">
              {stats.map((s) => {
                const Icon = s.icon;
                return (<div key={s.label} className="glass rounded-2xl p-4">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${a.icon}`}>
                      <Icon className="w-4.5 h-4.5"/>
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">{s.label}</div>
                    <div className="text-lg sm:text-xl font-black text-white font-display mt-0.5">{s.value}</div>
                  </div>);
            })}
            </div>)}
        </div>
      </div>
    </section>);
};
