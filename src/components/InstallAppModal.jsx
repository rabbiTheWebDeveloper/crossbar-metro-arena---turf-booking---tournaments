'use client';
import React, { useState, useEffect } from 'react';
import { useArena } from '../context/ArenaContext';
import { Smartphone, Download, CheckCircle, X, Share, PlusSquare, MoreVertical } from 'lucide-react';
import { getStoredInstallPrompt, subscribeInstallPrompt, isStandaloneDisplay, isIosSafari } from './Navbar';

/**
 * Real PWA install dialog.
 * - Chrome/Edge/Android: uses the captured `beforeinstallprompt` event (see Navbar.jsx) and calls prompt().
 * - iOS Safari: shows "Add to Home Screen" instructions (iOS has no install prompt API).
 * - Already installed: says so.
 */
export const InstallAppModal = () => {
    const { setShowInstallModal, showNotice } = useArena();
    const [promptEvent, setPromptEvent] = useState(() => getStoredInstallPrompt());
    const [installed, setInstalled] = useState(() => isStandaloneDisplay());
    const [busy, setBusy] = useState(false);
    const ios = isIosSafari();

    useEffect(() => {
        const unsubscribe = subscribeInstallPrompt(setPromptEvent);
        const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
        window.addEventListener('appinstalled', onInstalled);
        const onKey = (e) => { if (e.key === 'Escape') setShowInstallModal(false); };
        window.addEventListener('keydown', onKey);
        return () => { unsubscribe(); window.removeEventListener('appinstalled', onInstalled); window.removeEventListener('keydown', onKey); };
    }, [setShowInstallModal]);

    const handleInstallClick = async () => {
        if (!promptEvent) return;
        setBusy(true);
        try {
            promptEvent.prompt();
            const choice = await promptEvent.userChoice;
            if (choice?.outcome === 'accepted') {
                setInstalled(true);
                showNotice('success', 'Crossbar Metro Arena is being added to your home screen.');
            }
            else {
                showNotice('info', 'Install cancelled. You can install the app any time from this menu.');
            }
        }
        catch {
            showNotice('error', 'Your browser did not open the install prompt. Use the browser menu to add this site to your home screen.');
        }
        finally {
            setPromptEvent(null);
            setBusy(false);
        }
    };

    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="relative bg-[#0c131a] border border-white/15 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0c131a] p-6 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-6 h-6"/>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Web App</span>
              <h3 id="install-title" className="text-xl font-bold text-white font-display">Crossbar Metro Arena</h3>
            </div>
          </div>
          <button type="button" onClick={() => setShowInstallModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {installed ? (<div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8"/>
              </div>
              <h4 className="text-lg font-bold text-white">App installed</h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Crossbar Metro Arena is on your home screen. Open it from there for quick slot booking and results.
              </p>
              <button type="button" onClick={() => setShowInstallModal(false)} className="py-2.5 px-6 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase cursor-pointer">
                Done
              </button>
            </div>) : (<>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <span><strong>Quick booking:</strong> open the arena from your home screen and book a slot in seconds.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                  <span><strong>Your passes:</strong> booking codes and ticket passes are always one tap away.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                  <span><strong>Same account:</strong> it is this website, installed. No separate download or store needed.</span>
                </div>
              </div>

              {promptEvent ? (<button type="button" onClick={handleInstallClick} disabled={busy} className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50">
                  <Download className="w-4 h-4 text-slate-950"/>
                  <span>{busy ? 'Opening install prompt...' : 'Install App'}</span>
                </button>) : ios ? (<div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-slate-200 space-y-2.5">
                  <div className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">Add to Home Screen on iPhone / iPad</div>
                  <ol className="space-y-2 list-none">
                    <li className="flex items-center gap-2"><span className="font-bold text-emerald-400">1.</span> Tap the <Share className="w-4 h-4 inline text-sky-400"/> <strong>Share</strong> button in Safari.</li>
                    <li className="flex items-center gap-2"><span className="font-bold text-emerald-400">2.</span> Choose <PlusSquare className="w-4 h-4 inline text-slate-300"/> <strong>Add to Home Screen</strong>.</li>
                    <li className="flex items-center gap-2"><span className="font-bold text-emerald-400">3.</span> Tap <strong>Add</strong>. The arena icon appears on your home screen.</li>
                  </ol>
                </div>) : (<div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 space-y-2">
                  <div className="font-bold text-white">Install from your browser menu</div>
                  <p>Open the browser menu (<MoreVertical className="w-3.5 h-3.5 inline text-slate-300"/>) and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. If the option is missing, your browser does not support installing web apps, but the site works the same in a tab.</p>
                </div>)}

              <p className="text-[12px] text-center text-slate-400">
                Installing adds a shortcut to this website. It uses the same secure login and payments.
              </p>
            </>)}
        </div>
      </div>
    </div>);
};
