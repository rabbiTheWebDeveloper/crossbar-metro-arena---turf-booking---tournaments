'use client';

import React, { useState } from 'react';
import { useArena } from '../context/ArenaContext';
import { Booking } from '../types';
import {
  X,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SSLCommerzModal: React.FC = () => {
  const {
    showSSLCommerzModal,
    setShowSSLCommerzModal,
    pendingBookingData,
    setPendingBookingData,
    handleBookingSuccess,
    sendSMSNotification,
    handleRecordRefund,
    bookings,
    slotHolds
  } = useArena();

  const [paymentTab, setPaymentTab] = useState<'mfs' | 'cards' | 'netbanking'>('mfs');
  const [selectedMfs, setSelectedMfs] = useState<'bkash' | 'nagad' | 'rocket' | 'upay'>('bkash');
  const [mfsNumber, setMfsNumber] = useState('01844332211');
  const [mfsPin, setMfsPin] = useState('1234');
  const [step, setStep] = useState<'checkout' | 'verifying' | 'success' | 'failed' | 'expired_hold'>('checkout');
  const [statusLog, setStatusLog] = useState('');

  if (!showSSLCommerzModal || !pendingBookingData) return null;

  const payableAmount = pendingBookingData.paymentType === 'advance_500'
    ? (pendingBookingData.advanceAmount || 500)
    : (pendingBookingData.totalPrice || 2500);

  const tranId = `SSLCZ-TRX-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleClose = () => {
    setShowSSLCommerzModal(false);
    setPendingBookingData(null);
    setStep('checkout');
  };

  // 1. Success Simulation (Validates server-side, confirms booking, sends SMS)
  const handleSimulateSuccess = () => {
    setStep('verifying');
    setStatusLog('Validating transaction with SSLCommerz Server Validation API...');

    setTimeout(() => {
      // Check if slot was taken in the meantime
      const slotTaken = bookings.some(
        b => b.date === pendingBookingData.date &&
             b.slotNumber === pendingBookingData.slotNumber &&
             b.paymentStatus !== 'cancelled'
      );

      if (slotTaken) {
        setStep('expired_hold');
        setStatusLog('Slot was already booked by another user while payment was in progress.');
        return;
      }

      const confirmedBooking: Booking = {
        id: `book-${Date.now()}`,
        bookingCode: pendingBookingData.bookingCode || `CMA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        courtId: pendingBookingData.courtId || 'main-turf',
        courtName: pendingBookingData.courtName || 'Crossbar Metro Arena (Main Turf)',
        date: pendingBookingData.date!,
        slotNumber: pendingBookingData.slotNumber!,
        startTime: pendingBookingData.startTime!,
        endTime: pendingBookingData.endTime!,
        displayTime: pendingBookingData.displayTime!,
        captainName: pendingBookingData.captainName || 'Player Team',
        captainPhone: pendingBookingData.captainPhone || '01844-332211',
        teamName: pendingBookingData.teamName || 'Squad FC',
        playerCount: pendingBookingData.playerCount || 14,
        matchType: pendingBookingData.matchType || 'friendly',
        addOns: pendingBookingData.addOns || [],
        courtPrice: pendingBookingData.courtPrice || 2500,
        addOnsPrice: pendingBookingData.addOnsPrice || 0,
        totalPrice: pendingBookingData.totalPrice || 2500,
        paymentType: pendingBookingData.paymentType || 'advance_500',
        advanceAmount: payableAmount,
        dueAmount: Math.max(0, (pendingBookingData.totalPrice || 2500) - payableAmount),
        paymentMethod: selectedMfs,
        paymentStatus: pendingBookingData.paymentType === 'full_payment' ? 'paid_full' : 'paid_advance',
        transactionId: tranId,
        notes: pendingBookingData.notes,
        createdAt: new Date().toISOString()
      };

      handleBookingSuccess(confirmedBooking);
      setStep('success');

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }, 1200);
  };

  // 2. Failure Simulation
  const handleSimulateFailure = () => {
    setStep('verifying');
    setStatusLog('Processing MFS Gateway authentication...');
    setTimeout(() => {
      setStep('failed');
      setStatusLog('MFS Gateway Error: Transaction declined by provider (Insufficient balance or invalid PIN).');
    }, 1000);
  };

  // 3. Late Hold Expired Simulation (Slot taken by someone else)
  const handleSimulateLateExpired = () => {
    setStep('verifying');
    setStatusLog('Hold expired during checkout. Checking slot status...');
    setTimeout(() => {
      setStep('expired_hold');
      // Save booking in needs_refund status and alert arena admin
      const refundBooking: Booking = {
        id: `book-late-${Date.now()}`,
        bookingCode: `CMA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        courtId: pendingBookingData.courtId || 'main-turf',
        courtName: pendingBookingData.courtName || 'Crossbar Metro Arena (Main Turf)',
        date: pendingBookingData.date!,
        slotNumber: pendingBookingData.slotNumber!,
        startTime: pendingBookingData.startTime!,
        endTime: pendingBookingData.endTime!,
        displayTime: pendingBookingData.displayTime!,
        captainName: pendingBookingData.captainName || 'Player Team',
        captainPhone: pendingBookingData.captainPhone || '01844-332211',
        teamName: pendingBookingData.teamName || 'Squad FC',
        playerCount: 14,
        matchType: 'friendly',
        addOns: [],
        courtPrice: pendingBookingData.courtPrice || 2500,
        addOnsPrice: 0,
        totalPrice: pendingBookingData.totalPrice || 2500,
        paymentType: 'advance_500',
        advanceAmount: payableAmount,
        dueAmount: 0,
        paymentMethod: selectedMfs,
        paymentStatus: 'needs_refund',
        transactionId: tranId,
        notes: 'Payment arrived after 10-minute hold expired; slot conflict.',
        createdAt: new Date().toISOString()
      };
      handleBookingSuccess(refundBooking);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0c131c] border border-emerald-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Gateway Brand Header */}
        <div className="bg-[#101b2b] px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs font-mono">
              SSL
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>SSLCOMMERZ</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                  Sandbox Secure
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Merchant: <strong>Crossbar Metro Arena</strong>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Payment Summary */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/40 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Slot #{pendingBookingData.slotNumber} · {pendingBookingData.displayTime}</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {pendingBookingData.teamName} · {pendingBookingData.date}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Payable Amount</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              ৳{payableAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Checkout Content */}
        {step === 'checkout' && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl text-xs font-bold border border-white/10">
              <button
                type="button"
                onClick={() => setPaymentTab('mfs')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentTab === 'mfs' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Banking</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('cards')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentTab === 'cards' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('netbanking')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentTab === 'netbanking' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Net Banking</span>
              </button>
            </div>

            {/* MFS Providers selection */}
            {paymentTab === 'mfs' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'bkash', name: 'bKash', color: 'from-[#E2136E] to-[#b00f55]', border: 'border-pink-500/50' },
                    { id: 'nagad', name: 'Nagad', color: 'from-[#F7941D] to-[#d67b0d]', border: 'border-orange-500/50' },
                    { id: 'rocket', name: 'Rocket', color: 'from-[#8C3494] to-[#6a2471]', border: 'border-purple-500/50' },
                    { id: 'upay', name: 'Upay', color: 'from-[#0066B3] to-[#004e8a]', border: 'border-blue-500/50' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedMfs(p.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedMfs === p.id
                          ? `bg-gradient-to-br ${p.color} text-white font-black shadow-lg ${p.border}`
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.name}</div>
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {selectedMfs.toUpperCase()} Wallet Number
                    </label>
                    <input
                      type="tel"
                      value={mfsNumber}
                      onChange={e => setMfsNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sandbox PIN
                    </label>
                    <input
                      type="password"
                      value={mfsPin}
                      onChange={e => setMfsPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cards selection */}
            {paymentTab === 'cards' && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="text-xs text-slate-300 font-bold mb-1">Accepted Cards</div>
                <div className="text-xs text-slate-400">VISA · MasterCard · American Express · UnionPay</div>
                <input
                  type="text"
                  placeholder="Card Number: 4111 2222 3333 4444"
                  defaultValue="4111 2222 3333 4444"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs"
                />
              </div>
            )}

            {/* Net banking */}
            {paymentTab === 'netbanking' && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-xs text-slate-300 font-bold">Select Internet Banking Portal</div>
                <select className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs">
                  <option>City Touch (City Bank)</option>
                  <option>BRAC Bank Astha</option>
                  <option>Islami Bank CellFin</option>
                  <option>Dutch-Bangla Bank NexusPay</option>
                </select>
              </div>
            )}

            {/* Test Simulation Controls (For Section 11 Acceptance Testing) */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>SSLCommerz Sandbox Test Actions</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-center transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Confirm Payment
                </button>
                <button
                  type="button"
                  onClick={handleSimulateFailure}
                  className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition-colors cursor-pointer"
                >
                  Test Fail
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                >
                  User Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulateLateExpired}
                  className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                >
                  Test Expired Hold
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verifying step */}
        {step === 'verifying' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto"></div>
            <div className="text-base font-bold text-white">Validating with SSLCommerz...</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">{statusLog}</p>
          </div>
        )}

        {/* Success step */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white font-display uppercase tracking-wide">
              Payment Validated &amp; Slot Locked!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Your payment of <strong className="text-emerald-400">৳{payableAmount.toLocaleString()}</strong> has been verified via SSLCommerz validation API. Transaction ID: <span className="font-mono text-white font-bold">{tranId}</span>.
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
              An SMS confirmation pass has been dispatched to <strong>{pendingBookingData.captainPhone}</strong>.
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              View Match Day Pass Ticket
            </button>
          </div>
        )}

        {/* Failed step */}
        {step === 'failed' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 mx-auto">
              <X className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white font-display uppercase tracking-wide">
              Payment Incomplete
            </h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto">
              {statusLog}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Late Payment after hold expired */}
        {step === 'expired_hold' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white font-display uppercase tracking-wide">
              Hold Expired · Money in Refund Queue
            </h3>
            <p className="text-xs text-amber-200 max-w-md mx-auto">
              Your 10-minute hold window expired and another squad booked the slot. Your payment of <strong>৳{payableAmount.toLocaleString()}</strong> has been safely recorded in the <strong>Admin Refund Queue</strong>.
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
              The arena management has been alerted and will process your full refund via bKash/Nagad.
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Acknowledge &amp; Pick Another Slot
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
