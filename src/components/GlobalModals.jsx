'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { useArena } from '../context/ArenaContext';
import { MobileBottomNav } from './MobileBottomNav';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// Modals are loaded only when first opened, keeping them out of the initial bundle of every page.
const TicketPassModal = dynamic(() => import('./TicketPassModal').then(m => m.TicketPassModal), { ssr: false });
const SquadBuilderModal = dynamic(() => import('./SquadBuilderModal').then(m => m.SquadBuilderModal), { ssr: false });
const MyPassesDrawer = dynamic(() => import('./MyPassesDrawer').then(m => m.MyPassesDrawer), { ssr: false });
const InstallAppModal = dynamic(() => import('./InstallAppModal').then(m => m.InstallAppModal), { ssr: false });
const AuthModal = dynamic(() => import('./AuthModal').then(m => m.AuthModal), { ssr: false });
const SSLCommerzModal = dynamic(() => import('./SSLCommerzModal').then(m => m.SSLCommerzModal), { ssr: false });
const ShopCartDrawer = dynamic(() => import('./ShopCartDrawer').then(m => m.ShopCartDrawer), { ssr: false });
const HandoverGuideModal = dynamic(() => import('./HandoverGuideModal').then(m => m.HandoverGuideModal), { ssr: false });

const noticeStyles = {
    success: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
    error: 'border-rose-500/40 bg-rose-950/90 text-rose-100',
    info: 'border-sky-500/40 bg-sky-950/90 text-sky-100'
};
const NoticeIcon = ({ type }) => (type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/> : type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0"/> : <Info className="w-4 h-4 text-sky-400 shrink-0"/>);

export const GlobalModals = () => {
    const {
        myBookings, activeTicketPass, setActiveTicketPass, showSquadModal, setShowSquadModal,
        showPassesDrawer, setShowPassesDrawer, showInstallModal, showAuthModal, showSSLCommerzModal,
        showCartDrawer, showHandoverGuide, notice, setNotice
    } = useArena();

    return (<>
      {activeTicketPass && (<TicketPassModal booking={activeTicketPass} onClose={() => setActiveTicketPass(null)}/>)}
      {showSquadModal && (<SquadBuilderModal onClose={() => setShowSquadModal(false)}/>)}
      {showPassesDrawer && (<MyPassesDrawer bookings={myBookings} onClose={() => setShowPassesDrawer(false)} onSelectBooking={(b) => { setShowPassesDrawer(false); setActiveTicketPass(b); }} onBookMore={() => setShowPassesDrawer(false)}/>)}
      {showInstallModal && <InstallAppModal />}
      {showAuthModal && <AuthModal />}
      {showSSLCommerzModal && <SSLCommerzModal />}
      {showCartDrawer && <ShopCartDrawer />}
      {showHandoverGuide && <HandoverGuideModal />}

      {/* Global toast for success / error feedback from any action */}
      {notice && (<div role="status" aria-live="polite" className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-[70] w-[min(92vw,420px)] animate-in fade-in">
        <div className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-sm ${noticeStyles[notice.type] || noticeStyles.info}`}>
          <NoticeIcon type={notice.type}/>
          <span className="flex-1 leading-snug">{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100 cursor-pointer" aria-label="Dismiss"><X className="w-4 h-4"/></button>
        </div>
      </div>)}

      <MobileBottomNav />
    </>);
};
