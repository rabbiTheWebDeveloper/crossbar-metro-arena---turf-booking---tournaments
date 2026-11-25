'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useArena } from '@/context/ArenaContext';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import { permissionLabel } from '@/lib/permissions';
import { Search, Plus, Pencil, KeyRound, Ban, CheckCircle2, Trash2, AlertTriangle, Copy, Check, ShieldCheck } from 'lucide-react';
export const dynamic = 'force-dynamic';

const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 outline-none';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ACCOUNT_TYPES = [
    { value: 'player', label: 'Player', hint: 'Books slots and joins tournaments on the website.' },
    { value: 'investor', label: 'Investor', hint: 'Sees the investor portal for their partner record.' },
    { value: 'staff', label: 'Staff', hint: 'Opens the admin panel with the permissions of a staff role.' },
    { value: 'admin', label: 'Admin', hint: 'Full access to everything, including users and roles.' }
];
const typeLabel = (role) => ACCOUNT_TYPES.find(t => t.value === role)?.label || role;
const typeStyle = {
    admin: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    staff: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
    investor: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
    player: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    visitor: 'bg-white/5 text-slate-400 border-white/10'
};
const FILTERS = [
    { key: 'team', label: 'Team', match: u => u.role === 'admin' || u.role === 'staff' },
    { key: 'investor', label: 'Investors', match: u => u.role === 'investor' },
    { key: 'player', label: 'Players', match: u => u.role === 'player' },
    { key: 'disabled', label: 'Disabled', match: u => u.disabled },
    { key: 'all', label: 'All', match: () => true }
];

/** 10 characters without look-alikes (0/O, 1/l/I) so it can be read out over the phone. */
const generatePassword = () => {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = new Uint32Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
};

const emptyForm = { id: '', name: '', phone: '', email: '', role: 'staff', staffRoleId: '', password: '' };

export default function AdminUsersPage() {
    const { users, roles, currentUser, isLoadingData, showNotice, refreshUsers, refreshRoles, handleCreateUser, handleAdminUpdateUser, handleDeleteUser, isAdmin } = useArena();

    useEffect(() => { refreshUsers(); refreshRoles(); }, [refreshUsers, refreshRoles]);

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('team');
    const myId = currentUser?.id;

    const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.key, users.filter(u => u.role !== 'visitor' && f.match(u) && (f.key === 'disabled' || f.key === 'all' || !u.disabled)).length])), [users]);
    const activeAdminCount = useMemo(() => users.filter(u => u.role === 'admin' && !u.disabled).length, [users]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const f = FILTERS.find(x => x.key === filter) || FILTERS[0];
        const rank = { admin: 0, staff: 1, investor: 2, player: 3 };
        return users
            .filter(u => u.role !== 'visitor')
            .filter(u => f.match(u) && (f.key === 'disabled' || f.key === 'all' || !u.disabled))
            .filter(u => !q || (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q) || (u.email || '').toLowerCase().includes(q) || (u.staffRoleName || '').toLowerCase().includes(q))
            .sort((a, b) => (rank[a.role] ?? 9) - (rank[b.role] ?? 9) || String(a.name || '').localeCompare(String(b.name || '')));
    }, [users, search, filter]);

    const roleById = useMemo(() => Object.fromEntries(roles.map(r => [r.id, r])), [roles]);

    // ---- Add / edit ----
    const [form, setForm] = useState(null); // null = closed
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState(null); // { name, phone, password } shown once after creating
    const [copied, setCopied] = useState(false);
    const isEditing = Boolean(form?.id);
    const editingSelf = isEditing && form.id === myId;
    const selectedRole = form?.role === 'staff' ? roleById[form.staffRoleId] : null;

    const openCreate = () => { setFormError(''); setCreated(null); setCopied(false); setForm({ ...emptyForm, staffRoleId: roles[0]?.id || '', password: generatePassword() }); };
    const openEdit = (u) => { setFormError(''); setCreated(null); setForm({ id: u.id, name: u.name || '', phone: u.phone || '', email: u.email || '', role: u.role || 'player', staffRoleId: u.staffRoleId || roles[0]?.id || '', password: '' }); };
    const closeForm = () => { if (!saving) { setForm(null); setCreated(null); } };
    const setField = (key) => (e) => { setFormError(''); setForm(f => ({ ...f, [key]: e.target.value })); };

    const submitForm = async (e) => {
        e.preventDefault();
        if (!form || saving) return;
        setFormError('');
        const name = form.name.trim();
        const email = form.email.trim();
        if (name.length < 2) { setFormError('Enter the full name.'); return; }
        if (!isValidBdPhone(form.phone)) { setFormError('Enter a valid 11-digit mobile number (e.g. 01711223344).'); return; }
        if (email && !EMAIL_RE.test(email)) { setFormError('Enter a valid email address.'); return; }
        if (form.role === 'staff' && !form.staffRoleId) { setFormError('Choose a staff role, or create one under Roles & permissions first.'); return; }
        if (!isEditing && form.password.trim().length < 6) { setFormError('Password must be at least 6 characters.'); return; }

        const payload = { name, phone: cleanPhone(form.phone), email, role: form.role, ...(form.role === 'staff' ? { staffRoleId: form.staffRoleId } : {}) };
        setSaving(true);
        if (isEditing) {
            try {
                await handleAdminUpdateUser(form.id, payload);
                showNotice('success', `${name} updated`);
                setForm(null);
            } catch (err) { setFormError(err?.message || 'Could not save the account.'); }
        } else {
            const password = form.password.trim();
            const r = await handleCreateUser({ ...payload, password });
            if (r.ok) { setCreated({ name, phone: payload.phone, password }); setCopied(false); }
            else setFormError(r.error || 'Could not create the account.');
        }
        setSaving(false);
    };

    const copyText = async (text) => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); } };

    // ---- Reset password ----
    const [resetUser, setResetUser] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetDone, setResetDone] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const openReset = (u) => { setResetPassword(''); setResetError(''); setResetDone(''); setCopied(false); setResetUser(u); };
    const submitReset = async (e) => {
        e.preventDefault();
        if (!resetUser || isResetting) return;
        const password = resetPassword.trim();
        if (password.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
        setResetError('');
        setIsResetting(true);
        try { await handleAdminUpdateUser(resetUser.id, { newPassword: password }); setResetDone(password); }
        catch (err) { setResetError(err?.message || 'Could not reset the password.'); }
        setIsResetting(false);
    };

    // ---- Disable / enable / delete ----
    const [busyId, setBusyId] = useState('');
    const toggleDisabled = async (u) => {
        if (!u.disabled && !confirm(`Disable ${u.name}? They will be signed out and cannot log in until you enable the account again.`)) return;
        setBusyId(u.id);
        try { await handleAdminUpdateUser(u.id, { disabled: !u.disabled }); showNotice('success', `${u.name} ${u.disabled ? 'enabled' : 'disabled'}`); }
        catch (err) { showNotice('error', err?.message || 'Could not update the account.'); }
        setBusyId('');
    };

    const [deleteUser, setDeleteUser] = useState(null);
    const [deleteText, setDeleteText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteMatches = deleteUser ? cleanPhone(deleteText) === cleanPhone(deleteUser.phone) : false;
    const confirmDelete = async () => {
        if (!deleteUser || isDeleting || !deleteMatches) return;
        setDeleteError('');
        setIsDeleting(true);
        const r = await handleDeleteUser(deleteUser.id);
        setIsDeleting(false);
        if (!r.ok) { setDeleteError(r.error || 'Could not delete the account.'); return; }
        setDeleteUser(null);
    };

    /** Why an action is not available for this row, or '' when it is. */
    const lockReason = (u) => {
        if (u.id === myId) return 'This is your own account';
        if (u.role === 'admin' && !u.disabled && activeAdminCount <= 1) return 'The only active admin';
        return '';
    };

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">Users</h2>
          <p className="text-xs text-slate-400">Everyone with a login. Add team members, choose what they can access, reset passwords and remove accounts. Staff access is defined under <Link href="/admin/roles" className="text-lime-400 hover:underline">Roles &amp; permissions</Link>.</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0">
          <Plus className="w-4 h-4 stroke-[3]"/><span>Add user</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="app-tab-strip sm:flex-wrap" role="tablist" aria-label="Filter accounts">
          {FILTERS.map(f => (
            <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${filter === f.key ? 'bg-lime-400 text-slate-950 border-lime-400' : 'bg-[#0c131a] text-slate-400 border-white/10 hover:text-white'}`}>
              {f.label} <span className={`font-mono ${filter === f.key ? 'text-slate-950/70' : 'text-slate-500'}`}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email or role" aria-label="Search users" className={`${inputCls} pl-8`}/>
        </div>
      </div>

      {/* Mobile App Cards */}
      <div className="md:hidden space-y-2.5">
        {isLoadingData && users.length === 0 ? (
          [1, 2, 3].map(n => <div key={n} className="h-28 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>)
        ) : filtered.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#0c131a] border border-white/5 text-center text-xs text-slate-500">
            {search ? 'No accounts match your search.' : 'No accounts in this group.'}
          </div>
        ) : filtered.map(u => {
          const locked = lockReason(u);
          const busy = busyId === u.id;
          const role = u.role === 'staff' ? roleById[u.staffRoleId] : null;
          return (
            <div key={u.id} className={`p-4 rounded-2xl bg-[#0c131a] border border-white/10 space-y-3 text-xs ${u.disabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/10 text-white font-black flex items-center justify-center font-mono shrink-0">
                    {(u.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate flex items-center gap-1.5">
                      <span className="truncate">{u.name}</span>
                      {u.id === myId && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-lime-400/15 text-lime-300 font-mono">you</span>}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 truncate">{u.phone}{u.email ? ` · ${u.email}` : ''}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase shrink-0 ${typeStyle[u.role] || typeStyle.visitor}`}>
                  {typeLabel(u.role)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400 truncate">
                  {u.role === 'staff'
                    ? (u.staffRoleName ? `${u.staffRoleName}${role ? ` (${role.permissions.length} perms)` : ''}` : 'No role assigned')
                    : u.role === 'admin' ? 'Full Super Admin access' : 'Portal login account'}
                </span>
                {u.disabled
                  ? <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold">DISABLED</span>
                  : <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-bold">ACTIVE</span>}
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-end gap-2">
                <button type="button" disabled={busy} onClick={() => openEdit(u)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                  <Pencil className="w-3.5 h-3.5"/> Edit
                </button>
                <button type="button" disabled={busy} onClick={() => openReset(u)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer disabled:opacity-50" title="Reset password">
                  <KeyRound className="w-4 h-4"/>
                </button>
                <button type="button" disabled={busy || Boolean(locked)} onClick={() => toggleDisabled(u)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer disabled:opacity-30" title={locked || (u.disabled ? 'Enable' : 'Disable')}>
                  {u.disabled ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : <Ban className="w-4 h-4"/>}
                </button>
                {isAdmin && (
                  <button type="button" disabled={busy || Boolean(locked)} onClick={() => { setDeleteText(''); setDeleteError(''); setDeleteUser(u); }} className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-300 cursor-pointer disabled:opacity-30" title={locked || 'Delete account'}>
                    <Trash2 className="w-4 h-4"/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-3xl bg-[#0c131a] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-500 uppercase border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Access</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoadingData && users.length === 0 ? (
                [1, 2, 3, 4].map(n => <tr key={n}><td colSpan={5} className="px-4 py-3"><div className="h-8 rounded-xl bg-white/5 animate-pulse"/></td></tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">{search ? 'No accounts match your search.' : filter === 'team' ? 'No team accounts yet. Use "Add user" to add staff.' : 'No accounts in this group.'}</td></tr>
              ) : filtered.map(u => {
                  const locked = lockReason(u);
                  const busy = busyId === u.id;
                  const role = u.role === 'staff' ? roleById[u.staffRoleId] : null;
                  return (<tr key={u.id} className={`hover:bg-white/[0.02] ${u.disabled ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/10 text-white font-black flex items-center justify-center font-mono shrink-0">{(u.name || '?').charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">{u.name}{u.id === myId && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-lime-400/15 text-lime-300 font-mono">you</span>}</div>
                          <div className="text-[11px] text-slate-500 truncate">{u.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">{u.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold uppercase ${typeStyle[u.role] || typeStyle.visitor}`}>{typeLabel(u.role)}</span>
                      {u.role === 'staff' && (
                        <div className={`text-[11px] mt-1 ${u.staffRoleName ? 'text-slate-400' : 'text-amber-300'}`} title={role ? role.permissions.map(permissionLabel).join(', ') : undefined}>
                          {u.staffRoleName ? `${u.staffRoleName}${role ? ` · ${role.permissions.length} permission${role.permissions.length === 1 ? '' : 's'}` : ''}` : 'No role assigned: no access'}
                        </div>
                      )}
                      {u.role === 'admin' && <div className="text-[11px] text-slate-500 mt-1">Full access</div>}
                    </td>
                    <td className="py-3 px-4">
                      {u.disabled
                          ? <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-mono font-bold">DISABLED</span>
                          : <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono font-bold">ACTIVE</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" disabled={busy} onClick={() => openEdit(u)} title="Edit details and access" aria-label={`Edit ${u.name}`} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"><Pencil className="w-3.5 h-3.5"/></button>
                        <button type="button" disabled={busy} onClick={() => openReset(u)} title="Reset password" aria-label={`Reset password for ${u.name}`} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"><KeyRound className="w-3.5 h-3.5"/></button>
                        <button type="button" disabled={busy || Boolean(locked)} onClick={() => toggleDisabled(u)} title={locked || (u.disabled ? 'Enable account' : 'Disable account')} aria-label={u.disabled ? `Enable ${u.name}` : `Disable ${u.name}`} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                          {u.disabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/> : <Ban className="w-3.5 h-3.5"/>}
                        </button>
                        {isAdmin && (
                          <button type="button" disabled={busy || Boolean(locked)} onClick={() => { setDeleteText(''); setDeleteError(''); setDeleteUser(u); }} title={locked || 'Delete account (Super Admin only)'} aria-label={`Delete ${u.name}`} className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5"/></button>
                        )}
                      </div>
                    </td>
                  </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {form && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
          <div className="bg-[#0c131a] border border-lime-400/30 rounded-2xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto space-y-4 text-xs">
            <h3 id="user-form-title" className="text-base font-bold text-white font-display">{created ? 'Account created' : isEditing ? 'Edit user' : 'Add user'}</h3>

            {created ? (<>
              <p className="text-slate-300">Pass these sign-in details to <strong className="text-white">{created.name}</strong> now. The password is not shown again.</p>
              <div className="p-3 rounded-xl bg-[#080d12] border border-lime-400/30 font-mono space-y-1">
                <div><span className="text-slate-500">Mobile: </span><span className="text-white select-all">{created.phone}</span></div>
                <div><span className="text-slate-500">Password: </span><span className="text-lime-300 select-all break-all">{created.password}</span></div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => copyText(`Mobile: ${created.phone}\nPassword: ${created.password}`)} className="flex-1 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-bold cursor-pointer flex items-center justify-center gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5 text-lime-400"/> : <Copy className="w-3.5 h-3.5"/>}<span>{copied ? 'Copied' : 'Copy details'}</span>
                </button>
                <button type="button" onClick={closeForm} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer">Done</button>
              </div>
            </>) : (
            <form onSubmit={submitForm} className="space-y-3">
              <div>
                <label htmlFor="user-name" className="block text-slate-300 font-semibold mb-1">Full name <span className="text-lime-400">*</span></label>
                <input id="user-name" type="text" maxLength={100} autoComplete="off" value={form.name} onChange={setField('name')} className={inputCls}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-phone" className="block text-slate-300 font-semibold mb-1">Mobile (login) <span className="text-lime-400">*</span></label>
                  <input id="user-phone" type="tel" maxLength={14} placeholder="01XXXXXXXXX" autoComplete="off" value={form.phone} onChange={setField('phone')} className={`${inputCls} font-mono`}/>
                </div>
                <div>
                  <label htmlFor="user-email" className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input id="user-email" type="email" maxLength={120} autoComplete="off" value={form.email} onChange={setField('email')} className={inputCls}/>
                </div>
              </div>

              <div>
                <label htmlFor="user-type" className="block text-slate-300 font-semibold mb-1">Account type</label>
                <select id="user-type" value={form.role} onChange={setField('role')} disabled={editingSelf} className={`${inputCls} disabled:opacity-60`}>
                  {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">{editingSelf ? 'You cannot change your own account type.' : ACCOUNT_TYPES.find(t => t.value === form.role)?.hint}</p>
              </div>

              {form.role === 'staff' && (
                <div>
                  <label htmlFor="user-staff-role" className="block text-slate-300 font-semibold mb-1">Staff role <span className="text-lime-400">*</span></label>
                  {roles.length === 0 ? (
                    <p className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200">No staff roles exist yet. <Link href="/admin/roles" className="underline font-semibold">Create a role</Link> first, then add the staff member.</p>
                  ) : (<>
                    <select id="user-staff-role" value={form.staffRoleId} onChange={setField('staffRoleId')} className={inputCls}>
                      {!roleById[form.staffRoleId] && <option value="">Choose a role…</option>}
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    {selectedRole && <p className="text-[11px] text-slate-500 mt-1">Can access: {selectedRole.permissions.map(permissionLabel).join(', ')}.</p>}
                  </>)}
                </div>
              )}

              {form.role === 'admin' && !editingSelf && (
                <p className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-200 flex items-start gap-2"><ShieldCheck className="w-4 h-4 shrink-0 mt-px"/><span>Admins can do everything, including adding and removing other admins. Use a staff role if this person only needs part of the panel.</span></p>
              )}

              {!isEditing && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="user-password" className="block text-slate-300 font-semibold">Password <span className="text-lime-400">*</span></label>
                    <button type="button" onClick={() => { setFormError(''); setForm(f => ({ ...f, password: generatePassword() })); }} className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold cursor-pointer">Generate</button>
                  </div>
                  <input id="user-password" type="text" autoComplete="off" spellCheck={false} placeholder="min 6 characters" value={form.password} onChange={setField('password')} className={`${inputCls} font-mono`}/>
                  <p className="text-[11px] text-slate-500 mt-1">They sign in with their mobile number and this password, and can change it afterwards.</p>
                </div>
              )}

              {formError && <p className="text-rose-400 text-[12px]" role="alert">{formError}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" disabled={saving} onClick={closeForm} className="flex-1 py-2.5 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create account'}</button>
              </div>
            </form>)}
          </div>
        </div>)}

      {/* RESET PASSWORD MODAL */}
      {resetUser && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="user-reset-title">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400"><KeyRound className="w-4 h-4"/></div>
              <h3 id="user-reset-title" className="text-base font-bold text-white">Reset password</h3>
            </div>
            {resetDone ? (<>
              <p className="text-slate-300">The password for <strong className="text-white">{resetUser.name}</strong> (<span className="font-mono">{resetUser.phone}</span>) has been changed. Pass it on now; it is not shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-xl bg-[#080d12] border border-lime-400/30 text-lime-300 font-mono text-sm break-all select-all">{resetDone}</code>
                <button type="button" onClick={() => copyText(resetDone)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold cursor-pointer flex items-center gap-1.5" aria-label="Copy password">
                  {copied ? <Check className="w-3.5 h-3.5 text-lime-400"/> : <Copy className="w-3.5 h-3.5"/>}<span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <button type="button" onClick={() => setResetUser(null)} className="w-full py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer">Done</button>
            </>) : (
              <form onSubmit={submitReset} className="space-y-3">
                <p className="text-slate-400">Set a new password for <strong className="text-white">{resetUser.name}</strong> · <span className="font-mono text-white">{resetUser.phone}</span>. Their current password stops working as soon as you save.</p>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="user-reset-input" className="block text-slate-300">New password</label>
                    <button type="button" onClick={() => { setResetError(''); setResetPassword(generatePassword()); }} className="text-[11px] text-lime-400 hover:text-lime-300 font-semibold cursor-pointer">Generate</button>
                  </div>
                  <input id="user-reset-input" type="text" autoComplete="off" spellCheck={false} placeholder="min 6 characters" value={resetPassword} onChange={e => { setResetPassword(e.target.value); setResetError(''); }} className={`${inputCls} font-mono`}/>
                </div>
                {resetError && <p className="text-rose-400 text-[12px]" role="alert">{resetError}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="button" disabled={isResetting} onClick={() => setResetUser(null)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isResetting} className="flex-1 py-2 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{isResetting ? 'Saving…' : 'Reset password'}</button>
                </div>
              </form>
            )}
          </div>
        </div>)}

      {/* DELETE MODAL */}
      {deleteUser && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="user-delete-title">
          <div className="bg-[#0c131a] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300"><AlertTriangle className="w-4 h-4"/></div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">Delete Account · Super Admin</div>
                <h3 id="user-delete-title" className="text-base font-bold text-white">Are you sure you want to delete this account?</h3>
              </div>
            </div>
            <p className="text-slate-300"><strong className="text-white">{deleteUser.name}</strong> · <span className="font-mono">{deleteUser.phone}</span> · {typeLabel(deleteUser.role)}</p>
            <p className="text-slate-400">This removes the login for good and cannot be undone. Their past bookings, registrations and payouts are kept. If you only want to stop them signing in, disable the account instead.</p>
            <div>
              <label htmlFor="user-delete-confirm" className="block text-slate-300 mb-1">Type their mobile number to confirm: <strong className="text-white font-mono">{deleteUser.phone}</strong></label>
              <input id="user-delete-confirm" type="text" inputMode="numeric" autoComplete="off" value={deleteText} onChange={e => setDeleteText(e.target.value)} className={`${inputCls} font-mono`}/>
            </div>
            {deleteError && <p className="text-rose-400 text-[12px]" role="alert">{deleteError}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={isDeleting} onClick={() => setDeleteUser(null)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
              <button type="button" disabled={isDeleting || !deleteMatches} onClick={confirmDelete} className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">{isDeleting ? 'Deleting…' : 'Delete permanently'}</button>
            </div>
          </div>
        </div>)}

    </div>);
}
