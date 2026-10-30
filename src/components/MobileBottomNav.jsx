'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useArena } from '../context/ArenaContext';
import { Home, Trophy, Calendar, ShoppingBag, User } from 'lucide-react';

export const MobileBottomNav = () => {
    const pathname = usePathname() || '/';
    const { isVisitor, isAdmin, isInvestor, setShowAuthModal, setAuthModalInitialTab } = useArena();
    if (pathname.startsWith('/investor') || pathname.startsWith('/admin')) {
        return null;
    }
    const meHref = isAdmin ? '/admin' : isInvestor ? '/investor' : '/player';
    const navItems = [
        { label: 'Home', href: '/', icon: Home, isActive: pathname === '/' },
        { label: 'Match Day', href: '/results', icon: Trophy, isActive: pathname === '/results' || pathname === '/matches' },
        { label: 'Book', href: '/booking', icon: Calendar, isActive: pathname === '/booking', highlight: true },
        { label: 'Shop', href: '/shop', icon: ShoppingBag, isActive: pathname === '/shop' },
        {
            label: isVisitor ? 'Login' : 'Me',
            href: meHref,
            icon: User,
            isActive: pathname.startsWith('/player') || pathname.startsWith('/admin') || pathname.startsWith('/investor'),
            action: isVisitor ? () => { setAuthModalInitialTab('login'); setShowAuthModal(true); } : undefined
        }
    ];
    return (<nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070b0f]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 safe-area-pb">
      <div className="grid grid-cols-5 items-center justify-around">
        {navItems.map((item) => {
            const Icon = item.icon;
            if (item.action) {
                return (<button key={item.label} type="button" onClick={item.action} className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer">
                <Icon className="w-5 h-5 mb-0.5"/>
                <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
              </button>);
            }
            if (item.highlight) {
                return (<Link key={item.label} href={item.href} className="flex flex-col items-center justify-center -mt-3.5" aria-current={item.isActive ? 'page' : undefined}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${item.isActive
                        ? 'bg-emerald-400 text-slate-950 shadow-emerald-500/40'
                        : 'bg-emerald-500 text-slate-950 shadow-emerald-500/25'}`}>
                  <Icon className="w-5 h-5 stroke-[2.5]"/>
                </div>
                <span className="text-[11px] font-black text-emerald-400 tracking-tight mt-0.5">{item.label}</span>
              </Link>);
            }
            return (<Link key={item.label} href={item.href} aria-current={item.isActive ? 'page' : undefined} className={`flex flex-col items-center justify-center py-1 transition-colors ${item.isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
              <Icon className="w-5 h-5 mb-0.5 stroke-[1.8]"/>
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>);
        })}
      </div>
    </nav>);
};
