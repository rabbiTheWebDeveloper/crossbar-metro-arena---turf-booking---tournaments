'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useArena } from '@/context/ArenaContext';
import { PERMISSIONS, PERMISSION_GROUPS, PERMISSION_KEYS, ROLE_TEMPLATES, permissionLabel } from '@/lib/permissions';
import RecordAuditMeta from '@/components/admin/RecordAuditMeta';
import { Plus, Pencil, Trash2, ShieldCheck, KeyRound, Users, Check, AlertTriangle, Lock } from 'lucide-react';
export const dynamic = 'force-dynamic';

const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 outline-none';
const emptyForm = { id: '', name: '', description: '', permissions: [] };

export default function AdminRolesPage() {
    const { roles, users, isLoadingData, refreshRoles, handleSaveRole, handleDeleteRole, isAdmin } = useArena();

    useEffect(() => { refreshRoles(); }, [refreshRoles]);

    const adminCount = useMemo(() => (users || []).filter(u => u.role === 'admin' && !u.disabled).length, [users]);

    // ---- Create / edit ----
    const [form, setForm] = useState(null); // null = closed
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const isEditing = Boolean(form?.id);

    const openCreate = () => { setFormError(''); setForm({ ...emptyForm }); };
    const openEdit = (role) => { setFormError(''); setForm({ id: role.id, name: role.name, description: role.description || '', permissions: [...(role.permissions || [])] }); };
    const closeForm = () => { if (!saving) setForm(null); };

    const togglePermission = (key) => setForm(f => ({ ...f, permissions: f.permissions.includes(key) ? f.permissions.filter(k => k !== key) : [...f.permissions, key] }));
    const toggleGroup = (group) => setForm(f => {
        const keys = PERMISSIONS.filter(p => p.group === group).map(p => p.key);
        const allOn = keys.every(k => f.permissions.includes(k));
        return { ...f, permissions: allOn ? f.permissions.filter(k => !keys.includes(k)) : [...new Set([...f.permissions, ...keys])] };
    });
    const applyTemplate = (tpl) => { setFormError(''); setForm(f => ({ ...f, name: f.name.trim() ? f.name : tpl.name, description: f.description.trim() ? f.description : tpl.description, permissions: [...tpl.permissions] })); };

    const submitForm = async (e) => {
        e.preventDefault();
        if (!form || saving) return;
        setFormError('');
        const name = form.name.trim();
        if (name.length < 2) { setFormError('Give the role a name of at least 2 characters.'); return; }
        if (form.permissions.length === 0) { setFormError('Choose at least one permission.'); return; }
        setSaving(true);
        const r = await handleSaveRole({ id: form.id || undefined, name, description: form.description.trim(), permissions: PERMISSION_KEYS.filter(k => form.permissions.includes(k)) });
        setSaving(false);
        if (!r.ok) { setFormError(r.error || 'Could not save the role.'); return; }
        setForm(null);
    };

    // ---- Delete ----
    const [deleting, setDeleting] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const confirmDelete = async () => {
        if (!deleting || isDeleting) return;
        setDeleteError('');
        setIsDeleting(true);
        const r = await handleDeleteRole(deleting.id);
        setIsDeleting(false);
        if (!r.ok) { setDeleteError(r.error || 'Could not delete the role.'); return; }
        setDeleting(null);
    };

    const chips = (keys) => (
        <div className="flex flex-wrap gap-1.5">
            {PERMISSION_KEYS.filter(k => keys.includes(k)).map(k => (
                <span key={k} className="px-2 py-0.5 rounded-md bg-lime-400/10 border border-lime-400/20 text-lime-300 text-[11px] font-semibold">{permissionLabel(k)}</span>
            ))}
        </div>
    );

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">Roles &amp; Permissions</h2>
          <p className="text-xs text-slate-400">A role decides which parts of the admin panel a staff member can open and change. Give a role to a person under <Link href="/admin/users" className="text-lime-400 hover:underline">Users</Link>.</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0">
          <Plus className="w-4 h-4 stroke-[3]"/><span>New role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Built-in admin */}
        <div className="p-5 rounded-3xl bg-[#0c131a] border border-amber-400/20 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 shrink-0"><ShieldCheck className="w-4 h-4"/></div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white flex items-center gap-2">Admin <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-white/5 border border-white/10 text-slate-400 font-mono flex items-center gap-1"><Lock className="w-2.5 h-2.5"/>built-in</span></div>
                <div className="text-[11px] text-slate-500">{adminCount} active admin{adminCount === 1 ? '' : 's'}</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Full access to everything, including users, roles and data backup. This account type cannot be edited or restricted.</p>
        </div>

        {isLoadingData && roles.length === 0 ? (
          [1, 2, 3].map(n => <div key={n} className="h-40 rounded-3xl bg-[#0c131a] border border-white/5 animate-pulse"/>)
        ) : roles.map(role => (
          <div key={role.id} className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 hover:border-lime-400/20 transition-colors space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 shrink-0"><KeyRound className="w-4 h-4"/></div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{role.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1"><Users className="w-3 h-3"/>{role.userCount || 0} staff · {role.permissions.length} of {PERMISSION_KEYS.length} permissions</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" onClick={() => openEdit(role)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer" aria-label={`Edit ${role.name}`} title="Edit role"><Pencil className="w-3.5 h-3.5"/></button>
                {isAdmin && (
                  <button type="button" onClick={() => { setDeleteError(''); setDeleting(role); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer" aria-label={`Delete ${role.name}`} title="Delete role (Super Admin only)"><Trash2 className="w-3.5 h-3.5"/></button>
                )}
              </div>
            </div>
            {role.description && <p className="text-xs text-slate-400">{role.description}</p>}
            {chips(role.permissions)}
            <RecordAuditMeta record={role} compact className="pt-1 border-t border-white/5" fallbackCreatedBy="Admin" />
          </div>
        ))}
      </div>

      {!isLoadingData && roles.length === 0 && (
        <div className="p-6 rounded-3xl bg-[#0c131a] border border-white/5 text-center space-y-3">
          <p className="text-sm font-bold text-white">No staff roles yet</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Create a role such as Manager, Front desk or Accountant, choose what it can access, then give it to a staff account under Users.</p>
          <button type="button" onClick={openCreate} className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer">Create the first role</button>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {form && (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="role-form-title">
          <div className="bg-[#0c131a] border-t sm:border border-lime-400/30 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-4 text-xs">
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/15 mx-auto -mt-1 mb-1"/>
            <h3 id="role-form-title" className="text-base font-bold text-white font-display">{isEditing ? 'Edit role' : 'New staff role'}</h3>

            <form onSubmit={submitForm} className="space-y-4">
              {!isEditing && (
                <div>
                  <div className="text-slate-300 font-semibold mb-1.5">Start from a template <span className="text-slate-500 font-normal">(optional)</span></div>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_TEMPLATES.map(tpl => (
                      <button key={tpl.name} type="button" onClick={() => applyTemplate(tpl)} title={tpl.description} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold cursor-pointer">{tpl.name}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="role-name" className="block text-slate-300 font-semibold mb-1">Role name <span className="text-lime-400">*</span></label>
                  <input id="role-name" type="text" maxLength={40} placeholder="e.g. Front desk" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls}/>
                </div>
                <div>
                  <label htmlFor="role-description" className="block text-slate-300 font-semibold mb-1">Description</label>
                  <input id="role-description" type="text" maxLength={200} placeholder="What this role is for" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls}/>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-slate-300 font-semibold">Permissions <span className="text-slate-500 font-normal">· {form.permissions.length} of {PERMISSION_KEYS.length} selected</span></div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <button type="button" onClick={() => setForm(f => ({ ...f, permissions: [...PERMISSION_KEYS] }))} className="text-lime-400 hover:text-lime-300 font-semibold cursor-pointer">Select all</button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, permissions: [] }))} className="text-slate-400 hover:text-white font-semibold cursor-pointer">Clear</button>
                  </div>
                </div>

                {PERMISSION_GROUPS.map(group => {
                    const items = PERMISSIONS.filter(p => p.group === group);
                    const allOn = items.every(p => form.permissions.includes(p.key));
                    return (
                      <fieldset key={group} className="p-3 rounded-2xl bg-[#080d12] border border-white/5">
                        <legend className="sr-only">{group}</legend>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{group}</span>
                          <button type="button" onClick={() => toggleGroup(group)} className="text-[11px] text-slate-400 hover:text-white font-semibold cursor-pointer">{allOn ? 'Clear group' : 'Select group'}</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {items.map(p => {
                              const on = form.permissions.includes(p.key);
                              return (
                                <label key={p.key} className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-colors ${on ? 'bg-lime-400/10 border-lime-400/40' : 'bg-white/[0.02] border-white/10 hover:border-white/20'}`}>
                                  <input type="checkbox" className="sr-only" checked={on} onChange={() => togglePermission(p.key)}/>
                                  <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-lime-400 border-lime-400 text-slate-950' : 'border-white/20'}`} aria-hidden="true">{on && <Check className="w-3 h-3 stroke-[3]"/>}</span>
                                  <span className="min-w-0">
                                    <span className={`block font-semibold ${on ? 'text-white' : 'text-slate-300'}`}>{p.label}</span>
                                    <span className="block text-[11px] text-slate-500 mt-0.5">{p.description}</span>
                                  </span>
                                </label>
                              );
                          })}
                        </div>
                      </fieldset>
                    );
                })}
                <p className="text-[11px] text-slate-500">Managing users, roles and data backup always stays with admins and cannot be granted to a role.</p>
              </div>

              {isEditing && <p className="text-[11px] text-amber-300">Changes apply straight away to everyone who has this role.</p>}
              {formError && <p className="text-rose-400 text-[12px]" role="alert">{formError}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" disabled={saving} onClick={closeForm} className="flex-1 py-2.5 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-lime-400 text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50">{saving ? 'Saving…' : isEditing ? 'Save role' : 'Create role'}</button>
              </div>
            </form>
          </div>
        </div>)}

      {/* DELETE MODAL */}
      {deleting && (<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="role-delete-title">
          <div className="bg-[#0c131a] border-t sm:border border-rose-500/30 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-sm w-full space-y-4 text-xs">
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/15 mx-auto -mt-1 mb-1"/>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300"><AlertTriangle className="w-4 h-4"/></div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">Delete Role · Super Admin</div>
                <h3 id="role-delete-title" className="text-base font-bold text-white">Are you sure you want to delete this role?</h3>
              </div>
            </div>
            {(deleting.userCount || 0) > 0 ? (<>
              <p className="text-slate-300"><strong className="text-white">{deleting.name}</strong> is used by {deleting.userCount} staff account{deleting.userCount === 1 ? '' : 's'}. Move them to another role under <Link href="/admin/users" className="text-lime-400 hover:underline">Users</Link> first, then delete it.</p>
              <button type="button" onClick={() => setDeleting(null)} className="w-full py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer">Close</button>
            </>) : (<>
              <p className="text-slate-300">Delete the role <strong className="text-white">{deleting.name}</strong>? No accounts use it. This cannot be undone.</p>
              {deleteError && <p className="text-rose-400 text-[12px]" role="alert">{deleteError}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={isDeleting} onClick={() => setDeleting(null)} className="flex-1 py-2 bg-white/5 rounded-xl text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="button" disabled={isDeleting} onClick={confirmDelete} className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl cursor-pointer disabled:opacity-50">{isDeleting ? 'Deleting…' : 'Delete role'}</button>
              </div>
            </>)}
          </div>
        </div>)}

    </div>);
}
