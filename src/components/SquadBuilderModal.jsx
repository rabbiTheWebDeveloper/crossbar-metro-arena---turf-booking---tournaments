'use client';
import React, { useState, useMemo } from 'react';
import { X, Users, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { useArena, cleanPhone } from '../context/ArenaContext';

// 7v7 (2-3-1) pitch template: GK first, then defence, midfield, attack
const PITCH_TEMPLATE = [
    { role: 'GK', x: 50, y: 88 },
    { role: 'CB', x: 30, y: 70 },
    { role: 'CB', x: 70, y: 70 },
    { role: 'CM', x: 50, y: 50 },
    { role: 'LM', x: 20, y: 40 },
    { role: 'RM', x: 80, y: 40 },
    { role: 'ST', x: 50, y: 20 }
];
const SAMPLE_PLAYERS = [
    { id: 'p1', role: 'GK', name: 'Tanvir', number: 1, x: 50, y: 88 },
    { id: 'p2', role: 'CB', name: 'Samiul (C)', number: 4, x: 30, y: 70 },
    { id: 'p3', role: 'CB', name: 'Rayhan', number: 5, x: 70, y: 70 },
    { id: 'p4', role: 'CM', name: 'Fahim', number: 8, x: 50, y: 50 },
    { id: 'p5', role: 'LM', name: 'Arafat', number: 11, x: 20, y: 40 },
    { id: 'p6', role: 'RM', name: 'Siam', number: 7, x: 80, y: 40 },
    { id: 'p7', role: 'ST', name: 'Shakil', number: 9, x: 50, y: 20 }
];
const POS_ORDER = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
const KIT_STYLES = {
    volt: { bg: 'bg-[#00E676]', text: 'text-black', border: 'border-white', label: 'Crossbar Volt' },
    black: { bg: 'bg-slate-900', text: 'text-emerald-400', border: 'border-emerald-500', label: 'Stealth Black' },
    red: { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-400', label: 'Crimson Fury' },
    blue: { bg: 'bg-sky-500', text: 'text-white', border: 'border-sky-300', label: 'Metro Blue' }
};

/** Build pitch markers from a real roster: GK first, then DEF/MID/FWD, placed on the 2-3-1 template. */
const seedFromRoster = (roster) => {
    const sorted = (roster || []).filter(p => p && p.name).slice().sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9));
    return sorted.slice(0, PITCH_TEMPLATE.length).map((p, i) => ({
        id: String(p.id || `rp-${i}`),
        role: p.position || PITCH_TEMPLATE[i].role,
        name: p.role === 'Captain' ? `${p.name} (C)` : p.name,
        number: Number(p.number) || i + 1,
        x: PITCH_TEMPLATE[i].x,
        y: PITCH_TEMPLATE[i].y
    }));
};

export const SquadBuilderModal = ({ onClose }) => {
    const { teams, currentUser, isVisitor } = useArena();
    // The user's own team (profile teamId, or a team they captain) when available
    const myTeam = useMemo(() => {
        if (isVisitor) return null;
        const phone = cleanPhone(currentUser?.phone);
        return (teams || []).find(t => String(t.id) === String(currentUser?.teamId || '')
            || (phone && t.captainPhone && cleanPhone(t.captainPhone) === phone)) || null;
    }, [teams, currentUser, isVisitor]);
    const seeded = useMemo(() => (myTeam && (myTeam.players || []).length > 0 ? seedFromRoster(myTeam.players) : null), [myTeam]);
    const isSample = !seeded;

    const [teamName, setTeamName] = useState(myTeam?.name || 'Uttara Metro Squad');
    const [matchTag, setMatchTag] = useState('Crossbar Metro Arena Kickoff');
    const [kitColor, setKitColor] = useState('volt');
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState('');
    const [players, setPlayers] = useState(seeded || SAMPLE_PLAYERS);
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editNumber, setEditNumber] = useState(10);
    const format = '7v7';
    const formation = '2-3-1';

    const handleEditPlayer = (p) => {
        setEditingPlayerId(p.id);
        setEditName(p.name);
        setEditNumber(p.number);
    };
    const handleSavePlayer = () => {
        if (!editingPlayerId) return;
        setPlayers(players.map(p => p.id === editingPlayerId ? { ...p, name: editName.trim() || p.name, number: Math.max(0, Math.min(99, Number(editNumber) || 0)) } : p));
        setEditingPlayerId(null);
    };
    const generateWhatsAppShare = () => {
        let squadText = `⚽ *${teamName.toUpperCase()} - MATCH SQUAD* ⚽\n`;
        squadText += `🏟️ *Venue:* Crossbar Metro Arena, Uttara, Dhaka\n`;
        squadText += `🔥 *Note:* ${matchTag}\n\n`;
        squadText += `*Starting Lineup (${format} - ${formation}):*\n`;
        players.forEach(p => { squadText += `• #${p.number} ${p.name} (${p.role})\n`; });
        squadText += `\nTag your squad & meet at Crossbar Metro Arena!`;
        return squadText;
    };
    const handleCopy = async () => {
        setCopyError('');
        try {
            if (!navigator?.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(generateWhatsAppShare());
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            setCopyError('Could not copy automatically. Use the WhatsApp button or copy the lineup manually.');
        }
    };
    const handleShareWhatsApp = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(generateWhatsAppShare())}`, '_blank', 'noopener');
    };
    const currentKit = KIT_STYLES[kitColor];

    return (<div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-[#0b1016] border border-emerald-500/40 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-950 via-[#0d151c] to-[#0b1016] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400"/>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5"/>
                <span>Tag Your Match Squad</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white font-display uppercase">Squad Lineup &amp; Tactics</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 max-h-[80vh] overflow-y-auto">
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-[340px] sm:max-w-[420px] aspect-[3/4.2] bg-gradient-to-b from-[#15803d] to-[#166534] rounded-2xl border-4 border-slate-900 shadow-2xl relative overflow-hidden select-none p-3 sm:p-4 flex flex-col justify-between">
              <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40">
                <div className="flex-1 bg-emerald-500/20"></div>
                <div className="flex-1 bg-emerald-700/20"></div>
                <div className="flex-1 bg-emerald-500/20"></div>
                <div className="flex-1 bg-emerald-700/20"></div>
                <div className="flex-1 bg-emerald-500/20"></div>
                <div className="flex-1 bg-emerald-700/20"></div>
              </div>
              <div className="absolute inset-2 sm:inset-3 border-2 border-white/60 rounded-lg pointer-events-none"></div>
              <div className="absolute top-1/2 left-2 sm:left-3 right-2 sm:right-3 h-0.5 bg-white/60 -translate-y-1/2 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 w-20 sm:w-24 h-20 sm:h-24 border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-12 sm:h-16 border-b-2 border-l-2 border-r-2 border-white/60 rounded-b-lg pointer-events-none"></div>
              <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-12 sm:h-16 border-t-2 border-l-2 border-r-2 border-white/60 rounded-t-lg pointer-events-none"></div>
              <div className="absolute bottom-14 sm:bottom-16 left-0 right-0 text-center opacity-30 pointer-events-none">
                <div className="text-[11px] sm:text-[12px] font-black tracking-widest text-white uppercase font-display">CROSSBAR METRO ARENA</div>
              </div>

              <div className="relative z-10 text-center bg-black/60 backdrop-blur-sm py-0.5 sm:py-1 px-2.5 sm:px-3 rounded-full border border-white/20 mx-auto max-w-[85%] truncate">
                <span className="text-[12px] sm:text-xs font-black uppercase tracking-wider text-emerald-300 font-display truncate block">{teamName}</span>
              </div>

              {players.map((p) => {
                const isSelected = editingPlayerId === p.id;
                return (<button key={p.id} type="button" onClick={() => handleEditPlayer(p)} style={{ left: `${p.x}%`, top: `${p.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-transform hover:scale-110 z-20 group">
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full ${currentKit.bg} ${currentKit.text} font-black text-xs sm:text-sm flex items-center justify-center shadow-lg border-2 ${currentKit.border} ${isSelected ? 'ring-4 ring-yellow-400 scale-110' : ''}`}>
                      {p.number}
                    </div>
                    <div className="mt-0.5 sm:mt-1 px-1.5 sm:px-2 py-0.5 rounded bg-black/85 backdrop-blur-sm border border-white/30 text-[10px] sm:text-[12px] font-bold text-white max-w-[65px] sm:max-w-[85px] truncate block group-hover:bg-black">
                      {p.name}
                    </div>
                  </button>);
              })}

              <div className="relative z-10 text-center">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 bg-emerald-950/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-500/30">{formation} · Uttara</span>
              </div>
            </div>
            <p className="text-[12px] sm:text-xs text-slate-400 mt-2 text-center">
              {isSample ? 'Sample squad shown. Tap any player on the pitch to rename or edit the jersey number.' : 'Lineup seeded from your registered roster. Tap any player to adjust name or number.'}
            </p>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Your Squad Name</label>
              <input type="text" maxLength={60} value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Match Tagline / Opponent</label>
              <input type="text" maxLength={120} value={matchTag} onChange={(e) => setMatchTag(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:border-emerald-500 focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Kit Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(KIT_STYLES).map((k) => (<button key={k} type="button" onClick={() => setKitColor(k)} className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 cursor-pointer ${kitColor === k ? 'bg-white/10 border-emerald-400 text-white' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full ${KIT_STYLES[k].bg} border border-white/40`}></span>
                    <span>{KIT_STYLES[k].label}</span>
                  </button>))}
              </div>
            </div>

            {editingPlayerId && (<div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 animate-in fade-in">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Edit Player Details</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-400 uppercase">Player Name</label>
                    <input type="text" maxLength={40} value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2.5 py-1.5 rounded bg-black/60 border border-white/20 text-white text-xs font-semibold"/>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase">Number</label>
                    <input type="number" min={0} max={99} value={editNumber} onChange={(e) => setEditNumber(Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded bg-black/60 border border-white/20 text-white text-xs font-mono font-bold"/>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setEditingPlayerId(null)} className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white cursor-pointer">Cancel</button>
                  <button type="button" onClick={handleSavePlayer} className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer">Save</button>
                </div>
              </div>)}

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Starting Roster</div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${isSample ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                  {isSample ? 'Sample squad' : `From ${myTeam.name}`}
                </span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin pr-1">
                {players.map((p) => (<div key={p.id} role="button" tabIndex={0} onClick={() => handleEditPlayer(p)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEditPlayer(p); } }} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono font-bold text-emerald-400">#{p.number}</span>
                      <span className="text-white font-medium">{p.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">{p.role}</span>
                  </div>))}
              </div>
            </div>

            {copyError && <div className="text-[11px] text-rose-300">{copyError}</div>}
            <div className="pt-3 space-y-2">
              <button type="button" onClick={handleShareWhatsApp} className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-green-500/20">
                <Share2 className="w-4 h-4"/>
                <span>Share Lineup with Squad on WhatsApp</span>
              </button>
              <button type="button" onClick={handleCopy} className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10">
                {copied ? (<><Check className="w-4 h-4 text-emerald-400"/><span className="text-emerald-400">Squad Lineup Copied!</span></>) : (<><Copy className="w-4 h-4"/><span>Copy Lineup Text</span></>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>);
};
