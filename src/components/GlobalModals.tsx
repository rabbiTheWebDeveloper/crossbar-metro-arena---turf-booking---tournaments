'use client';

import React from 'react';
import { useArena } from '../context/ArenaContext';
import { TicketPassModal } from './TicketPassModal';
import { SquadBuilderModal } from './SquadBuilderModal';
import { ArenaManagerModal } from './ArenaManagerModal';
import { MyPassesDrawer } from './MyPassesDrawer';
import { InstallAppModal } from './InstallAppModal';
import { AuthModal } from './AuthModal';
import { SSLCommerzModal } from './SSLCommerzModal';
import { ShopCartDrawer } from './ShopCartDrawer';
import { HandoverGuideModal } from './HandoverGuideModal';
import { MobileBottomNav } from './MobileBottomNav';

export const GlobalModals: React.FC = () => {
  const {
    bookings,
    registrations,
    activeTicketPass,
    setActiveTicketPass,
    showSquadModal,
    setShowSquadModal,
    showAdminModal,
    setShowAdminModal,
    showPassesDrawer,
    setShowPassesDrawer,
    handleUpdateBookingStatus,
    handleCancelBooking,
    handleBookingSuccess
  } = useArena();

  return (
    <>
      {/* Digital Ticket Pass Modal */}
      {activeTicketPass && (
        <TicketPassModal
          booking={activeTicketPass}
          onClose={() => setActiveTicketPass(null)}
        />
      )}

      {/* Squad Lineup Builder Modal */}
      {showSquadModal && (
        <SquadBuilderModal
          onClose={() => setShowSquadModal(false)}
        />
      )}

      {/* Arena Staff / Manager Modal */}
      {showAdminModal && (
        <ArenaManagerModal
          bookings={bookings}
          registrations={registrations}
          onClose={() => setShowAdminModal(false)}
          onUpdateBookingStatus={handleUpdateBookingStatus}
          onCancelBooking={handleCancelBooking}
          onAddManualBooking={handleBookingSuccess}
        />
      )}

      {/* Passes Drawer */}
      {showPassesDrawer && (
        <MyPassesDrawer
          bookings={bookings}
          onClose={() => setShowPassesDrawer(false)}
          onSelectBooking={(b) => {
            setShowPassesDrawer(false);
            setActiveTicketPass(b);
          }}
          onBookMore={() => setShowPassesDrawer(false)}
        />
      )}

      {/* Install Mobile / PWA App Modal */}
      <InstallAppModal />

      {/* User Authentication & Role Switcher Modal */}
      <AuthModal />

      {/* SSLCommerz Online Payment Gateway Simulation Modal */}
      <SSLCommerzModal />

      {/* Shop Cart Drawer */}
      <ShopCartDrawer />

      {/* Handover & Admin Operational Guide Modal */}
      <HandoverGuideModal />

      {/* Fixed Mobile Bottom Tab Bar (Home, Match Day, Book, Shop, Me) */}
      <MobileBottomNav />
    </>
  );
};
