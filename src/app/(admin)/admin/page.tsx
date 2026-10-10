'use client';

import React, { useState, useMemo } from 'react';
import { useArena } from '../../../context/ArenaContext';
import {
  Booking,
  ExpenseRecord,
  InvestorRecord,
  PricingConfig,
  PayoutRecord,
  RefundRecord,
  OtherIncomeRecord,
  ShopProduct,
  ShopReservation,
  Tournament,
  TournamentRegistration,
  MatchDayResult,
  UserAccount,
  SiteSettings
} from '../../../types';
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
  Percent,
  CheckCircle2,
  Upload,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera,
  BookOpen,
  Lock,
  UserCheck,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const {
    bookings,
    pricing,
    expenses,
    investors,
    payouts,
    refunds,
    otherIncome,
    teams,
    matchResults,
    shopProducts,
    shopReservations,
    tournaments,
    registrations,
    users,
    siteSettings,
    currentUser,
    switchDemoUser,
    grossRevenue,
    totalExpenses,
    netProfit,
    isLossMonth,
    calculateMonthlyFinance,
    handleBookingSuccess,
    handleUpdateBookingStatus,
    handleCancelBooking,
    handleRecordRefund,
    handleRecordPayout,
    handleAddOtherIncome,
    handleSavePricing,
    handleAddExpense,
    handleDeleteExpense,
    handleSaveInvestors,
    handleSaveShopProduct,
    handleUpdateShopReservationStatus,
    handleSaveMatchResult,
    handleSaveSiteSettings,
    handleUpdateUserRole,
    handleToggleUserDisabled,
    exportDatabaseBackup,
    handleRestoreDatabase,
    setShowHandoverGuide
  } = useArena();

  // Navigation tab for the 14 areas in Section 7
  const [activeArea, setActiveArea] = useState<
    'today' | 'schedule' | 'all_bookings' | 'refunds' | 'finance_report' |
    'expenses' | 'other_income' | 'investors' | 'pricing' | 'shop' |
    'events' | 'match_results' | 'gallery' | 'users' | 'settings'
  >('today');

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [scheduleDate, setScheduleDate] = useState(todayStr);

  // Financial summary for selected month
  const financeReport = useMemo(() => {
    return calculateMonthlyFinance(selectedMonth);
  }, [calculateMonthlyFinance, selectedMonth]);

  // Today's summary
  const todayBookings = useMemo(() => {
    return bookings.filter(b => b.date === todayStr && b.paymentStatus !== 'cancelled');
  }, [bookings, todayStr]);

  const todayCollected = useMemo(() => {
    return todayBookings.reduce((sum, b) => {
      if (b.paymentStatus === 'paid_full') return sum + b.totalPrice;
      return sum + (b.advanceAmount || 500);
    }, 0);
  }, [todayBookings]);

  // Pending alerts
  const pendingRefunds = refunds.filter(r => r.status === 'pending');
  const pendingReservations = shopReservations.filter(r => r.status === 'reserved_pickup');
  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const pendingResults = matchResults.filter(r => r.status === 'pending_approval');

  // Search & Filters for All Bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState<'all' | 'balance_due' | 'needs_refund'>('all');

  const filteredAllBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch =
        b.teamName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.captainName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.captainPhone.includes(bookingSearch) ||
        b.bookingCode.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.date.includes(bookingSearch);

      if (!matchSearch) return false;
      if (bookingFilterStatus === 'balance_due') return (b.dueAmount || 0) > 0 && b.paymentStatus !== 'cancelled';
      if (bookingFilterStatus === 'needs_refund') return b.paymentStatus === 'needs_refund';
      return true;
    });
  }, [bookings, bookingSearch, bookingFilterStatus]);

  // Schedule Day Slots view
  const scheduleSlots = useMemo(() => {
    const isWeekend = new Date(scheduleDate).getDay() === 5 || new Date(scheduleDate).getDay() === 6;

    return SCHEDULE_SLOTS_DEFINITION.map(def => {
      const b = bookings.find(item => item.date === scheduleDate && item.slotNumber === def.slotNumber && item.paymentStatus !== 'cancelled');
      const adminSlot = pricing.slotPrices.find(s => s.slotNumber === def.slotNumber);
      const price = adminSlot ? (isWeekend ? adminSlot.weekendPrice : adminSlot.weekdayPrice) : def.weekdayPrice;

      return {
        ...def,
        booking: b,
        price
      };
    });
  }, [bookings, scheduleDate, pricing.slotPrices]);

  // Walk-in modal / state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinSlotNum, setWalkinSlotNum] = useState<number>(10);
  const [walkinTeam, setWalkinTeam] = useState('');
  const [walkinCaptain, setWalkinCaptain] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinPrice, setWalkinPrice] = useState<number>(3200);
  const [walkinPaid, setWalkinPaid] = useState<number>(3200);
  const [walkinMethod, setWalkinMethod] = useState<Booking['paymentMethod']>('cash');

  const handleCreateWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinTeam.trim() || !walkinCaptain.trim() || !walkinPhone.trim()) return;

    const def = SCHEDULE_SLOTS_DEFINITION.find(s => s.slotNumber === walkinSlotNum) || SCHEDULE_SLOTS_DEFINITION[0];
    const isFull = walkinPaid >= walkinPrice;
    const due = Math.max(0, walkinPrice - walkinPaid);

    const newBooking: Booking = {
      id: `walkin-${Date.now()}`,
      bookingCode: `CMA-W${Math.floor(1000 + Math.random() * 9000)}`,
      courtId: 'main-turf',
      courtName: 'Crossbar Metro Arena (Main Turf)',
      date: scheduleDate,
      slotNumber: def.slotNumber,
      startTime: def.startTime,
      endTime: def.endTime,
      displayTime: def.displayTime,
      captainName: walkinCaptain.trim(),
      captainPhone: walkinPhone.trim(),
      teamName: walkinTeam.trim(),
      playerCount: 14,
      matchType: 'friendly',
      addOns: [],
      courtPrice: walkinPrice,
      addOnsPrice: 0,
      totalPrice: walkinPrice,
      paymentType: isFull ? 'full_payment' : 'advance_500',
      advanceAmount: walkinPaid,
      dueAmount: due,
      paymentMethod: walkinMethod,
      paymentStatus: isFull ? 'paid_full' : 'paid_advance',
      isWalkIn: true,
      notes: 'Counter Walk-In Recorded by Admin',
      createdAt: new Date().toISOString()
    };

    handleBookingSuccess(newBooking);
    setShowWalkinModal(false);
    setWalkinTeam('');
    setWalkinCaptain('');
    setWalkinPhone('');
  };

  // Collect balance modal
  const [collectingBooking, setCollectingBooking] = useState<Booking | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);

  const handleCollectBalance = () => {
    if (!collectingBooking) return;
    handleUpdateBookingStatus(collectingBooking.id, 'paid_full', collectAmount);
    setCollectingBooking(null);
  };

  // Expense form state
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('turf_maintenance');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(2000);
  const [expDate, setExpDate] = useState(todayStr);
  const [expNote, setExpNote] = useState('');

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) return;

    const newExp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      category: expCategory,
      title: expTitle.trim(),
      amount: expAmount,
      date: expDate,
      receiptNote: expNote.trim(),
      recordedBy: currentUser?.name || 'Admin Abid'
    };

    handleAddExpense(newExp);
    setExpTitle('');
    setExpAmount(2000);
    setExpNote('');
  };

  // Pricing Matrix state (All 24 prices)
  const [pricingForm, setPricingForm] = useState<PricingConfig>(pricing);
  const [pricingToast, setPricingToast] = useState(false);

  const handleSaveAll24Prices = (e: React.FormEvent) => {
    e.preventDefault();
    handleSavePricing(pricingForm);
    setPricingToast(true);
    setTimeout(() => setPricingToast(false), 3000);
  };

  // Investor management state
  const [investorList, setInvestorList] = useState<InvestorRecord[]>(investors);
  const [newInvName, setNewInvName] = useState('');
  const [newInvPhone, setNewInvPhone] = useState('');
  const [newInvShare, setNewInvShare] = useState<number>(10);
  const [newInvCapital, setNewInvCapital] = useState<number>(1000000);
  const [payoutModalInvestor, setPayoutModalInvestor] = useState<InvestorRecord | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<PayoutRecord['paymentMethod']>('bank_transfer');
  const [payoutRef, setPayoutRef] = useState('');

  const totalInvestorShareSum = investorList.reduce((sum, i) => sum + i.sharePercentage, 0);

  const handleAddNewInvestor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim() || !newInvPhone.trim()) return;
    if (investorList.length >= 10) {
      alert('Maximum 10 investors allowed as per requirements.');
      return;
    }
    const newInv: InvestorRecord = {
      id: `inv-${Date.now()}`,
      name: newInvName.trim(),
      phone: newInvPhone.trim(),
      email: `${newInvName.toLowerCase().replace(/\s+/g, '')}@investor.bd`,
      sharePercentage: newInvShare,
      capitalInvested: newInvCapital,
      joinedDate: new Date().toISOString().split('T')[0],
      payoutsPaid: 0,
      status: 'active'
    };
    const updated = [...investorList, newInv];
    setInvestorList(updated);
    handleSaveInvestors(updated);
    setNewInvName('');
    setNewInvPhone('');
  };

  const handleRecordPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalInvestor || payoutAmount <= 0) return;

    const payout: PayoutRecord = {
      id: `payout-${Date.now()}`,
      investorId: payoutModalInvestor.id,
      investorName: payoutModalInvestor.name,
      month: selectedMonth,
      amount: payoutAmount,
      datePaid: todayStr,
      paymentMethod: payoutMethod,
      transactionNote: payoutRef.trim() || 'Bank Disbursed',
      recordedBy: currentUser?.name || 'Admin Abid'
    };

    handleRecordPayout(payout);
    setPayoutModalInvestor(null);
  };

  // Process Refund state
  const [processingRefund, setProcessingRefund] = useState<RefundRecord | null>(null);
  const [refundMethod, setRefundMethod] = useState<RefundRecord['refundMethod']>('bkash');
  const [refundTrx, setRefundTrx] = useState('');

  const handleCompleteRefund = () => {
    if (!processingRefund) return;
    handleRecordRefund(processingRefund.id, processingRefund.amount, refundMethod, refundTrx || `REF-${Date.now().toString().slice(-6)}`);
    setProcessingRefund(null);
  };

  // CSV Export for Monthly Report (Section 7 requirement)
  const handleExportCSV = () => {
    let csv = `CROSSBAR METRO ARENA - MONTHLY FINANCIAL AUDIT REPORT (${financeReport.month})\n\n`;
    csv += `METRIC,VALUE\n`;
    csv += `Gross Booking Revenue (Online + Cash),৳${financeReport.bookingMoneyCollected}\n`;
    csv += `Other Income (Shop + Events),৳${financeReport.otherIncomeTotal}\n`;
    csv += `Total Arena Revenue,৳${financeReport.totalRevenue}\n`;
    csv += `Total Operational Expenses,৳${financeReport.totalExpenses}\n`;
    csv += `Net Profit,৳${financeReport.netProfit}\n`;
    csv += `Profit Margin,${financeReport.profitMargin.toFixed(1)}%\n`;
    csv += `Slots Booked,${financeReport.slotsBooked} / ${12 * 30} slots\n`;
    csv += `Arena Occupancy Rate,${financeReport.occupancyRate.toFixed(1)}%\n`;
    csv += `Cancellations Count,${financeReport.cancellationsCount}\n`;
    csv += `Venue Cash Due Remaining,৳${financeReport.dueAmountTotal}\n\n`;

    csv += `INVESTOR DISTRIBUTION BREAKDOWN\n`;
    csv += `INVESTOR,EQUITY %,MONTHLY SHARE,STATUS\n`;
    financeReport.investorShares.forEach(inv => {
      csv += `"${inv.investor.name}",${inv.percentage}%,৳${inv.shareAmount},${inv.isPaid ? 'PAID' : 'PENDING'}\n`;
    });
    csv += `"Owners Retained Pool",${Math.max(0, 100 - totalInvestorShareSum)}%,৳${financeReport.ownersShare},RETAINED\n\n`;

    csv += `DAILY REVENUE & EXPENSE BREAKDOWN\n`;
    csv += `DATE,SLOTS BOOKED,MONEY COLLECTED,EXPENSES,NET\n`;
    financeReport.dailyBreakdown.forEach(d => {
      csv += `${d.date},${d.slotsBooked},৳${d.moneyCollected},৳${d.expenses},৳${d.net}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crossbar_financial_report_${financeReport.month}.csv`;
    link.click();
  };

  // Restore Database Backup Uploader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const ok = handleRestoreDatabase(json);
        if (ok) alert('Database restored successfully from backup file!');
        else alert('Invalid backup file format.');
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Role Guard: Check if non-admin
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-3xl bg-slate-900/90 border border-rose-500/40 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white font-display uppercase tracking-wide">
          Admin Operations Access Guard
        </h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()}). Section 10 security policy requires an arena admin account to manage financial reports, 24-slot pricing, and operations.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => switchDemoUser('admin', 'user-admin-1')}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            Switch to Admin Account (Abid Hasan)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Admin Title & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
              Arena Management Console · bookcrossbar.com
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase font-display mt-1">
            Operations &amp; Finance Desk
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowHandoverGuide(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Handover Guide</span>
          </button>

          <button
            type="button"
            onClick={exportDatabaseBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 hover:border-emerald-500 text-emerald-400 font-bold text-xs uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup</span>
          </button>

          <label className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-bold text-xs uppercase transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restore Backup</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* 14 AREAS NAVIGATION STRIP (Section 7) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 text-xs font-bold">
        {[
          { id: 'today', label: '1. Today Dashboard', icon: Clock },
          { id: 'schedule', label: '2. 12-Slot Schedule', icon: Calendar },
          { id: 'all_bookings', label: `3. All Bookings (${bookings.length})`, icon: Layers },
          { id: 'refunds', label: `4. Refunds (${refunds.length})`, icon: AlertCircle, badge: pendingRefunds.length },
          { id: 'finance_report', label: '5. 1-Click Finance Report', icon: TrendingUp },
          { id: 'expenses', label: '6. Expenses', icon: Receipt },
          { id: 'other_income', label: '7. Other Income', icon: DollarSign },
          { id: 'investors', label: '8. Investors (Max 10)', icon: Users },
          { id: 'pricing', label: '9. 24 Slot Pricing & Rules', icon: Tag },
          { id: 'shop', label: '10. Shop Orders', icon: Store, badge: pendingReservations.length },
          { id: 'events', label: '11. Events Hub', icon: Trophy, badge: pendingRegistrations.length },
          { id: 'match_results', label: '12. Match Results', icon: Trophy, badge: pendingResults.length },
          { id: 'gallery', label: '13. Gallery Photos', icon: Camera },
          { id: 'users', label: '14. Users & Roles', icon: ShieldCheck },
          { id: 'settings', label: '15. Site Settings', icon: Settings },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeArea === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveArea(item.id as any)}
              className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[10px] flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 1. TODAY DASHBOARD AREA (Section 7 requirement) */}
      {activeArea === 'today' && (
        <div className="space-y-6">
          {/* Key Today Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
              <div className="text-[11px] text-slate-400">Booked Today</div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {todayBookings.length} / 12
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Slots Occupied</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
              <div className="text-[11px] text-slate-400">Money Collected Today</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                ৳{todayCollected.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Online + Cash In</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
              <div className="text-[11px] text-slate-400">Month Occupancy</div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {financeReport.occupancyRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">{financeReport.slotsBooked} Slots This Month</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
              <div className="text-[11px] text-slate-400">Net Profit ({financeReport.month})</div>
              <div className={`text-2xl font-black font-mono mt-1 ${financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'}`}>
                ৳{financeReport.netProfit.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">Revenue − Expenses</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10">
              <div className="text-[11px] text-slate-400">Action Alerts</div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                {pendingRefunds.length + pendingReservations.length + pendingRegistrations.length}
              </div>
              <div className="text-[10px] text-amber-300 mt-0.5">Items Waiting Review</div>
            </div>
          </div>

          {/* Alerts Strip */}
          {(pendingRefunds.length > 0 || pendingReservations.length > 0) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Operations Alerts:</strong> {pendingRefunds.length} refunds needing manual payout, {pendingReservations.length} shop gear pickup requests ready at desk.
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveArea('refunds')}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold"
                >
                  View Refunds
                </button>
                <button
                  type="button"
                  onClick={() => setActiveArea('shop')}
                  className="px-3 py-1 rounded-lg bg-white/10 text-white font-bold"
                >
                  Shop Orders
                </button>
              </div>
            </div>
          )}

          {/* Today's 12 Slots Status Grid */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-display">
                Today&apos;s 12 Slots Real-Time Schedule ({todayStr})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setWalkinSlotNum(10);
                  setShowWalkinModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase"
              >
                + Add Walk-in Booking
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {SCHEDULE_SLOTS_DEFINITION.map(s => {
                const b = bookings.find(item => item.date === todayStr && item.slotNumber === s.slotNumber && item.paymentStatus !== 'cancelled');
                return (
                  <div
                    key={s.slotNumber}
                    className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between ${
                      b
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-slate-400">Slot #{s.slotNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-400'
                        }`}>
                          {b ? (b.paymentStatus === 'paid_full' ? 'Paid Full' : 'Advance ৳500') : 'Free Slot'}
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm">{s.displayTime}</div>
                      
                      {b ? (
                        <div className="mt-2 space-y-0.5 text-slate-300">
                          <div>Squad: <strong className="text-white">{b.teamName}</strong></div>
                          <div>Captain: {b.captainName} ({b.captainPhone})</div>
                          <div className="font-mono text-emerald-400">
                            Paid: ৳{b.advanceAmount} · Due: ৳{b.dueAmount}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-slate-500 italic">No reservation. Available for walk-ins.</div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                      {b ? (
                        <div className="flex gap-1.5 w-full">
                          {b.dueAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setCollectingBooking(b);
                                setCollectAmount(b.dueAmount);
                              }}
                              className="flex-1 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px]"
                            >
                              Collect ৳{b.dueAmount}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Cancel booking ${b.bookingCode}?`)) handleCancelBooking(b.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setWalkinSlotNum(s.slotNumber);
                            setShowWalkinModal(true);
                          }}
                          className="w-full py-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 font-bold text-[11px]"
                        >
                          Book Walk-in
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. SCHEDULE DAY VIEW (Section 7 requirement: day view of 12 slots, move day by day) */}
      {activeArea === 'schedule' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(scheduleDate);
                  d.setDate(d.getDate() - 1);
                  setScheduleDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="text-xs text-slate-400">Viewing Schedule Date:</div>
                <div className="text-lg font-black text-white font-mono">{scheduleDate}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const d = new Date(scheduleDate);
                  d.setDate(d.getDate() + 1);
                  setScheduleDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  setWalkinSlotNum(10);
                  setShowWalkinModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase"
              >
                + Walk-in Booking
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {scheduleSlots.map(s => {
              const b = s.booking;
              return (
                <div
                  key={s.slotNumber}
                  className={`p-4 rounded-2xl border text-xs flex flex-col justify-between ${
                    b
                      ? 'bg-slate-900/90 border-emerald-500/40'
                      : 'bg-white/[0.02] border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-mono font-bold">Slot #{s.slotNumber}</span>
                      <span className="font-mono font-bold text-emerald-400">Rate: ৳{s.price}</span>
                    </div>
                    <div className="text-base font-bold text-white">{s.displayTime}</div>

                    {b ? (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-white/5 space-y-1">
                        <div className="text-sm font-bold text-white">{b.teamName}</div>
                        <div className="text-slate-300">Captain: {b.captainName} · {b.captainPhone}</div>
                        <div className="text-emerald-400 font-mono font-bold">
                          Paid: ৳{b.advanceAmount} · Due: ৳{b.dueAmount}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-white/[0.02] text-slate-500 italic">
                        Available for online bookings or counter walk-in.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center gap-2">
                    {b ? (
                      <>
                        {b.dueAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCollectingBooking(b);
                              setCollectAmount(b.dueAmount);
                            }}
                            className="flex-1 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                          >
                            Collect Balance (৳{b.dueAmount})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Cancel booking ${b.bookingCode}?`)) handleCancelBooking(b.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setWalkinSlotNum(s.slotNumber);
                          setWalkinPrice(s.price);
                          setWalkinPaid(s.price);
                          setShowWalkinModal(true);
                        }}
                        className="w-full py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-xs"
                      >
                        Create Walk-in Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ALL BOOKINGS (Section 7 requirement: search date/status/ref/name/phone/team, filters) */}
      {activeArea === 'all_bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/10">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by squad, captain, phone, or CMA code..."
                value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              {[
                { id: 'all', label: `All (${bookings.length})` },
                { id: 'balance_due', label: 'Balance Due' },
                { id: 'needs_refund', label: 'Needs Refund' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBookingFilterStatus(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    bookingFilterStatus === f.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Match Date &amp; Slot</th>
                  <th className="py-3 px-4">Squad / Captain</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Due Balance</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAllBookings.map(b => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{b.bookingCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{b.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.displayTime}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{b.teamName}</div>
                      <div className="text-[10px] text-slate-400">{b.captainName} ({b.captainPhone})</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.paymentStatus === 'paid_full'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : b.paymentStatus === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {b.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white">৳{b.advanceAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400 font-bold">
                      ৳{(b.dueAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.dueAmount > 0 && b.paymentStatus !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCollectingBooking(b);
                            setCollectAmount(b.dueAmount);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase"
                        >
                          Collect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. REFUNDS (Section 7 requirement: cancelled or expired bookings, record refund) */}
      {activeArea === 'refunds' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-black uppercase text-white font-display">
              Refunds Processing Queue
            </h3>
            <p className="text-xs text-slate-400">
              Cancelled slots or expired holds holding customer funds. Process refund manually via bKash/Nagad and record below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {refunds.map(r => (
              <div
                key={r.id}
                className={`p-5 rounded-3xl border text-xs space-y-3 ${
                  r.status === 'completed'
                    ? 'bg-slate-900/40 border-white/5 opacity-70'
                    : 'bg-amber-950/20 border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-400">{r.bookingCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300 animate-pulse'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <div>
                  <div className="text-sm font-bold text-white">{r.customerName} · {r.customerPhone}</div>
                  <div className="text-xs text-slate-400">Reason: {r.reason.replace(/_/g, ' ')}</div>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-1">
                    ৳{r.amount.toLocaleString()}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Requested: {r.requestDate}</span>
                  {r.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => setProcessingRefund(r)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase"
                    >
                      Record Refund
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold">Processed ({r.transactionRef})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. 1-CLICK FINANCIAL REPORT (Section 7 & 8 requirement) */}
      {activeArea === 'finance_report' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-white/10">
            <div>
              <div className="text-xs text-slate-400">Select Accounting Month:</div>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-white font-mono text-sm font-bold"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Export to Excel / CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase border border-white/10 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Audit Report</span>
              </button>
            </div>
          </div>

          {/* Core Monthly P&L Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
              <div className="text-xs text-slate-400">Gross Booking Revenue</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                ৳{financeReport.bookingMoneyCollected.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Payments in − Refunds paid</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
              <div className="text-xs text-slate-400">Other Income (Shop/Events)</div>
              <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                ৳{financeReport.otherIncomeTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Shop orders + Tournament fees</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10">
              <div className="text-xs text-slate-400">Total Month Expenses</div>
              <div className="text-2xl font-black font-mono text-rose-400 mt-1">
                ৳{financeReport.totalExpenses.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Electricity, salary, maintenance</div>
            </div>

            <div className={`p-5 rounded-3xl border ${financeReport.isLossMonth ? 'bg-rose-950/20 border-rose-500/40' : 'bg-emerald-950/20 border-emerald-500/40'}`}>
              <div className="text-xs text-slate-400">Certified Net Profit</div>
              <div className={`text-3xl font-black font-mono mt-1 ${financeReport.isLossMonth ? 'text-rose-400' : 'text-emerald-400'}`}>
                ৳{financeReport.netProfit.toLocaleString()}
              </div>
              <div className="text-[11px] font-bold mt-1 text-slate-300">
                Margin: {financeReport.profitMargin.toFixed(1)}% · {financeReport.isLossMonth ? 'Loss Month (0% Payout)' : 'Profitable'}
              </div>
            </div>
          </div>

          {/* Investor Share Distribution Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white uppercase font-display">
              Investor Profit Share Distribution ({financeReport.month})
            </h3>
            <p className="text-xs text-slate-400">
              Formula: Net profit × Investor % ÷ 100. If net profit is zero or negative, every share is ৳0.
            </p>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-[10px] font-bold uppercase text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-4">Investor Partner</th>
                    <th className="py-2.5 px-4 text-center">Equity %</th>
                    <th className="py-2.5 px-4 text-right">Calculated Share</th>
                    <th className="py-2.5 px-4 text-center">Payout Status</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {financeReport.investorShares.map(inv => (
                    <tr key={inv.investor.id}>
                      <td className="py-3 px-4 font-sans font-bold text-white">{inv.investor.name}</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">{inv.percentage}%</td>
                      <td className="py-3 px-4 text-right font-black text-white">৳{inv.shareAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.isPaid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {inv.isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {!inv.isPaid && inv.shareAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayoutModalInvestor(inv.investor);
                              setPayoutAmount(inv.shareAmount);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[10px]"
                          >
                            Record Payout
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-white/[0.03] font-bold">
                    <td className="py-3 px-4 font-sans text-emerald-400">Owners&apos; Retained Share</td>
                    <td className="py-3 px-4 text-center text-slate-400">{Math.max(0, 100 - totalInvestorShareSum)}%</td>
                    <td className="py-3 px-4 text-right text-emerald-400">৳{financeReport.ownersShare.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center text-slate-400" colSpan={2}>RETAINED CASHFLOW</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white uppercase font-display">
              Daily Breakdown Statement ({financeReport.month})
            </h3>
            <div className="overflow-x-auto max-h-72 rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-[10px] font-bold uppercase text-slate-400 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Slots Booked</th>
                    <th className="py-2.5 px-3 text-right">Money Collected</th>
                    <th className="py-2.5 px-3 text-right">Expenses</th>
                    <th className="py-2.5 px-3 text-right font-bold text-white">Daily Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {financeReport.dailyBreakdown.map(d => (
                    <tr key={d.date} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3 text-slate-300">{d.date}</td>
                      <td className="py-2 px-3 text-center">{d.slotsBooked}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">৳{d.moneyCollected.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-rose-400">৳{d.expenses.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right font-bold ${d.net >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        ৳{d.net.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. EXPENSES (Section 7 requirement: add, view, delete by month, categories) */}
      {activeArea === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Add Expense Form */}
            <form onSubmit={handleAddExpenseSubmit} className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold uppercase text-emerald-400 font-display">
                Record New Expense Entry
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Category *</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                >
                  <option value="floodlight_electricity">Floodlight &amp; Commercial Electricity</option>
                  <option value="staff_wages">Staff &amp; Ground Security Wages</option>
                  <option value="rent">Turf Land Lease / Rent</option>
                  <option value="turf_maintenance">Turf &amp; Rubber Infill Maintenance</option>
                  <option value="water">Water Utility</option>
                  <option value="internet">High-Speed Wi-Fi Internet</option>
                  <option value="marketing">Social Media Marketing &amp; Ads</option>
                  <option value="equipment">Match Balls &amp; Bibs Equipment</option>
                  <option value="shop_stock">Sports Shop Inventory Stock</option>
                  <option value="cleaning">Sanitation &amp; Cleaning</option>
                  <option value="other">Other Operational Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DESCO Commercial Bill #8812"
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (BDT) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={expAmount}
                    onChange={e => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Receipt Note / Voucher #</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via bKash Merchant"
                  value={expNote}
                  onChange={e => setExpNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase"
              >
                Save Expense Entry
              </button>
            </form>

            {/* Expenses List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recorded Expenses ({expenses.length} Records)
                </h4>
                <span className="font-mono text-rose-400 font-bold text-xs">
                  Total: ৳{totalExpenses.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {expenses.map(e => (
                  <div
                    key={e.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{e.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        📅 {e.date} · Tag: {e.category.replace(/_/g, ' ')} · Recorded by: {e.recordedBy}
                      </div>
                      {e.receiptNote && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">{e.receiptNote}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-rose-400 text-sm">
                        ৳{e.amount.toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 9. SLOT PRICING & RULES (Section 7 requirement: all 24 prices for 12 slots, advance, hold, window) */}
      {activeArea === 'pricing' && (
        <form onSubmit={handleSaveAll24Prices} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase text-white font-display">
                All 24 Slot Pricing Matrix &amp; Arena Rules
              </h3>
              <p className="text-xs text-slate-400">
                Configure individual weekday and weekend rates for all 12 slots, plus advance amounts and hold timers.
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase"
            >
              Save All 24 Prices &amp; Rules
            </button>
          </div>

          {pricingToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs">
              Updated prices and rules saved successfully!
            </div>
          )}

          {/* Arena Rules: Advance, Hold, Window */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-slate-900 border border-white/10 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Default Advance Amount (৳)</label>
              <input
                type="number"
                min={0}
                value={pricingForm.advanceAmount}
                onChange={e => setPricingForm({ ...pricingForm, advanceAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Slot Hold Time (Minutes)</label>
              <input
                type="number"
                min={1}
                value={pricingForm.holdMinutes}
                onChange={e => setPricingForm({ ...pricingForm, holdMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Booking Window Ahead (Days)</label>
              <input
                type="number"
                min={7}
                value={pricingForm.bookingWindowDays}
                onChange={e => setPricingForm({ ...pricingForm, bookingWindowDays: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cancellation Cutoff (Hours)</label>
              <input
                type="number"
                min={1}
                value={pricingForm.cancellationHours}
                onChange={e => setPricingForm({ ...pricingForm, cancellationHours: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
              />
            </div>
          </div>

          {/* 12 Slots x 2 Prices Grid (All 24 Prices) */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <h4 className="text-sm font-bold uppercase text-emerald-400">
              The 12 Daily Slots: Weekday Rate vs Weekend Rate
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {pricingForm.slotPrices.map((sp, idx) => (
                <div key={sp.slotNumber} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-white">Slot #{sp.slotNumber}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{sp.period}</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-300">{sp.displayTime}</div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Weekday (৳)</label>
                      <input
                        type="number"
                        min={500}
                        step={100}
                        value={sp.weekdayPrice}
                        onChange={e => {
                          const updated = [...pricingForm.slotPrices];
                          updated[idx] = { ...updated[idx], weekdayPrice: Number(e.target.value) };
                          setPricingForm({ ...pricingForm, slotPrices: updated });
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Weekend (৳)</label>
                      <input
                        type="number"
                        min={500}
                        step={100}
                        value={sp.weekendPrice}
                        onChange={e => {
                          const updated = [...pricingForm.slotPrices];
                          updated[idx] = { ...updated[idx], weekendPrice: Number(e.target.value) };
                          setPricingForm({ ...pricingForm, slotPrices: updated });
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-emerald-400 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* 8. INVESTORS AREA (Section 7 requirement: up to 10 accounts, edit %, payouts, warn if > 100%) */}
      {activeArea === 'investors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black uppercase text-white font-display">
                Investor Accounts &amp; Equity %
              </h3>
              <p className="text-xs text-slate-400">
                Up to 10 partner accounts. Total equity share cannot exceed 100%.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold ${
                totalInvestorShareSum > 100
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              }`}>
                Total Pool: {totalInvestorShareSum}% / 100%
              </span>
            </div>
          </div>

          {totalInvestorShareSum > 100 && (
            <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>WARNING: Total investor share exceeds 100%! Please adjust percentages so total is &le; 100%.</span>
            </div>
          )}

          {/* Add New Investor */}
          {investorList.length < 10 && (
            <form onSubmit={handleAddNewInvestor} className="p-5 rounded-3xl bg-slate-900 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase text-emerald-400">+ Add Partner Account</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Partner Name"
                  value={newInvName}
                  onChange={e => setNewInvName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="Mobile (01XXXXXXXXX)"
                  value={newInvPhone}
                  onChange={e => setNewInvPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  placeholder="Share %"
                  value={newInvShare}
                  onChange={e => setNewInvShare(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                />
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold uppercase text-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* Investor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investorList.map(inv => (
              <div key={inv.id} className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{inv.name}</div>
                  <span className="font-mono text-emerald-400 font-black text-base">{inv.sharePercentage}%</span>
                </div>
                <div className="text-slate-400 space-y-0.5">
                  <div>Phone: <strong className="text-white">{inv.phone}</strong></div>
                  <div>Invested Capital: ৳{inv.capitalInvested.toLocaleString()}</div>
                  <div>Joined: {inv.joinedDate}</div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const newP = prompt(`Edit equity share percentage for ${inv.name}:`, String(inv.sharePercentage));
                      if (newP !== null && !isNaN(Number(newP))) {
                        const updated = investorList.map(i => i.id === inv.id ? { ...i, sharePercentage: Number(newP) } : i);
                        setInvestorList(updated);
                        handleSaveInvestors(updated);
                      }
                    }}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Edit Share %
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayoutModalInvestor(inv);
                      setPayoutAmount(Math.round((financeReport.netProfit * inv.sharePercentage) / 100));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                  >
                    Record Payout
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. SHOP ORDERS (Section 7 requirement: mark ready, collected, cancelled) */}
      {activeArea === 'shop' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase text-white font-display">
                Shop Reservations &amp; Counter Inventory
              </h3>
              <p className="text-xs text-slate-400">
                Marking an order &quot;Collected&quot; automatically deducts stock and adds the revenue to Other Income!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopReservations.map(res => (
              <div
                key={res.id}
                className={`p-5 rounded-3xl border text-xs space-y-3 ${
                  res.status === 'collected'
                    ? 'bg-slate-900/40 border-white/5 opacity-70'
                    : 'bg-slate-900/90 border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400">{res.reservationCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    res.status === 'collected' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {res.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{res.productName}</h4>
                  <div className="text-slate-300 mt-1">Customer: {res.customerName} ({res.customerPhone})</div>
                  <div className="font-mono text-emerald-400 font-bold mt-0.5">
                    Total: ৳{res.price.toLocaleString()}
                  </div>
                </div>

                {res.status !== 'collected' && (
                  <div className="pt-2 border-t border-white/10 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateShopReservationStatus(res.id, 'collected')}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                    >
                      Mark Collected (Paid)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateShopReservationStatus(res.id, 'cancelled')}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-bold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. EVENTS (Section 7 requirement) */}
      {activeArea === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase text-white font-display">
                Tournaments &amp; Events Manager
              </h3>
              <p className="text-xs text-slate-400">
                Manage competitions and team registrations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map(t => (
              <div key={t.id} className="p-5 rounded-3xl bg-slate-900 border border-white/10 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase">{t.category}</span>
                  <span className="font-mono text-white font-bold">{t.registeredCount} / {t.maxTeams} Teams</span>
                </div>
                <h4 className="text-base font-bold text-white font-display">{t.title}</h4>
                <div className="text-slate-400">Entry: ৳{t.entryFee.toLocaleString()} · Prize: ৳{t.prizePool.toLocaleString()}</div>
                <div className="text-slate-400">Dates: {t.dates}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 14. USERS (Section 7 requirement: search, change role, reset password, disable) */}
      {activeArea === 'users' && (
        <div className="space-y-4">
          <h3 className="text-xl font-black uppercase text-white font-display">
            Registered Users &amp; Roles Management
          </h3>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[10px] font-bold uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                    <td className="py-3 px-4 font-mono">{u.phone}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={e => handleUpdateUserRole(u.id, e.target.value as any)}
                        className="px-2 py-1 rounded bg-slate-950 border border-white/10 text-white text-xs"
                      >
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                        <option value="investor">Investor</option>
                        <option value="visitor">Visitor</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.disabled ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {u.disabled ? 'Deactivated' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleUserDisabled(u.id)}
                        className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        {u.disabled ? 'Enable' : 'Disable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 15. SITE SETTINGS (Section 7 requirement: business name, hotline, whatsapp, map, about) */}
      {activeArea === 'settings' && (
        <form onSubmit={e => { e.preventDefault(); alert('Site settings saved!'); }} className="p-6 rounded-3xl bg-slate-900 border border-white/10 space-y-4 max-w-2xl text-xs">
          <h3 className="text-base font-bold uppercase text-white font-display">
            Site Settings &amp; Business Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Business Name</label>
              <input
                type="text"
                value={siteSettings.businessName}
                onChange={e => handleSaveSiteSettings({ ...siteSettings, businessName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tagline</label>
              <input
                type="text"
                value={siteSettings.tagline}
                onChange={e => handleSaveSiteSettings({ ...siteSettings, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Hotline Phone</label>
              <input
                type="text"
                value={siteSettings.phone}
                onChange={e => handleSaveSiteSettings({ ...siteSettings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Opening Hours</label>
              <input
                type="text"
                value={siteSettings.openingHours}
                onChange={e => handleSaveSiteSettings({ ...siteSettings, openingHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Venue Address</label>
            <input
              type="text"
              value={siteSettings.address}
              onChange={e => handleSaveSiteSettings({ ...siteSettings, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold uppercase"
          >
            Save Site Settings
          </button>
        </form>
      )}

      {/* WALK-IN MODAL */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white uppercase font-display">
                Create Walk-In Booking
              </h3>
              <button
                type="button"
                onClick={() => setShowWalkinModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkin} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Slot #</label>
                  <select
                    value={walkinSlotNum}
                    onChange={e => setWalkinSlotNum(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    {SCHEDULE_SLOTS_DEFINITION.map(s => (
                      <option key={s.slotNumber} value={s.slotNumber}>
                        Slot #{s.slotNumber} ({s.displayTime})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Booking Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Squad Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uttara Kings"
                  value={walkinTeam}
                  onChange={e => setWalkinTeam(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Captain Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Captain Name"
                    value={walkinCaptain}
                    onChange={e => setWalkinCaptain(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Captain Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={walkinPhone}
                    onChange={e => setWalkinPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Rate (৳)</label>
                  <input
                    type="number"
                    value={walkinPrice}
                    onChange={e => setWalkinPrice(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Paid Now (৳)</label>
                  <input
                    type="number"
                    value={walkinPaid}
                    onChange={e => setWalkinPaid(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Method</label>
                  <select
                    value={walkinMethod}
                    onChange={e => setWalkinMethod(e.target.value as any)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="cash">Cash Desk</option>
                    <option value="bkash">bKash QR</option>
                    <option value="nagad">Nagad QR</option>
                    <option value="card">Card POS</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase"
              >
                Confirm Walk-In Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT BALANCE MODAL */}
      {collectingBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-sm p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-display">
              Collect Due Balance
            </h3>
            <p className="text-slate-300">
              Squad: <strong>{collectingBooking.teamName}</strong> ({collectingBooking.bookingCode})
            </p>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cash / Online Collected (৳)</label>
              <input
                type="number"
                value={collectAmount}
                onChange={e => setCollectAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-emerald-400 font-mono text-base font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCollectBalance}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black uppercase"
              >
                Confirm Settlement
              </button>
              <button
                type="button"
                onClick={() => setCollectingBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD REFUND MODAL */}
      {processingRefund && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1016] border border-amber-500/40 rounded-3xl w-full max-w-sm p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-display">
              Record Customer Refund
            </h3>
            <p className="text-slate-300">
              Customer: <strong>{processingRefund.customerName}</strong> ({processingRefund.customerPhone})
            </p>
            <div className="text-lg font-black font-mono text-emerald-400">
              Refund Amount: ৳{processingRefund.amount.toLocaleString()}
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Refund Method</label>
              <select
                value={refundMethod}
                onChange={e => setRefundMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              >
                <option value="bkash">bKash Disbursed</option>
                <option value="nagad">Nagad Disbursed</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Counter Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Transaction Ref #</label>
              <input
                type="text"
                placeholder="e.g. BK-REF-9921"
                value={refundTrx}
                onChange={e => setRefundTrx(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCompleteRefund}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black uppercase"
              >
                Confirm Refund
              </button>
              <button
                type="button"
                onClick={() => setProcessingRefund(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD INVESTOR PAYOUT MODAL */}
      {payoutModalInvestor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1016] border border-emerald-500/40 rounded-3xl w-full max-w-sm p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-display">
              Record Investor Dividend Payout
            </h3>
            <p className="text-slate-300">
              Partner: <strong>{payoutModalInvestor.name}</strong> ({payoutModalInvestor.sharePercentage}%)
            </p>
            <form onSubmit={handleRecordPayoutSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount Paid (৳)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-emerald-400 font-mono text-base font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Disbursement Method</label>
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="bkash">bKash Disbursed</option>
                  <option value="cash">Cash Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bank Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. City Bank Transfer #TX88102"
                  value={payoutRef}
                  onChange={e => setPayoutRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black uppercase"
                >
                  Log Payout
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutModalInvestor(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
