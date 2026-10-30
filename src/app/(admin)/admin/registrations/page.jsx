'use client';
import React, { useState, useMemo } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Search, Pencil, Users, Phone, Mail, Shirt, CreditCard, CheckCircle2, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
export const dynamic = 'force-dynamic';

const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors';
const PAYMENT_METHODS = ['bkash', 'nagad', 'rocket', 'bank', 'card', 'cash', 'pay_at_turf'];

const isConfirmed = (r) => r.status === 'confirmed' || r.status === 'verified';

const playersOf = (r) => {
    if (Array.isArray(r.playersList) && r.playersList.length) return r.playersList;
    if (Array.isArray(r.players) && r.players.length) return r.players.map(p => (typeof p === 'string' ? p : p?.name)).filter(Boolean);
    return [];
};

export default function AdminRegistrationsPage() {
    const { registrations, handleUpdateRegistration, handleDeleteRegistration } = useArena();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return registrations
            .filter(r => {
                if (filter === 'pending') return r.status === 'pending';
                if (filter === 'confirmed') return isConfirmed(r);
                if (filter === 'rejected') return r.status === 'rejected';
                return true;
            })
            .filter(r => !q
                || (r.teamName || '').toLowerCase().includes(q)
                || (r.captainName || '').toLowerCase().includes(q)
                || (r.captainPhone || '').includes(q)
                || (r.tournamentTitle || '').toLowerCase().includes(q)
                || playersOf(r).some(p => p.toLowerCase().includes(q)));
    }, [registrations, search, filter]);

    const counts = useMemo(() => ({
        all: registrations.length,
        pending: registrations.filter(r => r.status === 'pending').length,
        confirmed: registrations.filter(isConfirmed).length,
        rejected: registrations.filter(r => r.status === 'rejected').length
    }), [registrations]);

    const setStatus = async (reg, status) => {
        try {
            await handleUpdateRegistration(reg.id, { status });
        } catch (err) {
            alert(err.message);
        }
    };

    const openEdit = (r) => {
        setEditing(r);
        setForm({
            teamName: r.teamName || '',
            captainName: r.captainName || '',
            captainPhone: r.captainPhone || '',
            captainEmail: r.captainEmail || '',
            jerseyColor: r.jerseyColor || '',
            playersText: playersOf(r).join('\n'),
            paymentMethod: r.paymentMethod || 'bkash',
            transactionId: r.transactionId || '',
            amount: r.amount ?? 0,
            notes: r.notes || '',
            status: r.status === 'verified' ? 'confirmed' : (r.status || 'pending')
        });
        setError('');
        setSuccess('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!editing || !form) return;
        setSaving(true);
        setError('');
        try {
            const playersList = form.playersText.split('\n').map(p => p.trim()).filter(Boolean);
            await handleUpdateRegistration(editing.id, {
                teamName: form.teamName,
                captainName: form.captainName,
                captainPhone: form.captainPhone,
                captainEmail: form.captainEmail,
                jerseyColor: form.jerseyColor,
                playersList,
                playerCount: playersList.length || undefined,
                paymentMethod: form.paymentMethod,
                transactionId: form.transactionId,
                amount: Number(form.amount) || 0,
                notes: form.notes,
                status: form.status
            });
            setSuccess('Registration saved.');
            setTimeout(() => setEditing(null), 600);
        } catch (err) {
            setError(err.message || 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (r) => {
        if (!confirm(`Delete registration of ${r.teamName} for ${r.tournamentTitle}? This cannot be undone.`)) return;
        try {
            await handleDeleteRegistration(r.id);
            setEditing(null);
        } catch (err) {
            alert(err.message);
        }
    };

    return (<div className="space-y-5 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">Tournament registrations</h2>
          <p className="text-xs text-slate-400">
            Every team that registered for a cup: squad list, captain contact, jersey colour and entry-fee payment. Open a card to view or edit any detail.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Team, captain, phone, player, cup..." className={`${inputCls} pl-9`}/>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {['all', 'pending', 'confirmed', 'rejected'].map(s => (<button key={s} type="button" onClick={() => setFilter(s)} className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold capitalize transition-colors cursor-pointer ${filter === s ? 'bg-lime-400 text-slate-950 font-black' : 'bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white'}`}>
              {s} <span className="font-mono opacity-70">{counts[s]}</span>
            </button>))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/5 text-slate-400 text-xs">
        No tournament registrations found.
      </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(reg => {
          const confirmed = isConfirmed(reg);
          const rejected = reg.status === 'rejected';
          const squad = playersOf(reg);
          return (<div key={reg.id} className={`p-5 rounded-3xl border text-xs space-y-3 transition-all ${confirmed
                ? 'bg-[#0a1210] border-emerald-500/30'
                : rejected
                    ? 'bg-[#150a0a] border-rose-500/20 opacity-70'
                    : 'bg-[#0c131a] border-amber-400/30'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-white text-sm truncate">{reg.teamName}</div>
                <div className="text-lime-400 font-bold truncate">{reg.tournamentTitle}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono shrink-0 ${confirmed
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : rejected
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-400/20 text-amber-300'}`}>
                {confirmed ? 'confirmed' : reg.status}
              </span>
            </div>

            <div className="space-y-1 text-slate-400">
              <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500"/> <span className="text-white font-medium">{reg.captainName}</span> · <span className="font-mono">{reg.captainPhone}</span></div>
              {reg.captainEmail && <div className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 text-slate-500"/> {reg.captainEmail}</div>}
              <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-500"/> {squad.length || reg.playerCount || 0} players{reg.jerseyColor ? <> · <Shirt className="w-3 h-3 text-slate-500"/> {reg.jerseyColor}</> : null}</div>
              <div className="flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-slate-500"/> ৳{(reg.amount || 0).toLocaleString()} · {reg.paymentMethod}{reg.transactionId ? <span className="font-mono text-slate-500"> · Trx {reg.transactionId}</span> : null}</div>
              {squad.length > 0 && (<div className="pt-1 flex flex-wrap gap-1">
                {squad.slice(0, 8).map((p, i) => <span key={i} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[11px]">{p}</span>)}
                {squad.length > 8 && <span className="px-1.5 py-0.5 text-slate-500 text-[11px]">+{squad.length - 8} more</span>}
              </div>)}
              {reg.notes && <div className="text-[11px] text-slate-500 italic">“{reg.notes}”</div>}
            </div>

            <div className="pt-3 border-t border-white/10 flex gap-2">
              <button type="button" onClick={() => openEdit(reg)} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold cursor-pointer flex items-center gap-1">
                <Pencil className="w-3 h-3"/> View / Edit
              </button>
              {!confirmed && !rejected && (<>
                <button type="button" onClick={() => setStatus(reg, 'confirmed')} className="flex-1 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black cursor-pointer">
                  Approve
                </button>
                <button type="button" onClick={() => setStatus(reg, 'rejected')} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold cursor-pointer">
                  Reject
                </button>
              </>)}
              {(confirmed || rejected) && (<button type="button" onClick={() => setStatus(reg, 'pending')} className="ml-auto px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold cursor-pointer">
                Back to pending
              </button>)}
            </div>
          </div>);
        })}
      </div>)}

      {/* VIEW / EDIT MODAL */}
      {editing && form && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0c131a] border border-lime-400/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white font-display">Registration details</h3>
              <p className="text-[11px] text-slate-400 font-mono">{editing.tournamentTitle} · submitted {editing.createdAt || editing.registeredAt ? new Date(editing.createdAt || editing.registeredAt).toLocaleString() : '—'}</p>
            </div>
            <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
          </div>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Team name</label>
                <input type="text" required value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed / approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Captain name</label>
                <input type="text" required value={form.captainName} onChange={e => setForm({ ...form, captainName: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Captain mobile</label>
                <input type="tel" required value={form.captainPhone} onChange={e => setForm({ ...form, captainPhone: e.target.value })} className={`${inputCls} font-mono`}/>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Captain email</label>
                <input type="email" value={form.captainEmail} onChange={e => setForm({ ...form, captainEmail: e.target.value })} className={inputCls}/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Jersey colour</label>
                <input type="text" value={form.jerseyColor} onChange={e => setForm({ ...form, jerseyColor: e.target.value })} className={inputCls}/>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Entry fee (৳)</label>
                <input type="number" min={0} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={`${inputCls} font-mono`}/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Payment method</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className={inputCls}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Transaction ID</label>
                <input type="text" value={form.transactionId} onChange={e => setForm({ ...form, transactionId: e.target.value })} className={`${inputCls} font-mono`}/>
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Squad players (one per line) · {form.playersText.split('\n').filter(p => p.trim()).length} listed</label>
              <textarea rows={7} value={form.playersText} onChange={e => setForm({ ...form, playersText: e.target.value })} className={`${inputCls} font-mono resize-y`} placeholder={'Player 1\nPlayer 2\n...'}/>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Admin notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`${inputCls} resize-y`} placeholder="Internal notes about this team"/>
            </div>

            {error && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0"/> {error}</div>)}
            {success && (<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 shrink-0"/> {success}</div>)}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button type="button" onClick={() => handleDelete(editing)} className="px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold cursor-pointer flex items-center justify-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5"/> Delete
              </button>
              <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin"/>} Save changes
              </button>
            </div>
          </form>
        </div>
      </div>)}
    </div>);
}
