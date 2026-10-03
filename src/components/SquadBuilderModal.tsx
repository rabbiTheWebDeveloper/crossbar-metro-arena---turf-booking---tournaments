import React, { useState } from 'react';
import { CrossbarLogo } from './CrossbarLogo';
import { VENUE_INFO } from '../data/initialData';
import { X, Users, Share2, Copy, Check, Sparkles, RefreshCw, Shirt, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SquadBuilderModalProps {
  onClose: () => void;
}

interface PlayerNode {
  id: string;
  role: string;
  name: string;
  number: number;
  x: number; // percentage on pitch (0 - 100)
  y: number; // percentage on pitch (0 - 100)
}

export const SquadBuilderModal: React.FC<SquadBuilderModalProps> = ({ onClose }) => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-[#0d151c] to-[#0b1016] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Tag Your Match Squad</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white font-display uppercase">
                Squad Lineup & Tactics
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

        {/* Builder Content */}
        <div className="p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 max-h-[80vh] overflow-y-auto">
          {/* Tactical Pitch Render */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* The Pitch Canvas Container */}
            <div className="w-full max-w-[340px] sm:max-w-[420px] aspect-[3/4.2] bg-gradient-to-b from-[#15803d] to-[#166534] rounded-2xl border-4 border-slate-900 shadow-2xl relative overflow-hidden select-none p-3 sm:p-4 flex flex-col justify-between">
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
              <div className="absolute inset-2 sm:inset-3 border-2 border-white/60 rounded-lg pointer-events-none"></div>
              {/* Half-way line */}
              <div className="absolute top-1/2 left-2 sm:left-3 right-2 sm:right-3 h-0.5 bg-white/60 -translate-y-1/2 pointer-events-none"></div>
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 w-20 sm:w-24 h-20 sm:h-24 border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

              {/* Penalty boxes */}
              <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-12 sm:h-16 border-b-2 border-l-2 border-r-2 border-white/60 rounded-b-lg pointer-events-none"></div>
              <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-12 sm:h-16 border-t-2 border-l-2 border-r-2 border-white/60 rounded-t-lg pointer-events-none"></div>

              {/* Crossbar Metro Arena watermark on pitch */}
              <div className="absolute bottom-14 sm:bottom-16 left-0 right-0 text-center opacity-30 pointer-events-none">
                <div className="text-[10px] sm:text-[12px] font-black tracking-widest text-white uppercase font-display">
                  CROSSBAR METRO ARENA
                </div>
              </div>

              {/* Team Name Header Bar on pitch */}
              <div className="relative z-10 text-center bg-black/60 backdrop-blur-sm py-0.5 sm:py-1 px-2.5 sm:px-3 rounded-full border border-white/20 mx-auto max-w-[85%] truncate">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-300 font-display truncate block">
                  {teamName}
                </span>
              </div>

              {/* Dynamic Interactive Players on Pitch */}
              {players.map((p) => {
                const isSelected = editingPlayerId === p.id;
                const currentKit = kitStyles[kitColor];

                return (
                  <button
                    key={p.id}
                    onClick={() => handleEditPlayer(p)}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-transform hover:scale-110 z-20 group`}
                  >
                    {/* Jersey Circle */}
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${currentKit.bg} ${currentKit.text} font-black text-xs sm:text-sm flex items-center justify-center shadow-lg border-2 ${currentKit.border} ${isSelected ? 'ring-4 ring-yellow-400 scale-110' : ''}`}>
                      {p.number}
                    </div>

                    {/* Player Name Pill */}
                    <div className="mt-0.5 sm:mt-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded bg-black/85 backdrop-blur-sm border border-white/30 text-[9px] sm:text-[11px] font-bold text-white max-w-[65px] sm:max-w-[85px] truncate block group-hover:bg-black">
                      {p.name}
                    </div>
                  </button>
                );
              })}

              {/* Bottom tag on pitch */}
              <div className="relative z-10 text-center">
                <span className="text-[9px] sm:text-[10px] font-semibold text-white/90 bg-emerald-950/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {formation} · Uttara Metro Center
                </span>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-2 text-center">
              💡 Tap any player on pitch to rename or edit jersey number
            </p>
          </div>

          {/* Controls & Squad Management */}
          <div className="lg:col-span-5 space-y-4">
            {/* Squad & Match info */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Your Squad Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Match Tagline / Opponent
              </label>
              <input
                type="text"
                value={matchTag}
                onChange={(e) => setMatchTag(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Jersey Kit Color */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Kit Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['volt', 'black', 'red', 'blue'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setKitColor(k)}
                    className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                      kitColor === k ? 'bg-white/10 border-emerald-400 text-white' : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${kitStyles[k].bg} border border-white/40`}></span>
                    <span>{kitStyles[k].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Selected Player Box */}
            {editingPlayerId && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 animate-in fade-in">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Edit Player Details
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase">Player Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-black/60 border border-white/20 text-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Number</label>
                    <input
                      type="number"
                      value={editNumber}
                      onChange={(e) => setEditNumber(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded bg-black/60 border border-white/20 text-white text-xs font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingPlayerId(null)}
                    className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePlayer}
                    className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Quick Player List */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Starting Roster:
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin pr-1">
                {players.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleEditPlayer(p)}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono font-bold text-emerald-400">#{p.number}</span>
                      <span className="text-white font-medium">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{p.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 space-y-2">
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-green-500/20"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Lineup with Squad on WhatsApp</span>
              </button>

              <button
                onClick={handleCopy}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Squad Lineup Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Lineup Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
