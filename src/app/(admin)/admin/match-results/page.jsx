'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Trash2 } from 'lucide-react';
export const dynamic = 'force-dynamic';

const TABS = [
    { key: 'pending_approval', label: 'Pending' },
    { key: 'published', label: 'Published' },
    { key: 'rejected', label: 'Rejected' }
];
const EMPTY_COPY = {
    pending_approval: 'No scorecards waiting for approval. Captain submissions appear here when "Approve match results first" is on.',
    published: 'No published results yet. Approved scorelines show here and feed the public league table.',
    rejected: 'No rejected results. Rejected scorelines stay here for reference and can be deleted.'
};
const EVENT_LABEL = { goal: 'Goal', own_goal: 'Own goal', assist: 'Assist', yellow: 'Yellow card', red: 'Red card' };
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};

export default function AdminMatchResultsPage() {
    const { matchResults, handleSaveMatchResult, handleDeleteMatchResult, showNotice, isLoadingData, pricing } = useArena();
    const [tab, setTab] = useState('pending_approval');
    const [busyId, setBusyId] = useState(null);

    const counts = useMemo(() => ({
        pending_approval: matchResults.filter(r => r.status === 'pending_approval').length,
        published: matchResults.filter(r => r.status === 'published').length,
        rejected: matchResults.filter(r => r.status === 'rejected').length
    }), [matchResults]);

    const list = useMemo(() => matchResults
        .filter(r => r.status === tab)
        .sort((a, b) => (a.date === b.date ? String(b.postedAt || '').localeCompare(String(a.postedAt || '')) : (a.date < b.date ? 1 : -1))), [matchResults, tab]);

    const setStatus = async (res, status) => {
        if (busyId) return;
        if (status === 'rejected' && !confirm(`Reject the ${res.homeTeam} vs ${res.awayTeam} scoreline? It will not count in the league table.`)) return;
        setBusyId(res.id);
        const r = await handleSaveMatchResult({ id: res.id, status });
        setBusyId(null);
        if (!r?.ok) showNotice('error', r?.error || 'Could not update the result.');
    };
    const remove = async (res) => {
        if (busyId) return;
        if (!confirm(`Delete the ${res.homeTeam} vs ${res.awayTeam} result permanently?${res.status === 'published' ? ' Team stats from this match will be reversed.' : ''}`)) return;
        setBusyId(res.id);
        const r = await handleDeleteMatchResult(res.id);
        setBusyId(null);
        if (r?.ok) showNotice('success', 'Match result deleted');
    };

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <h2 className="text-xl font-black text-white font-display">
          Match Results &amp; Leaderboard Review
        </h2>
        <p className="text-xs text-slate-400">
          Approve scorelines submitted by captains before they feed the public tables and squad rankings.
          {pricing?.approveResultsFirst === false && (<span className="text-amber-300"> Approval is currently off (Slot pricing &rarr; rules): new submissions publish immediately.</span>)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        {TABS.map(t => (<button key={t.key} type="button" onClick={() => setTab(t.key)} className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${tab === t.key ? 'bg-lime-400 text-slate-950 font-black' : 'bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white'}`}>
            <span>{t.label}</span>
            <span className={`px-1.5 rounded-full font-mono text-[10px] ${tab === t.key ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-400'}`}>{counts[t.key]}</span>
          </button>))}
      </div>

      {isLoadingData && matchResults.length === 0 ? (<div className="space-y-3 animate-pulse">{[0, 1, 2].map(i => <div key={i} className="h-36 rounded-3xl bg-[#0c131a] border border-white/5"/>)}</div>)
      : list.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
          {EMPTY_COPY[tab]}
        </div>) : (<div className="space-y-3">
          {list.map(res => {
                const isPublished = res.status === 'published';
                const isPending = res.status === 'pending_approval';
                const isRejected = res.status === 'rejected';
                const isBusy = busyId === res.id;
                const events = Array.isArray(res.events) ? res.events : [];
                const scorers = Array.isArray(res.scorers) ? res.scorers : [];
                const cardClass = isPublished ? 'bg-[#0a1210] border-emerald-500/30' : isRejected ? 'bg-[#120a0a]/70 border-rose-500/25 opacity-80' : 'bg-[#0c131a] border-amber-400/30';
                const pillClass = isPublished ? 'bg-emerald-500/20 text-emerald-300' : isRejected ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-400/20 text-amber-300';
                return (<div key={res.id} className={`p-4 sm:p-5 rounded-3xl border transition-all text-xs space-y-3 ${cardClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase truncate">
                    {res.date ? parseLocalDate(res.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · {res.slotDisplay} · {res.matchType}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase shrink-0 ${pillClass}`}>
                    {String(res.status || '').replaceAll('_', ' ')}
                  </span>
                </div>

                {/* Scoreline */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="text-right font-bold text-sm sm:text-base text-white flex-1 truncate">
                    {res.homeTeam}
                  </div>
                  <div className={`px-4 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono font-black text-xl ${isRejected ? 'text-slate-500 line-through' : 'text-lime-400'}`}>
                    {res.homeScore} : {res.awayScore}
                  </div>
                  <div className="text-left font-bold text-sm sm:text-base text-white flex-1 truncate">
                    {res.awayTeam}
                  </div>
                </div>

                {/* Events / scorers */}
                {(events.length > 0 || scorers.length > 0) && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    {events.length > 0 ? (<>
                        <div className="space-y-0.5">
                          {events.filter(ev => ev.side === 'home').map((ev, i) => (<div key={`h-${i}`} className="text-slate-300"><span className="text-slate-500">{ev.minute != null ? `${ev.minute}'` : ''}</span> {ev.playerName} <span className="text-slate-500">· {EVENT_LABEL[ev.type] || ev.type}</span></div>))}
                        </div>
                        <div className="space-y-0.5 sm:text-right">
                          {events.filter(ev => ev.side === 'away').map((ev, i) => (<div key={`a-${i}`} className="text-slate-300"><span className="text-slate-500">· {EVENT_LABEL[ev.type] || ev.type}</span> {ev.playerName} <span className="text-slate-500">{ev.minute != null ? `${ev.minute}'` : ''}</span></div>))}
                        </div>
                      </>) : (<div className="sm:col-span-2 text-slate-300">
                        Scorers: {scorers.map((s, i) => (<span key={i}>{i > 0 ? ', ' : ''}{s.playerName} ({s.teamName}{s.minute != null ? `, ${s.minute}'` : ''})</span>))}
                      </div>)}
                  </div>)}

                {res.matchReport ? <p className="text-[11px] text-slate-400 italic line-clamp-3">{res.matchReport}</p> : null}

                {/* Details */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-400 pt-2 border-t border-white/5">
                  <div>
                    {res.playerOfTheMatch && (<span>★ Player of Match: <strong className="text-white">{res.playerOfTheMatch}</strong></span>)}
                  </div>
                  <div className="text-slate-500">
                    Submitted by: {res.postedBy || 'Unknown'}{res.postedByPhone ? ` (${res.postedByPhone})` : ''}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap justify-end gap-2">
                  {isPending && (<button type="button" disabled={isBusy} onClick={() => setStatus(res, 'published')} className="px-4 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-lime-400/10 disabled:opacity-60">
                      {isBusy ? 'Saving…' : 'Approve & Publish'}
                    </button>)}
                  {isPending && (<button type="button" disabled={isBusy} onClick={() => setStatus(res, 'rejected')} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold text-xs cursor-pointer disabled:opacity-60">
                      Reject
                    </button>)}
                  {isPublished && (<button type="button" disabled={isBusy} onClick={() => setStatus(res, 'rejected')} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold text-xs cursor-pointer disabled:opacity-60" title="Unpublish and reverse team stats">
                      Unpublish
                    </button>)}
                  {isRejected && (<button type="button" disabled={isBusy} onClick={() => setStatus(res, 'published')} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-lime-400/20 text-slate-300 hover:text-lime-300 font-bold text-xs cursor-pointer disabled:opacity-60">
                      Publish anyway
                    </button>)}
                  <button type="button" disabled={isBusy} onClick={() => remove(res)} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-300 font-bold text-xs cursor-pointer flex items-center gap-1 disabled:opacity-60" title="Delete result">
                    <Trash2 className="w-3.5 h-3.5"/>
                    <span>Delete</span>
                  </button>
                </div>
              </div>);
            })}
        </div>)}

    </div>);
}
