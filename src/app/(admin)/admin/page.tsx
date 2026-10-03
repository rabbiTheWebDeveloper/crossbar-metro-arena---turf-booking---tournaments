'use client';

import React, { useState } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { Booking } from '../../../types';
import { COURTS, VENUE_INFO } from '../../../data/initialData';
import { ShieldCheck, DollarSign, Calendar, Users, Trophy, Trash2, CheckCircle, Search, Clock, Plus, Filter, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

export default function AdminPage() {
  const {
    bookings,
    registrations,
    handleUpdateBookingStatus,
    handleCancelBooking,
    handleAddManualBooking
  } = useArena();

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
  const paidFullCount = bookings.filter(b => b.paymentStatus === 'paid_full').length;
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
      startTime: manualTime,
      endTime: `${String(endH).padStart(2, '0')}:00`,
      displayTime: `${formatH(startH)} - ${formatH(endH)}`,
      captainName: manualCaptain,
      captainPhone: manualPhone,
      teamName: manualTeam,
      playerCount: courtObj.format === '7 vs 7' ? 14 : 10,
      matchType: 'friendly',
      addOns: [],
      courtPrice: manualPrice,
      addOnsPrice: 0,
      totalPrice: manualPrice,
      paymentMethod: 'pay_at_turf',
      paymentStatus: manualPayment,
      createdAt: new Date().toISOString()
    };

    handleAddManualBooking(newB);
    setActiveTab('bookings');
    setManualTeam('');
    setManualCaptain('');
    setManualPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Master Management Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-white">
            Arena Manager Console
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Live pitch reservations, revenue tracking, payment updates, and tournament roster management.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-1 bg-slate-900 border border-white/10 rounded-2xl gap-1 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Court Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tournaments'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Tournament Teams ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab('add_slot')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add_slot'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Slot</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1218] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            ৳{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Confirmed &amp; pending payments</div>
        </div>

        <div className="bg-[#0b1218] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Reserved Slots</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {bookings.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{paidFullCount} marked Paid in Full</div>
        </div>

        <div className="bg-[#0b1218] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Tournaments Registered</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {registrations.length} Teams
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Across Super Cup &amp; Blitz</div>
        </div>

        <div className="bg-[#0b1218] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pitches Active</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            2 / 2
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Pitch Alpha &amp; Pitch Bravo</div>
        </div>
      </div>

      {/* TAB 1: Bookings Management */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bookings by team name, captain, phone number, or booking ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white text-xs sm:text-sm placeholder:text-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Bookings Table / List */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-[#0b1218] border border-white/10 rounded-2xl text-slate-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <div className="text-white font-bold text-sm">No reservations matching query</div>
              <p className="text-xs text-slate-500 mt-1">Try another keyword or create a manual booking.</p>
            </div>
          ) : (
            <div className="bg-[#0b1218] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Ref / Pitch</th>
                      <th className="py-3 px-4">Schedule</th>
                      <th className="py-3 px-4">Squad / Captain</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <span className="text-emerald-400">{b.bookingCode}</span>
                          <div className="text-[11px] text-slate-400 font-sans font-normal mt-0.5">
                            {b.courtName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{b.date}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{b.displayTime}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white uppercase">{b.teamName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{b.captainName} ({b.captainPhone})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          ৳{b.totalPrice.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={b.paymentStatus}
                            onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as Booking['paymentStatus'])}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                              b.paymentStatus === 'paid_full'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : b.paymentStatus === 'paid_advance'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            <option value="confirmed_unpaid" className="bg-slate-900 text-white">Unpaid (At Turf)</option>
                            <option value="paid_advance" className="bg-slate-900 text-white">Advance Paid</option>
                            <option value="paid_full" className="bg-slate-900 text-white">Paid in Full</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Cancel reservation for ${b.teamName}?`)) {
                                handleCancelBooking(b.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Cancel booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Tournament Registrations */}
      {activeTab === 'tournaments' && (
        <div className="bg-[#0b1218] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {registrations.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <div className="text-white font-bold text-sm">No Tournament Team Registrations Yet</div>
              <p className="text-xs text-slate-500 mt-1">Teams registering for the Super Cup or Blitz will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tournament</th>
                    <th className="py-3 px-4">Team &amp; Jersey</th>
                    <th className="py-3 px-4">Captain Contact</th>
                    <th className="py-3 px-4">Payment / TrxID</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registrations.map((r) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {r.tournamentTitle}
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.registeredAt}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-emerald-400 uppercase">{r.teamName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Jersey: {r.jerseyColor}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-semibold">{r.captainName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.captainPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="uppercase text-slate-300 font-bold">{r.paymentMethod}</span>
                        {r.transactionId && (
                          <div className="text-[11px] text-emerald-400 mt-0.5">Trx: {r.transactionId}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{r.status.toUpperCase()}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Add Manual Slot Reservation */}
      {activeTab === 'add_slot' && (
        <div className="bg-[#0b1218] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white font-display uppercase">
              Manual Turf Slot Entry
            </h2>
          </div>

          <form onSubmit={handleCreateManualBooking} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Select Pitch</label>
                <select
                  value={manualCourtId}
                  onChange={(e) => {
                    setManualCourtId(e.target.value);
                    setManualPrice(e.target.value === 'pitch-alpha' ? 3000 : 2400);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                >
                  {COURTS.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.format})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Match Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Kickoff Start Time</label>
                <input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Total Fee (BDT)</label>
                <input
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Team / Squad Name</label>
                <input
                  type="text"
                  placeholder="e.g. Uttara Thunderbolts"
                  value={manualTeam}
                  onChange={(e) => setManualTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Captain Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shakil Ahmed"
                  value={manualCaptain}
                  onChange={(e) => setManualCaptain(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Captain Phone Number</label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Payment Status</label>
                <select
                  value={manualPayment}
                  onChange={(e) => setManualPayment(e.target.value as Booking['paymentStatus'])}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500"
                >
                  <option value="paid_full">Paid in Full</option>
                  <option value="paid_advance">Paid Advance</option>
                  <option value="confirmed_unpaid">Unpaid (Pay at Turf)</option>
                </select>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:from-emerald-400 hover:to-green-400 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Confirm &amp; Record Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
