'use client';
import React from 'react';
import { VENUE_INFO } from '../data/initialData';
import { MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';
export const FloatingWhatsApp = () => {
    const pathname = usePathname();
    if (pathname?.startsWith('/investor') || pathname?.startsWith('/admin')) {
        return null;
    }
    return (<aside aria-label="Support chat" className="fixed bottom-6 right-6 z-40">
      <a href={VENUE_INFO.whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black text-xs uppercase tracking-wider shadow-2xl shadow-[#25D366]/40 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 group" title="Chat on WhatsApp">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <MessageSquare className="w-4 h-4 fill-slate-950 text-slate-950"/>
        <span className="hidden sm:inline font-display text-sm tracking-normal font-bold">Turf WhatsApp</span>
      </a>
    </aside>);
};
