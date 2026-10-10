'use client';
import React, { useState } from 'react';
import { useArena } from '../context/ArenaContext';
import { Smartphone, Download, CheckCircle, X, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
export const InstallAppModal = () => {
    const { showInstallModal, setShowInstallModal } = useArena();
    const [installed, setInstalled] = useState(false);
    if (!showInstallModal)
        return null;
    const handleInstallClick = () => {
        setInstalled(true);
        try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
        catch { }
    };
    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0c131a] border border-white/15 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0c131a] p-6 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Official Web & Mobile App
              </span>
              <h3 className="text-xl font-bold text-white font-display">
                Crossbar Metro App
              </h3>
            </div>
          </div>
          <button onClick={() => setShowInstallModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {installed ? (<div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8"/>
              </div>
              <h4 className="text-lg font-bold text-white">App Ready & Installed!</h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Crossbar Metro Arena icon is now added to your home screen. Experience offline passes, instant slot booking, and live results.
              </p>
              <button type="button" onClick={() => setShowInstallModal(false)} className="py-2.5 px-6 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase">
                Done
              </button>
            </div>) : (<>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <span><strong>12 Slots Live Radar:</strong> Book and pay online with bKash, Nagad or card in seconds.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                  <span><strong>Offline Gate Passes:</strong> Show QR code tickets at the arena counter even without internet.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                  <span><strong>One Unified Database:</strong> Same real-time system across web, mobile, and Google Play app.</span>
                </div>
              </div>

              {/* Install Buttons */}
              <div className="space-y-2.5">
                <button type="button" onClick={handleInstallClick} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer">
                  <Download className="w-4 h-4 text-slate-950"/>
                  <span>Install Web App (PWA) Now</span>
                </button>

                <button type="button" onClick={handleInstallClick} className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer">
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400"/>
                  <span>Google Play App (Ready for Handover)</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                Safe and backed up: secure logins, daily backups, payments checked with SSLCommerz.
              </p>
            </>)}
        </div>
      </div>
    </div>);
};
