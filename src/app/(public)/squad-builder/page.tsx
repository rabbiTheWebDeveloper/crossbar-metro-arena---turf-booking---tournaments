'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CrossbarLogo } from '../../../components/CrossbarLogo';
import { VENUE_INFO } from '../../../data/initialData';
import { Users, Share2, Copy, Check, Sparkles, RefreshCw, Shirt, Calendar, Trophy, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlayerNode {
  id: string;
  role: string;
  name: string;
  number: number;
  x: number; // percentage on pitch (0 - 100)
  y: number; // percentage on pitch (0 - 100)
}

export default function SquadBuilderPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('Uttara Metro Squad');
  const [matchTag, setMatchTag] = useState('Crossbar Metro Arena Kickoff ⚽');
  const [format, setFormat] = useState<'7v7' | '5v5'>('7v7');
  const [formation, setFormation] = useState<'2-3-1' | '3-2-1' | '1-2-1'>('2-3-1');
  const [kitColor, setKitColor] = useState<'volt' | 'black' | 'red' | 'blue'>('volt');
  const [copied, setCopied] = useState(false);

  // Default starting 7
  const initialPlayers7v7: PlayerNode[] = [
    { id: 'p1', role: 'GK', name: 'Tanvir', number: 1, x: 50, y: 88 },
    { id: 'p2', role: 'CB', name: 'Samiul (C)', number: 4, x: 30, y: 70 },
    { id: 'p3', role: 'CB', name: 'Rayhan', number: 5, x: 70, y: 70 },
    { id: 'p4', role: 'CM', name: 'Fahim', number: 8, x: 50, y: 50 },
    { id: 'p5', role: 'LM', name: 'Arafat', number: 11, x: 20, y: 40 },
    { id: 'p6', role: 'RM', name: 'Siam', number: 7, x: 80, y: 40 },
    { id: 'p7', role: 'ST', name: 'Shakil', number: 9, x: 50, y: 20 },
  ];

  const initialPlayers5v5: PlayerNode[] = [
    { id: 'p1', role: 'GK', name: 'Tanvir', number: 1, x: 50, y: 88 },
    { id: 'p2', role: 'CB', name: 'Samiul (C)', number: 4, x: 35, y: 68 },
    { id: 'p3', role: 'CB', name: 'Rayhan', number: 5, x: 65, y: 68 },
    { id: 'p4', role: 'CM', name: 'Fahim', number: 8, x: 50, y: 45 },
    { id: 'p5', role: 'ST', name: 'Shakil', number: 9, x: 50, y: 22 },
  ];

  const [players, setPlayers] = useState<PlayerNode[]>(initialPlayers7v7);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState(10);

  const kitStyles = {
    volt: { bg: 'bg-[#00E676]', text: 'text-black', border: 'border-white', label: 'Crossbar Volt' },
    black: { bg: 'bg-slate-900', text: 'text-emerald-400', border: 'border-emerald-500', label: 'Stealth Black' },
    red: { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-400', label: 'Crimson Fury' },
    blue: { bg: 'bg-sky-500', text: 'text-white', border: 'border-sky-300', label: 'Metro Blue' }
  };

  const handleFormatChange = (newFormat: '7v7' | '5v5') => {
    setFormat(newFormat);
    if (newFormat === '5v5') {
      setPlayers(initialPlayers5v5);
      setFormation('1-2-1');
    } else {
      setPlayers(initialPlayers7v7);
      setFormation('2-3-1');
    }
  };

  const handleEditPlayer = (p: PlayerNode) => {
    setEditingPlayerId(p.id);
    setEditName(p.name);
    setEditNumber(p.number);
  };

  const handleSavePlayer = () => {
    if (!editingPlayerId) return;
    setPlayers(players.map(p => p.id === editingPlayerId ? { ...p, name: editName, number: editNumber } : p));
    setEditingPlayerId(null);
  };

  const generateWhatsAppShare = () => {
    let squadText = `⚽ *${teamName.toUpperCase()} - MATCH SQUAD* ⚽\n`;
    squadText += `🏟️ *Venue:* Crossbar Metro Arena, Uttara Sector 17, Dhaka\n`;
    squadText += `🔥 *Note:* ${matchTag}\n\n`;
    squadText += `*Starting Lineup (${format} - ${formation}):*\n`;
    players.forEach(p => {
      squadText += `• #${p.number} ${p.name} (${p.role})\n`;
    });
    squadText += `\nTag your squad & meet at Crossbar Metro Arena! 🏗️ ⚽ 🔥`;
    return squadText;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateWhatsAppShare());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(generateWhatsAppShare());
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Tactical Room</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight text-white">
            Squad Lineup &amp; Tactics Board
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-2xl">
            Pick your 7v7 or 5v5 tactical setup, assign player jersey numbers and captain armbands, customize kit color, and export or share via WhatsApp with your squad.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/booking')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-black hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Turf For Squad</span>
          </button>
        </div>
      </div>

      {/* Main Tactical Pitch Workspace */}
      <div className="bg-[#0b1016] border border-emerald-500/30 rounded-3xl p-4 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Pitch Container */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-[420px] aspect-[3/4.2] bg-gradient-to-b from-[#15803d] to-[#166534] rounded-2xl border-4 border-slate-900 shadow-2xl relative overflow-hidden select-none p-4 flex flex-col justify-between">
              {/* Pitch Grass Stripes */}
              <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40">
                <div className="flex-1 bg-emerald-500/20"></div>
                <div className="flex-1 bg-emerald-700/20"></div>
                <div className="flex-1 bg-emerald-500/20"></div>
                <div className="flex-1 bg-emerald-700/20"></div>
                <div className="flex-1 bg-emerald-500/20"></div>
                <div className="flex-1 bg-emerald-700/20"></div>
              </div>

              {/* Pitch Markings */}
              <div className="absolute inset-3 border-2 border-white/60 rounded-lg pointer-events-none"></div>
              <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-white/60 -translate-y-1/2 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-36 h-16 border-b-2 border-l-2 border-r-2 border-white/60 rounded-b-lg pointer-events-none"></div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-36 h-16 border-t-2 border-l-2 border-r-2 border-white/60 rounded-t-lg pointer-events-none"></div>

              {/* Watermark */}
              <div className="absolute bottom-16 left-0 right-0 text-center opacity-30 pointer-events-none">
                <div className="text-xs font-black tracking-widest text-white uppercase font-display">
                  CROSSBAR METRO ARENA
                </div>
              </div>

              {/* Pitch Top Banner */}
              <div className="relative z-10 flex items-center justify-between bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                <div className="truncate">
                  <div className="text-xs font-extrabold text-white uppercase truncate">{teamName}</div>
                  <div className="text-[10px] text-emerald-400 font-mono truncate">{matchTag}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-slate-300 uppercase">{format}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">{formation}</div>
                </div>
              </div>

              {/* Interactive Player Pins */}
              <div className="absolute inset-0 pt-12 pb-14 px-6 pointer-events-auto">
                {players.map((p) => {
                  const currentKit = kitStyles[kitColor];
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleEditPlayer(p)}
                      style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="cursor-pointer group flex flex-col items-center transition-all hover:scale-110 active:scale-95"
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${currentKit.bg} ${currentKit.border} border-2 shadow-lg flex items-center justify-center font-black ${currentKit.text} font-mono text-xs sm:text-sm`}>
                        {p.number}
                      </div>
                      <div className="mt-1 bg-black/80 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold text-white whitespace-nowrap border border-white/20 shadow">
                        {p.name} <span className="text-emerald-400">({p.role})</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pitch Bottom Footer */}
              <div className="relative z-10 text-center">
                <span className="text-[10px] font-medium text-white/70 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  Click any player node to edit name &amp; number
                </span>
              </div>
            </div>
          </div>

          {/* Controls & Squad Settings */}
          <div className="lg:col-span-6 space-y-6">
            {/* Squad Details Card */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white uppercase font-display flex items-center gap-2">
                <Shirt className="w-4 h-4 text-emerald-400" />
                <span>Squad &amp; Match Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Match Tag / Description</label>
                  <input
                    type="text"
                    value={matchTag}
                    onChange={(e) => setMatchTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Format & Formation Selector */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Format</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleFormatChange('7v7')}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        format === '7v7'
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      7 vs 7
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatChange('5v5')}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        format === '5v5'
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      5 vs 5
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Kit Color</label>
                  <div className="flex gap-2">
                    {(Object.keys(kitStyles) as (keyof typeof kitStyles)[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKitColor(k)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${kitStyles[k].bg} ${
                          kitColor === k ? 'scale-125 border-white ring-2 ring-emerald-500' : 'border-transparent'
                        }`}
                        title={kitStyles[k].label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Player Editor Modal/Form */}
            {editingPlayerId && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase">
                    Editing Player Position
                  </span>
                  <button
                    onClick={() => setEditingPlayerId(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Player Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="No."
                      value={editNumber}
                      onChange={(e) => setEditNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSavePlayer}
                  className="w-full py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors"
                >
                  Save Player
                </button>
              </div>
            )}

            {/* Export & Share Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Lineup Card on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Lineup Copied to Clipboard!' : 'Copy Formatted Squad Text'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
