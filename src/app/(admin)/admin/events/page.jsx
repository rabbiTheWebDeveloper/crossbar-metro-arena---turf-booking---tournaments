'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Plus, Pencil, Trash2, Lock, Unlock } from 'lucide-react';
export const dynamic = 'force-dynamic';

const CATEGORY_OPTIONS = ['7v7 Championship', '5v5 Knockout', 'Corporate League', 'Youth Cup', 'Ramadan Night Cup', 'Friendly Festival'];
const FORMAT_OPTIONS = ['7 vs 7 Knockouts', '7 vs 7 League + Knockouts', '5 vs 5 Knockouts', '6 vs 6 Group Stage', 'Round Robin'];
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};
const linesToList = (s) => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const emptyForm = () => ({ title: '', edition: '', category: CATEGORY_OPTIONS[0], format: FORMAT_OPTIONS[0], dates: '', registrationDeadline: '', entryFee: '', prizePool: '', firstPrize: '', runnerUpPrize: '', maxTeams: 16, bannerUrl: '', highlights: '', rules: '' });
const formFromTournament = (t) => ({
    title: t.title || '',
    edition: t.edition || '',
    category: t.category || CATEGORY_OPTIONS[0],
    format: t.format || FORMAT_OPTIONS[0],
    dates: t.dates || '',
    registrationDeadline: /^\d{4}-\d{2}-\d{2}$/.test(t.registrationDeadline || '') ? t.registrationDeadline : '',
    entryFee: t.entryFee ?? '',
    prizePool: t.prizePool ?? '',
    firstPrize: t.firstPrize || '',
    runnerUpPrize: t.runnerUpPrize || '',
    maxTeams: t.maxTeams ?? 16,
    bannerUrl: t.bannerUrl || '',
    highlights: (t.highlights || []).join('\n'),
    rules: (t.rules || []).join('\n')
});
const STATUS_STYLE = {
    open: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    closed: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    completed: 'bg-slate-500/15 text-slate-300 border-white/10',
    cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
};

export default function AdminEventsPage() {
    const { tournaments, registrations, handleSaveTournament, handleDeleteTournament, showNotice, isLoadingData } = useArena();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const sorted = useMemo(() => [...tournaments].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))), [tournaments]);
    const regCount = (t) => registrations.filter(r => r.tournamentId === t.id && r.status !== 'rejected').length;

    const openAdd = () => { setEditing(null); setForm(emptyForm()); setFormError(''); setShowModal(true); };
    const openEdit = (t) => { setEditing(t); setForm(formFromTournament(t)); setFormError(''); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setFormError('');
        const title = form.title.trim();
        const dates = form.dates.trim();
        const entryFee = Number(form.entryFee);
        const prizePool = form.prizePool === '' ? 0 : Number(form.prizePool);
        const maxTeams = Number(form.maxTeams);
        if (!title) { setFormError('Title is required.'); return; }
        if (!dates) { setFormError('Tournament dates are required.'); return; }
        if (form.entryFee === '' || Number.isNaN(entryFee) || entryFee < 0) { setFormError('Entry fee must be ৳0 or more.'); return; }
        if (Number.isNaN(prizePool) || prizePool < 0) { setFormError('Prize pool must be ৳0 or more.'); return; }
        if (!Number.isInteger(maxTeams) || maxTeams < 2) { setFormError('Max teams must be at least 2.'); return; }
        if (form.bannerUrl.trim() && !/^https?:\/\//i.test(form.bannerUrl.trim())) { setFormError('Banner must be an http(s) URL.'); return; }
        if (editing && maxTeams < (editing.registeredCount || 0)) { setFormError(`Max teams cannot be below the ${editing.registeredCount} already registered.`); return; }

        const payload = {
            ...(editing ? { id: editing.id } : {}),
            title,
            edition: form.edition.trim() || undefined,
            category: form.category,
            format: form.format,
            dates,
            registrationDeadline: form.registrationDeadline || undefined,
            entryFee,
            prizePool,
            firstPrize: form.firstPrize.trim(),
            runnerUpPrize: form.runnerUpPrize.trim(),
            maxTeams,
            bannerUrl: form.bannerUrl.trim(),
            highlights: linesToList(form.highlights),
            rules: linesToList(form.rules)
        };
        setIsSubmitting(true);
        const res = await handleSaveTournament(payload);
        setIsSubmitting(false);
        if (res?.ok) { setShowModal(false); setEditing(null); }
        else setFormError(res?.error || 'Could not save the tournament.');
    };

    const setStatus = async (t, status) => {
        if (busyId) return;
        const verb = status === 'closed' ? 'Close registration for' : status === 'open' ? 'Reopen registration for' : 'Mark completed:';
        if (!confirm(`${verb} "${t.title}"?`)) return;
        setBusyId(t.id);
        const res = await handleSaveTournament({ id: t.id, status });
        setBusyId(null);
        if (!res?.ok) showNotice('error', res?.error || 'Could not update the tournament.');
    };
    const remove = async (t) => {
        if (busyId) return;
        const regs = regCount(t);
        if (!confirm(`Delete "${t.title}" permanently?${regs ? ` ${regs} registration(s) reference it.` : ''}`)) return;
        setBusyId(t.id);
        const res = await handleDeleteTournament(t.id);
        setBusyId(null);
        if (res?.ok) showNotice('success', 'Tournament deleted');
    };

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">
            Tournaments &amp; Events Hub
          </h2>
          <p className="text-xs text-slate-400">
            Organize official cups, knockouts, prize pools, and seasonal corporate leagues.
          </p>
        </div>

        <button type="button" onClick={openAdd} className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-lime-400/20">
          <Plus className="w-4 h-4 stroke-[3]"/>
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Tournaments Grid */}
      {isLoadingData && tournaments.length === 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">{[0, 1].map(i => <div key={i} className="h-56 rounded-3xl bg-[#0c131a] border border-white/5"/>)}</div>)
      : sorted.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
          No tournaments yet. Create one to open registrations on the public events page.
        </div>) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map(t => {
            const status = t.status || 'open';
            const isBusy = busyId === t.id;
            const registered = Math.max(Number(t.registeredCount) || 0, regCount(t));
            const full = registered >= (Number(t.maxTeams) || 0);
            return (<div key={t.id} className={`p-5 rounded-3xl bg-[#0c131a] border space-y-3 transition-all text-xs ${status === 'open' ? 'border-white/5 hover:border-lime-400/30' : 'border-white/5 opacity-85'}`}>
            {t.bannerUrl ? (<div className="aspect-[3/1] rounded-2xl overflow-hidden bg-[#080d12] border border-white/5"><img src={t.bannerUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }}/></div>) : null}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-1 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/20 font-bold uppercase font-mono text-[11px] truncate">
                  {t.category}
                </span>
                <span className={`px-2 py-0.5 rounded-full border font-mono font-bold uppercase text-[10px] ${STATUS_STYLE[status] || STATUS_STYLE.completed}`}>
                  {status.replaceAll('_', ' ')}
                </span>
              </div>
              <span className={`font-mono font-bold shrink-0 ${full ? 'text-amber-300' : 'text-white'}`}>
                {registered} / {t.maxTeams} teams{full ? ' · full' : ''}
              </span>
            </div>

            <div>
              <h4 className="text-base font-black text-white font-display">{t.title}</h4>
              <p className="text-slate-400 text-xs mt-1">{t.edition ? `${t.edition} · ` : ''}{t.format}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#080d12] border border-white/5 font-mono">
              <div>
                <span className="text-slate-500 text-[11px] block">Entry Fee</span>
                <span className="font-bold text-white">৳{(Number(t.entryFee) || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Prize Pool</span>
                <span className="font-bold text-lime-400">৳{(Number(t.prizePool) || 0).toLocaleString()}</span>
              </div>
              {(t.firstPrize || t.runnerUpPrize) && (<div className="col-span-2 text-[11px] text-slate-400 font-sans">
                  {t.firstPrize && <span>🥇 {t.firstPrize}</span>}{t.firstPrize && t.runnerUpPrize && ' · '}{t.runnerUpPrize && <span>🥈 {t.runnerUpPrize}</span>}
                </div>)}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[12px] pt-2 border-t border-white/5">
              <span>Dates: <span className="text-slate-200">{t.dates}</span></span>
              <span>Deadline: <span className="text-slate-200">{/^\d{4}-\d{2}-\d{2}$/.test(t.registrationDeadline || '') ? parseLocalDate(t.registrationDeadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : (t.registrationDeadline || '—')}</span></span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <button type="button" disabled={isBusy} onClick={() => openEdit(t)} className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                <Pencil className="w-3.5 h-3.5"/><span>Edit</span>
              </button>
              {status === 'open' ? (<button type="button" disabled={isBusy} onClick={() => setStatus(t, 'closed')} className="flex-1 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                  <Lock className="w-3.5 h-3.5"/><span>Close registration</span>
                </button>) : (<button type="button" disabled={isBusy} onClick={() => setStatus(t, 'open')} className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                  <Unlock className="w-3.5 h-3.5"/><span>Reopen</span>
                </button>)}
              <button type="button" disabled={isBusy} onClick={() => remove(t)} className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-300 disabled:opacity-50" title="Delete tournament">
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>);
        })}
      </div>)}

      {/* CREATE / EDIT TOURNAMENT MODAL */}
      {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[92vh] overflow-y-auto">
            <div>
              <h3 className="text-base font-bold text-white font-display">{editing ? 'Edit Tournament' : 'Create Tournament'}</h3>
              <p className="text-xs text-slate-400">{editing ? 'Update the fixture details.' : 'Add a new competitive championship fixture. It opens for registration immediately.'}</p>
              {editing && (<p className="text-[11px] text-amber-300 mt-1">Note: the server currently saves changes to title, dates, entry fee, prize pool and max teams on existing tournaments. Other fields apply on creation.</p>)}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 mb-1">Title *</label>
                  <input type="text" required placeholder="e.g. Winter Cup" value={form.title} onChange={e => set('title', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Edition</label>
                  <input type="text" placeholder="e.g. Season 3" value={form.edition} onChange={e => set('edition', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <input list="cma-category-options" value={form.category} onChange={e => set('category', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                  <datalist id="cma-category-options">{CATEGORY_OPTIONS.map(o => <option key={o} value={o}/>)}</datalist>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Format</label>
                  <input list="cma-format-options" value={form.format} onChange={e => set('format', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                  <datalist id="cma-format-options">{FORMAT_OPTIONS.map(o => <option key={o} value={o}/>)}</datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Tournament Dates *</label>
                  <input type="text" required placeholder="e.g. Nov 20 – Nov 22" value={form.dates} onChange={e => set('dates', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Registration Deadline</label>
                  <input type="date" value={form.registrationDeadline} onChange={e => set('registrationDeadline', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Entry Fee (৳) *</label>
                  <input type="number" required min={0} value={form.entryFee} onChange={e => set('entryFee', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Prize Pool (৳)</label>
                  <input type="number" min={0} value={form.prizePool} onChange={e => set('prizePool', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Max Teams</label>
                  <input type="number" min={2} value={form.maxTeams} onChange={e => set('maxTeams', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">First Prize</label>
                  <input type="text" placeholder="e.g. ৳20,000 + Trophy" value={form.firstPrize} onChange={e => set('firstPrize', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Runner-up Prize</label>
                  <input type="text" placeholder="e.g. ৳10,000" value={form.runnerUpPrize} onChange={e => set('runnerUpPrize', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white"/>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Banner Image URL</label>
                <input type="url" placeholder="https://... (ImageKit / Cloudinary)" value={form.bannerUrl} onChange={e => set('bannerUrl', e.target.value)} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[12px]"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Highlights <span className="text-slate-500">one per line</span></label>
                  <textarea rows={4} value={form.highlights} onChange={e => set('highlights', e.target.value)} placeholder={'Floodlit night matches\nCertified referees\nLive scoreboard'} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white resize-none"/>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Rules <span className="text-slate-500">one per line</span></label>
                  <textarea rows={4} value={form.rules} onChange={e => set('rules', e.target.value)} placeholder={'Squad of 7–12 players\n2 × 15 minute halves\nRolling substitutions'} className="w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white resize-none"/>
                </div>
              </div>

              {formError && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">{formError}</div>)}

              <div className="flex gap-2 pt-2">
                <button type="button" disabled={isSubmitting} onClick={() => setShowModal(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl disabled:opacity-60">
                  {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Publish Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

    </div>);
}
