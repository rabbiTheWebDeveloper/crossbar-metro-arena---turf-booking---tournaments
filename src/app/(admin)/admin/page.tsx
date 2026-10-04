'use client';

import React, { useState, useMemo } from 'react';
import { useArena } from '../../../context/ArenaContext';
import { Booking, ExpenseRecord, InvestorRecord, PricingConfig } from '../../../types';
import { COURTS, SCHEDULE_SLOTS_DEFINITION, VENUE_INFO } from '../../../data/initialData';
import { PageHero } from '../../../components/PageHero';
import {
  ShieldCheck,
  DollarSign,
  Calendar,
  Users,
  Trophy,
  Trash2,
  CheckCircle,
  Search,
  Clock,
  Plus,
  Filter,
  Phone,
  Settings,
  CreditCard,
  Download,
  AlertTriangle,
  Receipt,
  Tag,
  Store,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function AdminPage() {
  const {
    bookings,
    pricing,
    expenses,
    investors,
    shopReservations,
    tournaments,
    registrations,
    grossRevenue,
    totalExpenses,
    netProfit,
    isLossMonth,
    handleBookingSuccess,
    handleUpdateBookingStatus,
    handleCancelBooking,
    handleSavePricing,
    handleAddExpense,
    handleDeleteExpense,
    handleSaveInvestors,
    handleUpdateShopReservationStatus,
    exportDatabaseBackup
  } = useArena();

  const [activeTab, setActiveTab] = useState<'today' | 'walkin' | 'expenses' | 'profit' | 'pricing' | 'investors' | 'shop'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedRadarDate, setSelectedRadarDate] = useState<string>(todayStr);

  // Walk-in booking state
  const [walkinCourtId, setWalkinCourtId] = useState('pitch-alpha');
  const [walkinDate, setWalkinDate] = useState(todayStr);
  const [walkinSlotNum, setWalkinSlotNum] = useState<number>(10);
  const [walkinTeam, setWalkinTeam] = useState('');
  const [walkinCaptain, setWalkinCaptain] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinPrice, setWalkinPrice] = useState<number>(3200);
  const [walkinPaymentStatus, setWalkinPaymentStatus] = useState<Booking['paymentStatus']>('paid_full');

  // Expense form state
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('turf_maintenance');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(1500);
  const [expDate, setExpDate] = useState(todayStr);
  const [expNote, setExpNote] = useState('');

  // Pricing edit state
  const [pricingForm, setPricingForm] = useState<PricingConfig>(pricing);
  const [pricingSavedToast, setPricingSavedToast] = useState(false);

  // Investor edit state
  const [investorList, setInvestorList] = useState<InvestorRecord[]>(investors);
  const [newInvestorName, setNewInvestorName] = useState('');
  const [newInvestorShare, setNewInvestorShare] = useState<number>(10);
  const [investorSavedToast, setInvestorSavedToast] = useState(false);

  // Cash collection modal / state
  const [collectingBookingId, setCollectingBookingId] = useState<string | null>(null);
  const [collectedCash, setCollectedCash] = useState<number>(0);

  // Today's 12 slots radar mapping
  const radarSlots = useMemo(() => {
    return SCHEDULE_SLOTS_DEFINITION.map(slotDef => {
      const bAlpha = bookings.find(b => b.courtId === 'pitch-alpha' && b.date === selectedRadarDate && b.slotNumber === slotDef.slotNumber);
      const bBravo = bookings.find(b => b.courtId === 'pitch-bravo' && b.date === selectedRadarDate && b.slotNumber === slotDef.slotNumber);
      return {
        ...slotDef,
        pitchAlpha: bAlpha,
        pitchBravo: bBravo
      };
    });
  }, [bookings, selectedRadarDate]);

  // Handle Walk-in Submission
  const handleCreateWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinTeam.trim() || !walkinCaptain.trim() || !walkinPhone.trim()) return;

    const slotDef = SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === walkinSlotNum) || SCHEDULE_SLOTS_DEFINITION[0];
    const court = COURTS.find(c => c.id === walkinCourtId) || COURTS[0];

    const advance = walkinPaymentStatus === 'paid_full' ? walkinPrice : 500;
    const due = Math.max(0, walkinPrice - advance);

    const newB: Booking = {
      id: `walkin-${Date.now()}`,
      bookingCode: `CMA-${Math.floor(1000 + Math.random() * 9000)}`,
      courtId: court.id,
      courtName: court.name,
      date: walkinDate,
      slotNumber: slotDef.slotNumber,
      startTime: slotDef.startTime,
      endTime: slotDef.endTime,
      displayTime: slotDef.displayTime,
      captainName: walkinCaptain.trim(),
      captainPhone: walkinPhone.trim(),
      teamName: walkinTeam.trim(),
      playerCount: court.format === '7 vs 7' ? 14 : 10,
      matchType: 'friendly',
      addOns: [],
      courtPrice: walkinPrice,
      addOnsPrice: 0,
      totalPrice: walkinPrice,
      paymentType: walkinPaymentStatus === 'paid_full' ? 'full_payment' : 'advance_500',
      advanceAmount: advance,
      dueAmount: due,
      paymentMethod: 'pay_at_turf',
      paymentStatus: walkinPaymentStatus,
      notes: 'Counter Walk-in Booking',
      createdAt: new Date().toISOString()
    };

    handleBookingSuccess(newB);
    setWalkinTeam('');
    setWalkinCaptain('');
    setWalkinPhone('');
    setActiveTab('today');
  };

  // Handle Expense Add
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) return;

    const newExp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      category: expCategory,
      title: expTitle.trim(),
      amount: expAmount,
      date: expDate,
      receiptNote: expNote.trim(),
      recordedBy: 'Admin Abid'
    };

    handleAddExpense(newExp);
    setExpTitle('');
    setExpAmount(1500);
    setExpNote('');
  };

  // Handle Pricing Save
  const handleSavePricingConfig = (e: React.FormEvent) => {
    e.preventDefault();
    handleSavePricing(pricingForm);
    setPricingSavedToast(true);
    setTimeout(() => setPricingSavedToast(false), 3000);
  };

  // Handle Investor Save
  const handleSaveInvestorConfig = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveInvestors(investorList);
    setInvestorSavedToast(true);
    setTimeout(() => setInvestorSavedToast(false), 3000);
  };

  const handleAddNewInvestor = () => {
    if (!newInvestorName.trim()) return;
    if (investorList.length >= 10) {
      alert('Maximum 10 investors allowed as per the brief.');
      return;
    }
    const newInv: InvestorRecord = {
      id: `inv-${Date.now()}`,
      name: newInvestorName.trim(),
      email: `${newInvestorName.toLowerCase().replace(/\s+/g, '')}@investor.bd`,
      phone: '01700-000000',
      sharePercentage: newInvestorShare,
      capitalInvested: 1000000,
      joinedDate: new Date().toISOString().split('T')[0],
      payoutsPaid: 0
    };
    setInvestorList([...investorList, newInv]);
    setNewInvestorName('');
  };

  const totalSharePercentage = investorList.reduce((sum, inv) => sum + inv.sharePercentage, 0);

  // Filtered bookings
  const filteredBookings = bookings.filter(b =>
    b.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.captainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.captainPhone.includes(searchQuery) ||
    b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHero
        crumb="Arena Administration"
        eyebrow="Owners & Staff Control Center"
        eyebrowIcon={ShieldCheck}
        title="Admin"
        highlight="Panel"
        description="Run everything from one unified console: today's 12-slot radar, walk-in bookings, balance collection, expense tracking, monthly net profit, dynamic pricing, and investor share setup."
        stats={[
          { label: 'Gross Income', value: `৳${grossRevenue.toLocaleString()}`, icon: DollarSign },
          { label: 'Expenses', value: `৳${totalExpenses.toLocaleString()}`, icon: Receipt },
          { label: 'Net Profit', value: `৳${netProfit.toLocaleString()}`, icon: TrendingUp },
          { label: 'Investors', value: `${investors.length}/10 Active`, icon: Users }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Top Action Bar: Backup & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b md:border-b-0 border-white/10">
            {[
              { id: 'today', label: "Today's Bookings Radar", icon: Clock },
              { id: 'walkin', label: 'Walk-In Booking', icon: Plus },
              { id: 'expenses', label: 'Expense Tracker', icon: Receipt },
              { id: 'profit', label: 'Monthly Profit Report', icon: TrendingUp },
              { id: 'pricing', label: 'Pricing Engine', icon: Tag },
              { id: 'investors', label: 'Investor Equity %', icon: Percent },
              { id: 'shop', label: 'Shop & Counter Holds', icon: Store }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={exportDatabaseBackup}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/15 hover:border-emerald-500/40 text-emerald-400 font-bold text-xs uppercase transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Daily JSON Backup</span>
          </button>
        </div>

        {/* Tab 1: Today's Bookings Radar */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  12 Daily 90-Min Slots Radar
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Date:</span>
                <input
                  type="date"
                  value={selectedRadarDate}
                  onChange={e => setSelectedRadarDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Radar Grid: 12 Slots Timeline */}
            <div className="space-y-3">
              {radarSlots.map(slot => (
                <div
                  key={slot.slotNumber}
                  className="p-4 rounded-xl bg-slate-900/60 border border-white/10 grid grid-cols-1 md:grid-cols-4 items-center gap-3 text-xs"
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                      Slot #{slot.slotNumber} · 90 Min
                    </span>
                    <div className="font-mono text-sm font-bold text-white mt-1">
                      {slot.displayTime}
                    </div>
                  </div>

                  {/* Pitch Alpha Status */}
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] font-semibold text-slate-400 mb-1">Pitch Alpha (7v7)</div>
                    {slot.pitchAlpha ? (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white line-clamp-1">{slot.pitchAlpha.teamName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          slot.pitchAlpha.paymentStatus === 'paid_full' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {slot.pitchAlpha.paymentStatus === 'paid_full' ? 'PAID' : 'ADV'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-medium">Free Slot</span>
                    )}
                  </div>

                  {/* Pitch Bravo Status */}
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] font-semibold text-slate-400 mb-1">Pitch Bravo (5v5)</div>
                    {slot.pitchBravo ? (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white line-clamp-1">{slot.pitchBravo.teamName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          slot.pitchBravo.paymentStatus === 'paid_full' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {slot.pitchBravo.paymentStatus === 'paid_full' ? 'PAID' : 'ADV'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-medium">Free Slot</span>
                    )}
                  </div>

                  {/* Action quick buttons */}
                  <div className="flex items-center justify-end gap-2">
                    {slot.pitchAlpha && slot.pitchAlpha.paymentStatus !== 'paid_full' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateBookingStatus(slot.pitchAlpha!.id, 'paid_full');
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] uppercase"
                      >
                        Collect Due
                      </button>
                    )}
                    {slot.pitchBravo && slot.pitchBravo.paymentStatus !== 'paid_full' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateBookingStatus(slot.pitchBravo!.id, 'paid_full');
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] uppercase"
                      >
                        Collect Due
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* All Bookings Search & Table */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h4 className="text-base font-bold text-white font-display uppercase tracking-wider">
                  All Bookings Record ({filteredBookings.length})
                </h4>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search team, captain, code..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Pitch</th>
                      <th className="pb-3">Date & Slot</th>
                      <th className="pb-3">Team & Captain</th>
                      <th className="pb-3 text-right">Total</th>
                      <th className="pb-3 text-right">Due at Ground</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-mono font-bold text-emerald-400">{b.bookingCode}</td>
                        <td className="py-3 font-medium text-white">{b.courtName}</td>
                        <td className="py-3">
                          <div>{b.date}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{b.displayTime}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-white">{b.teamName}</div>
                          <div className="text-[10px] text-slate-400">{b.captainName} · {b.captainPhone}</div>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-white">৳{b.totalPrice.toLocaleString()}</td>
                        <td className="py-3 text-right font-mono">
                          {b.dueAmount > 0 ? (
                            <span className="text-amber-400 font-bold">৳{b.dueAmount.toLocaleString()}</span>
                          ) : (
                            <span className="text-emerald-400">৳0 (Clear)</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.paymentStatus === 'paid_full'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {b.paymentStatus === 'paid_full' ? 'Paid Full' : '৳500 Adv'}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          {b.paymentStatus !== 'paid_full' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b.id, 'paid_full')}
                              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase"
                            >
                              Collect Cash
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Cancel booking ${b.bookingCode}?`)) handleCancelBooking(b.id);
                            }}
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Walk-In Booking Form */}
        {activeTab === 'walkin' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white font-display">Create Walk-In Counter Booking</h3>
              <p className="text-xs text-slate-400">Register counter walk-in players and collect payment on the spot.</p>
            </div>

            <form onSubmit={handleCreateWalkin} className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Pitch *</label>
                  <select
                    value={walkinCourtId}
                    onChange={e => setWalkinCourtId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {COURTS.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.format})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Booking Date *</label>
                  <input
                    type="date"
                    required
                    value={walkinDate}
                    onChange={e => setWalkinDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select 90-Min Slot *</label>
                  <select
                    value={walkinSlotNum}
                    onChange={e => setWalkinSlotNum(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs font-mono"
                  >
                    {SCHEDULE_SLOTS_DEFINITION.map(s => (
                      <option key={s.slotNumber} value={s.slotNumber}>
                        Slot #{s.slotNumber}: {s.displayTime} ({s.period.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Team / Squad Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uttara Scrimmage"
                    value={walkinTeam}
                    onChange={e => setWalkinTeam(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Captain Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Captain Name"
                    value={walkinCaptain}
                    onChange={e => setWalkinCaptain(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01796-337133"
                    value={walkinPhone}
                    onChange={e => setWalkinPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Negotiated Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={walkinPrice}
                    onChange={e => setWalkinPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Status at Counter *</label>
                  <select
                    value={walkinPaymentStatus}
                    onChange={e => setWalkinPaymentStatus(e.target.value as Booking['paymentStatus'])}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs font-bold"
                  >
                    <option value="paid_full">Collected Full Payment (৳{walkinPrice})</option>
                    <option value="paid_advance">Collected ৳500 Advance (Rest Due Before Kickoff)</option>
                    <option value="confirmed_unpaid">Pay Later Before Kickoff</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>Confirm Walk-In Booking</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Expense Tracker */}
        {activeTab === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 h-fit space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Record Operational Expense</span>
              </h3>

              <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expense Category *</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as ExpenseRecord['category'])}
                    className="w-full px-3 py-2 rounded-lg bg-[#111a24] border border-white/10 text-white text-xs"
                  >
                    <option value="turf_maintenance">Turf Infill & Pitch Grooming</option>
                    <option value="floodlight_electricity">DESCO Electricity / Floodlights</option>
                    <option value="staff_wages">Groundsmen & Security Wages</option>
                    <option value="equipment">Balls, Bibs & Arena Equipment</option>
                    <option value="cleaning">Changing Room Sanitation</option>
                    <option value="marketing">Social Media & Tournaments Ads</option>
                    <option value="other">Other Operational Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expense Title / Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. October DESCO Commercial Meter Bill"
                    value={expTitle}
                    onChange={e => setExpTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Amount (৳) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={expAmount}
                      onChange={e => setExpAmount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={expDate}
                      onChange={e => setExpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Receipt / Voucher Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Invoice #2910 Paid via bKash"
                    value={expNote}
                    onChange={e => setExpNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase"
                >
                  Record Expense
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-white/10">
                <span className="text-xs font-semibold text-slate-300">Total Recorded Expenses:</span>
                <span className="text-xl font-black font-mono text-rose-400">৳{totalExpenses.toLocaleString()}</span>
              </div>

              <div className="divide-y divide-white/5 rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden">
                {expenses.map(exp => (
                  <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                          {exp.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{exp.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{exp.title}</h4>
                      {exp.receiptNote && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{exp.receiptNote}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-rose-400">
                        -৳{exp.amount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Monthly Profit Report */}
        {activeTab === 'profit' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white font-display">Monthly Profit & Loss Report</h3>
              <p className="text-xs text-slate-400">
                Official formula: <strong className="text-emerald-400">Income minus Expenses = Net Profit</strong>. In a loss month, nobody gets a share.
              </p>
            </div>

            {/* Profit Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-white/10">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Booking Income</span>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                  ৳{grossRevenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{bookings.length} verified reservations</div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-white/10">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Operating Expenses</span>
                <div className="text-3xl font-black font-mono text-rose-400 mt-2">
                  ৳{totalExpenses.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{expenses.length} expense vouchers recorded</div>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isLossMonth
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">Net Monthly Profit</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40">
                    {isLossMonth ? 'Loss Month Active' : 'Profitable'}
                  </span>
                </div>
                <div className={`text-3xl font-black font-mono mt-2 ${isLossMonth ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ৳{netProfit.toLocaleString()}
                </div>
                <div className="text-[11px] mt-1">
                  {isLossMonth ? (
                    <span className="text-rose-300 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Investor payouts paused (৳0 paid)
                    </span>
                  ) : (
                    <span>Available for dividend distribution to 10 investors</span>
                  )}
                </div>
              </div>
            </div>

            {/* Investor breakdown snapshot */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Live Investor Payout Projections Based on Current Net Profit
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Investor Name</th>
                      <th className="pb-3 text-center">Equity Share</th>
                      <th className="pb-3 text-right">Capital Invested</th>
                      <th className="pb-3 text-right font-bold text-emerald-400">Current Month Payout</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {investors.map(inv => {
                      const shareAmount = isLossMonth ? 0 : Math.round(netProfit * (inv.sharePercentage / 100));
                      return (
                        <tr key={inv.id}>
                          <td className="py-3 font-bold text-white">{inv.name}</td>
                          <td className="py-3 text-center font-mono font-semibold text-emerald-400">{inv.sharePercentage}%</td>
                          <td className="py-3 text-right font-mono">৳{inv.capitalInvested.toLocaleString()}</td>
                          <td className="py-3 text-right font-mono font-black text-sm text-emerald-400">
                            ৳{shareAmount.toLocaleString()}
                          </td>
                          <td className="py-3 text-center">
                            {isLossMonth ? (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                                ৳0 (Loss Protection)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                Ready for Payout
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Pricing Engine */}
        {activeTab === 'pricing' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white font-display">Configure Dynamic Pricing Engine</h3>
              <p className="text-xs text-slate-400">
                Change pricing anytime. Rates automatically update on the live booking engine and calendar view.
              </p>
            </div>

            {pricingSavedToast && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Pricing successfully updated across all 12 slots!</span>
              </div>
            )}

            <form onSubmit={handleSavePricingConfig} className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Morning Slots Price (Slots 1–4 · 06:00 AM – 12:00 PM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">৳</span>
                  <input
                    type="number"
                    min="500"
                    value={pricingForm.morningSlotPrice}
                    onChange={e => setPricingForm({ ...pricingForm, morningSlotPrice: parseInt(e.target.value, 10) || 0 })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Afternoon Slots Price (Slots 5–8 · 12:00 PM – 06:00 PM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">৳</span>
                  <input
                    type="number"
                    min="500"
                    value={pricingForm.afternoonSlotPrice}
                    onChange={e => setPricingForm({ ...pricingForm, afternoonSlotPrice: parseInt(e.target.value, 10) || 0 })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Evening Floodlight Prime Price (Slots 9–12 · 06:00 PM – 12:00 AM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">৳</span>
                  <input
                    type="number"
                    min="500"
                    value={pricingForm.eveningSlotPrice}
                    onChange={e => setPricingForm({ ...pricingForm, eveningSlotPrice: parseInt(e.target.value, 10) || 0 })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Weekend Surcharge (Friday & Saturday in Dhaka)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">+৳</span>
                  <input
                    type="number"
                    min="0"
                    value={pricingForm.weekendSurcharge}
                    onChange={e => setPricingForm({ ...pricingForm, weekendSurcharge: parseInt(e.target.value, 10) || 0 })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Save New Pricing Structure
              </button>
            </form>
          </div>
        )}

        {/* Tab 6: Investor Equity % Management */}
        {activeTab === 'investors' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white font-display">Manage Investor Equity % (Up to 10 Investors)</h3>
              <p className="text-xs text-slate-400">
                Configure profit share percentages for each verified investor. Total cannot exceed 100%.
              </p>
            </div>

            {investorSavedToast && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Investor equity percentages saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveInvestorConfig} className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-semibold text-slate-300">Total Allocated Share:</span>
                <span className={`text-sm font-mono font-black ${totalSharePercentage > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {totalSharePercentage.toFixed(1)}% / 100%
                </span>
              </div>

              <div className="space-y-3">
                {investorList.map((inv, idx) => (
                  <div key={inv.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="col-span-6">
                      <span className="text-xs font-bold text-white block">{inv.name}</span>
                      <span className="text-[10px] text-slate-400">{inv.email}</span>
                    </div>
                    <div className="col-span-4 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={inv.sharePercentage}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = [...investorList];
                          updated[idx] = { ...updated[idx], sharePercentage: val };
                          setInvestorList(updated);
                        }}
                        className="w-20 px-2 py-1 rounded bg-black/40 border border-white/15 text-white font-mono text-center font-bold text-xs"
                      />
                      <span className="text-xs font-mono text-emerald-400 font-bold">%</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setInvestorList(investorList.filter(i => i.id !== inv.id));
                        }}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {investorList.length < 10 && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New Investor Name"
                    value={newInvestorName}
                    onChange={e => setNewInvestorName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Share %"
                    value={newInvestorShare}
                    onChange={e => setNewInvestorShare(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewInvestor}
                    className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                  >
                    + Add
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
              >
                Save All Investor Equity Settings
              </button>
            </form>
          </div>
        )}

        {/* Tab 7: Shop & Counter Holds */}
        {activeTab === 'shop' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white font-display">Shop Reservations & Counter Pickups</h3>
              <p className="text-xs text-slate-400">Manage gear held for players to collect before their match.</p>
            </div>

            {shopReservations.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900 border border-white/10">
                <Store className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">No Pending Reservations</h4>
                <p className="text-xs text-slate-400 mt-1">Player gear reservations from the online shop will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 rounded-2xl bg-slate-900 border border-white/10">
                {shopReservations.map(res => (
                  <div key={res.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">{res.reservationCode}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{res.reservedAt.split('T')[0]}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{res.productName}</h4>
                      <div className="text-xs text-slate-400">{res.customerName} · {res.customerPhone}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400 text-sm">৳{res.price.toLocaleString()}</span>
                      {res.status === 'reserved_pickup' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateShopReservationStatus(res.id, 'collected')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs uppercase"
                        >
                          Mark Collected
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                          Collected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
