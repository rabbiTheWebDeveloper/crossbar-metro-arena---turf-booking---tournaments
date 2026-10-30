'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useArena } from '@/context/ArenaContext';
import { Search, Pencil, Phone, Mail, Shield, Ban, CheckCircle2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
export const dynamic = 'force-dynamic';

const ROLES = ['player', 'admin', 'investor', 'visitor'];
const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors';

const roleStyle = {
    admin: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    investor: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
    player: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    visitor: 'bg-white/5 text-slate-400 border-white/10'
};

export default function AdminPlayersPage() {
    const { users, refreshUsers, handleAdminUpdateUser, bookings, registrations } = useArena();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showDisabled, setShowDisabled] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { refreshUsers(); }, [refreshUsers]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return users
            .filter(u => u.role !== 'visitor' || roleFilter === 'visitor')
            .filter(u => showDisabled || !u.disabled)
            .filter(u => roleFilter === 'all' || u.role === roleFilter)
            .filter(u => !q || (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q) || (u.email || '').toLowerCase().includes(q) || (u.teamId || '').toLowerCase().includes(q))
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [users, search, roleFilter, showDisabled]);

    const statsFor = (u) => {
        const phone = (u.phone || '').replace(/[^0-9]/g, '');
        const b = bookings.filter(x => (x.captainPhone || '').replace(/[^0-9]/g, '') === phone && x.paymentStatus !== 'cancelled').length;
        const r = registrations.filter(x => (x.captainPhone || '').replace(/[^0-9]/g, '') === phone).length;
        return { bookings: b, tournaments: r };
    };

    const openEdit = (u) => {
        setEditing(u);
        setForm({
            name: u.name || '',
            phone: u.phone || '',
            email: u.email || '',
            playingPosition: u.playingPosition || 'MID',
            teamId: u.teamId || '',
            role: u.role || 'player',
            disabled: Boolean(u.disabled),
            newPassword: ''
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
            const patch = { ...form };
            if (!patch.newPassword) delete patch.newPassword;
            await handleAdminUpdateUser(editing.id, patch);
            setSuccess('Player profile saved.');
            setTimeout(() => setEditing(null), 600);
        } catch (err) {
            setError(err.message || 'Could not save.');
        } finally {
            setSaving(false);
        }
    };

    const quickToggleDisabled = async (u) => {
        const action = u.disabled ? 'Re-enable' : 'Disable';
        if (!confirm(`${action} account for ${u.name} (${u.phone})?`)) return;
        try {
            await handleAdminUpdateUser(u.id, { disabled: !u.disabled });
        } catch (err) {
            alert(err.message);
        }
    };

    const counts = useMemo(() => ({
        total: users.filter(u => u.role !== 'visitor' && !u.disabled).length,
        players: users.filter(u => u.role === 'player' && !u.disabled).length,
        disabled: users.filter(u => u.disabled).length
    }), [users]);

    return (<div className="space-y-5 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">Registered players</h2>
          <p className="text-xs text-slate-400">
            Every account created on the website (sign-up / player profile). View details, fix a phone number, change a role or disable an account.
          </p>
          <div className="flex gap-3 mt-2 text-[11px] font-mono text-slate-400">
            <span><strong className="text-white">{counts.total}</strong> active accounts</span>
            <span><strong className="text-emerald-400">{counts.players}</strong> players</span>
            <span><strong className="text-rose-300">{counts.disabled}</strong> disabled</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, phone, email, team..." className={`${inputCls} pl-9`}/>
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={`${inputCls} sm:w-36`}>
            <option value="all">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap cursor-pointer">
            <input type="checkbox" checked={showDisabled} onChange={e => setShowDisabled(e.target.checked)} className="accent-lime-400 w-4 h-4"/> Show disabled
          </label>
          <button type="button" onClick={refreshUsers} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer" title="Reload from database">
            <RefreshCw className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs">No players match.</div>) : (<div className="rounded-2xl bg-[#0c131a] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/10">
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const st = statsFor(u);
                return (<tr key={u.id} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${u.disabled ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-black flex items-center justify-center shrink-0">
                        {(u.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{u.name}</div>
                        {u.teamId && <div className="text-[11px] text-slate-500 truncate">Team: {u.teamId}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500"/>{u.phone}</div>
                    {u.email && !u.email.endsWith('@bookcrossbar.com') && <div className="flex items-center gap-1.5 text-slate-500 text-[11px]"><Mail className="w-3 h-3"/>{u.email}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono font-bold">{u.playingPosition || 'MID'}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold uppercase ${roleStyle[u.role] || roleStyle.visitor}`}>{u.role}</span>{u.disabled && <span className="ml-1.5 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-mono font-bold">DISABLED</span>}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{st.bookings} bookings · {st.tournaments} cups</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => openEdit(u)} className="px-2.5 py-1.5 rounded-lg bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 font-bold border border-lime-400/20 transition-colors cursor-pointer flex items-center gap-1">
                        <Pencil className="w-3 h-3"/> View / Edit
                      </button>
                      <button type="button" onClick={() => quickToggleDisabled(u)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${u.disabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`} title={u.disabled ? 'Re-enable account' : 'Disable account'}>
                        {u.disabled ? <CheckCircle2 className="w-4 h-4"/> : <Ban className="w-4 h-4"/>}
                      </button>
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* EDIT MODAL */}
      {editing && form && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0c131a] border border-lime-400/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white font-display">Edit player profile</h3>
              <p className="text-[11px] text-slate-400 font-mono">ID {editing.id} · joined {editing.createdAt ? new Date(editing.createdAt).toLocaleString() : '—'}</p>
            </div>
            <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
          </div>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Full name</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Mobile (login)</label>
                <input type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={`${inputCls} font-mono`}/>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Playing position</label>
                <select value={form.playingPosition} onChange={e => setForm({ ...form, playingPosition: e.target.value })} className={inputCls}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Team / club</label>
                <input type="text" value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} placeholder="optional" className={inputCls}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 flex items-center gap-1"><Shield className="w-3 h-3"/> Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Reset password (optional)</label>
                <input type="text" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} placeholder="min 6 characters" className={`${inputCls} font-mono`} autoComplete="off"/>
              </div>
            </div>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.disabled} onChange={e => setForm({ ...form, disabled: e.target.checked })} className="accent-rose-400 w-4 h-4"/>
              Account disabled (cannot log in or book)
            </label>

            {error && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0"/> {error}</div>)}
            {success && (<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 shrink-0"/> {success}</div>)}

            <div className="flex gap-2 pt-2">
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
