'use client';

import React from 'react';
import { useArena } from '../context/ArenaContext';
import { TicketPassModal } from './TicketPassModal';
import { SquadBuilderModal } from './SquadBuilderModal';
import { ArenaManagerModal } from './ArenaManagerModal';
import { MyPassesDrawer } from './MyPassesDrawer';

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
    handleAddManualBooking
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
          onAddManualBooking={handleAddManualBooking}
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
          onBookMore={() => {
            setShowPassesDrawer(false);
            if (typeof window !== 'undefined') {
              window.location.href = '/booking';
            }
          }}
        />
      )}
    </>
  );
};
