'use client';

import React, { useState } from 'react';
import { Booking, TournamentRegistration } from '../types';
import { COURTS, VENUE_INFO } from '../data/initialData';
import { X, ShieldCheck, DollarSign, Calendar, Users, Trophy, Trash2, CheckCircle, Search, Clock, Plus, Filter, Phone } from 'lucide-react';

interface ArenaManagerModalProps {
  bookings: Booking[];
  registrations: TournamentRegistration[];
  onClose: () => void;
  onUpdateBookingStatus: (id: string, status: Booking['paymentStatus']) => void;
  onCancelBooking: (id: string) => void;
  onAddManualBooking: (booking: Booking) => void;
}

export const ArenaManagerModal: React.FC<ArenaManagerModalProps> = ({
  bookings,
  registrations,
  onClose,
  onUpdateBookingStatus,
  onCancelBooking,
  onAddManualBooking
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'tournaments' | 'add_slot'>('bookings');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual booking form state
  const [manualCourtId, setManualCourtId] = useState('pitch-alpha');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('19:00');
  const [manualTeam, setManualTeam] = useState('');
  const [manualCaptain, setManualCaptain] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualPrice, setManualPrice] = useState(3000);
  const [manualPayment, setManualPayment] = useState<Booking['paymentStatus']>('paid_full');

  // Stats calculation
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalHours = bookings.length;
  const filteredBookings = bookings.filter(b =>
    b.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.captainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.captainPhone.includes(searchQuery) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTeam || !manualCaptain || !manualPhone) return;

    const startH = parseInt(manualTime.split(':')[0], 10);
    const endH = (startH + 1) % 24;
    const formatH = (h: number) => {
      const isPm = h >= 12 && h < 24;
      const num = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${String(num).padStart(2, '0')}:00 ${isPm ? 'PM' : 'AM'}`;
    };

    const courtObj = COURTS.find(c => c.id === manualCourtId) || COURTS[0];

    const newB: Booking = {
      id: `manual-${Date.now()}`,
      bookingCode: `CMA-${Math.floor(1000 + Math.random() * 9000)}`,
      courtId: manualCourtId,
      courtName: courtObj.name,
      date: manualDate,
      startTime: `${String(startH).padStart(2, '0')}:00`,
      endTime: `${String(endH).padStart(2, '0')}:00`,
      displayTime: `${formatH(startH)} - ${formatH(endH)}`,
      captainName: manualCaptain,
      captainPhone: manualPhone,
      teamName: manualTeam,
      playerCount: 14,
      matchType: 'friendly',
      addOns: [],
      courtPrice: manualPrice,
      addOnsPrice: 0,
      totalPrice: manualPrice,
      paymentMethod: 'pay_at_turf',
      paymentStatus: manualPayment,
      createdAt: new Date().toISOString()
    };

    onAddManualBooking(newB);
    setActiveTab('bookings');
    setManualTeam('');
    setManualCaptain('');
    setManualPhone('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0c131a] border border-white/15 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#101923] to-[#0c131a] p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Arena Staff & Venue Operations
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display uppercase">
                Crossbar Metro Management Dashboard
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 sm:px-6 bg-black/30 border-b border-white/5">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-[11px] text-slate-400 uppercase">Confirmed Bookings</div>
            <div className="text-2xl font-bold font-mono text-white mt-0.5">{bookings.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-[11px] text-slate-400 uppercase">Booked Revenue</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">৳{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-[11px] text-slate-400 uppercase">Tournament Squads</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">{registrations.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-[11px] text-slate-400 uppercase">Venue Status</div>
            <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Turf Active</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 border-b border-white/10 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'bookings'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Slot Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'tournaments'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Tournament Entries ({registrations.length})
            </button>
            <button
              onClick={() => setActiveTab('add_slot')}
              className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'add_slot'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              + Manual Walk-in / Lock Slot
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: Slot Bookings */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by team, captain, phone or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No bookings found matching query.
                </div>
              ) : (
                <>
                  {/* Mobile Cards View (< md) */}
                  <div className="md:hidden space-y-2.5">
                    {filteredBookings.map((b) => (
                      <div key={b.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-emerald-400">{b.bookingCode}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.paymentStatus === 'paid_full'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : b.paymentStatus === 'paid_advance'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {b.paymentStatus === 'paid_full' ? 'Paid' : b.paymentStatus === 'paid_advance' ? 'Advance' : 'Due At Turf'}
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-white text-sm">{b.teamName}</div>
                          <div className="text-slate-400 text-xs">{b.captainName} · <a href={`tel:${b.captainPhone}`} className="text-emerald-400 underline">{b.captainPhone}</a></div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5">
                          <div>
                            <span className="text-slate-400">{b.date} · </span>
                            <span className="text-white font-medium">{b.displayTime}</span>
                          </div>
                          <div className="font-mono font-bold text-emerald-400">
                            ৳{b.totalPrice.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400">{b.courtName}</span>
                          <div className="flex gap-1.5">
                            {b.paymentStatus !== 'paid_full' && (
                              <button
                                onClick={() => onUpdateBookingStatus(b.id, 'paid_full')}
                                className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black font-semibold text-[10px]"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => onCancelBooking(b.id)}
                              className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (>= md) */}
                  <div className="hidden md:block overflow-x-auto border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/[0.03] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                        <tr>
                          <th className="p-3">Code</th>
                          <th className="p-3">Date & Time</th>
                          <th className="p-3">Pitch</th>
                          <th className="p-3">Squad / Captain</th>
                          <th className="p-3">Contact</th>
                          <th className="p-3">Total Due</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-white/[0.02]">
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              {b.bookingCode}
                            </td>
                            <td className="p-3">
                              <div className="text-white font-medium">{b.date}</div>
                              <div className="text-[11px] text-slate-400">{b.displayTime}</div>
                            </td>
                            <td className="p-3 text-slate-300">
                              {b.courtName}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-white">{b.teamName}</div>
                              <div className="text-slate-400 text-[11px]">{b.captainName}</div>
                            </td>
                            <td className="p-3 text-slate-300 font-mono">
                              {b.captainPhone}
                            </td>
                            <td className="p-3 font-mono font-bold text-white">
                              ৳{b.totalPrice.toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                b.paymentStatus === 'paid_full'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : b.paymentStatus === 'paid_advance'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {b.paymentStatus === 'paid_full' ? 'Paid' : b.paymentStatus === 'paid_advance' ? 'Advance' : 'Due At Turf'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1">
                              {b.paymentStatus !== 'paid_full' && (
                                <button
                                  onClick={() => onUpdateBookingStatus(b.id, 'paid_full')}
                                  className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-black font-semibold text-[10px] transition-colors"
                                  title="Mark Paid"
                                >
                                  Mark Paid
                                </button>
                              )}
                              <button
                                onClick={() => onCancelBooking(b.id)}
                                className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
                                title="Cancel / Delete Booking"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Tournaments */}
          {activeTab === 'tournaments' && (
            <div className="space-y-4">
              {registrations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No tournament entries registered yet. Teams registering online will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-amber-400">
                          {reg.tournamentTitle}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Roster Registered
                        </span>
                      </div>
                      <div className="text-base font-bold text-white font-display">
                        {reg.teamName}
                      </div>
                      <div className="text-xs text-slate-300">
                        Captain: <strong>{reg.captainName}</strong> ({reg.captainPhone})
                      </div>
                      <div className="text-xs text-slate-400">
                        Jersey: {reg.jerseyColor} · Pay: {reg.paymentMethod.toUpperCase()} {reg.transactionId ? `(Trx: ${reg.transactionId})` : ''}
                      </div>
                      <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400">
                        <strong>Roster ({reg.playersList.length} players):</strong>
                        <div className="line-clamp-2 mt-1 font-mono text-[10px]">
                          {reg.playersList.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Add Manual Walk-in */}
          {activeTab === 'add_slot' && (
            <form onSubmit={handleCreateManualBooking} className="max-w-lg mx-auto space-y-4 text-xs">
              <div className="text-slate-300">
                Quickly add a walk-in match, cash customer, or block off a court slot for private events.
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Pitch</label>
                <select
                  value={manualCourtId}
                  onChange={(e) => setManualCourtId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs"
                >
                  {COURTS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Match Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Hour</label>
                  <select
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs"
                  >
                    {Array.from({ length: 20 }).map((_, i) => {
                      const h = (i + 6) % 24;
                      const str = `${String(h).padStart(2, '0')}:00`;
                      return <option key={str} value={str}>{str}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Squad Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uttara Walk-in 7s"
                    value={manualTeam}
                    onChange={(e) => setManualTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Captain Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shakil"
                    value={manualCaptain}
                    onChange={(e) => setManualCaptain(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01796-337133"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slot Fee (BDT)</label>
                  <input
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Status</label>
                <select
                  value={manualPayment}
                  onChange={(e) => setManualPayment(e.target.value as Booking['paymentStatus'])}
                  className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs"
                >
                  <option value="paid_full">Paid in Full (Cash / Counter)</option>
                  <option value="confirmed_unpaid">Due at Turf Counter</option>
                  <option value="paid_advance">Advance Received</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                Confirm Walk-in Reservation
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
