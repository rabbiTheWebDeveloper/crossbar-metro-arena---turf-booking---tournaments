'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    Search, UserPlus, RefreshCw, DatabaseZap, Pencil, Trash2, Phone, Mail, MapPin, Loader2, AlertTriangle,
    CheckCircle2, X, ChevronLeft, ChevronRight, Calendar, Trophy, ShoppingBag, ShieldCheck
} from 'lucide-react';
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, syncCustomers } from '@/lib/customerApi';
import { CUSTOMER_SOURCES, CHANNEL_LABELS, sourceLabel } from '@/lib/customerMeta';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400 focus:ring-1 focus:ring-lime-400 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors';
const emptyForm = { name: '', phone: '', email: '', password: '', area: '', tags: '', notes: '' };

const money = (n) => `৳${(Number(n) || 0).toLocaleString()}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const SOURCE_STYLE = {
    signup: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    online_booking: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
    walk_in: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    fixed_slot: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
    tournament: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
    shop: 'bg-orange-400/15 text-orange-300 border-orange-400/30',
    team: 'bg-teal-400/15 text-teal-300 border-teal-400/30',
    manual: 'bg-lime-400/15 text-lime-300 border-lime-400/30'
};
const BOOKING_STATUS = {
    confirmed_unpaid: ['Pay at arena', 'bg-amber-500/15 text-amber-300'],
    paid_advance: ['Advance paid', 'bg-emerald-500/15 text-emerald-300'],
    paid_full: ['Paid', 'bg-emerald-500/15 text-emerald-300'],
    needs_refund: ['Refund due', 'bg-violet-500/15 text-violet-300'],
    cancelled: ['Cancelled', 'bg-rose-500/15 text-rose-300']
};

const SourceChip = ({ source }) => (
    <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase whitespace-nowrap ${SOURCE_STYLE[source] || 'bg-white/5 text-slate-300 border-white/10'}`}>{sourceLabel(source)}</span>
);

export default function AdminCustomersPage() {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [overview, setOverview] = useState({ total: 0, withAccount: 0, thisMonth: 0, bySource: {} });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [source, setSource] = useState('');
    const [account, setAccount] = useState('');
    const [page, setPage] = useState(1);

    const [editor, setEditor] = useState(null); // { mode: 'add' } | { mode: 'edit', customer }
    const [form, setForm] = useState(emptyForm);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [deletingId, setDeletingId] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [flash, setFlash] = useState(null); // { type, text }

    const latestRequest = useRef(0);
    const openedId = useRef('');

    // Wait for the typing to pause before asking the server
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);
    useEffect(() => { setPage(1); }, [debouncedSearch, source, account]);

    useEffect(() => {
        if (!flash) return undefined;
        const t = setTimeout(() => setFlash(null), 7000);
        return () => clearTimeout(t);
    }, [flash]);

    const load = useCallback(async () => {
        const mine = ++latestRequest.current;
        setLoading(true);
        const r = await listCustomers({ q: debouncedSearch, source, account, page, limit: PAGE_SIZE });
        if (mine !== latestRequest.current) return; // a newer request replaced this one
        setLoading(false);
        if (!r.ok) { setLoadError(r.error); return; }
        setLoadError('');
        setRows(r.data.customers || []);
        setTotal(r.data.total || 0);
        setPages(r.data.pages || 1);
        if (r.data.overview) setOverview(r.data.overview);
        if (r.data.page && r.data.page !== page) setPage(r.data.page);
    }, [debouncedSearch, source, account, page]);
    useEffect(() => { load(); }, [load]);

    /* ---- add / edit ---- */
    const openAdd = () => {
        openedId.current = '';
        setEditor({ mode: 'add' });
        setForm(emptyForm);
        setDetail(null);
        setFormError('');
    };

    const openEdit = async (c) => {
        openedId.current = c.id;
        setEditor({ mode: 'edit', customer: c });
        setForm({
            name: c.name || '', phone: c.phone || '', email: c.email || '', password: '',
            area: c.area || '', tags: (c.tags || []).join(', '), notes: c.notes || ''
        });
        setDetail(null);
        setFormError('');
        setDetailLoading(true);
        const r = await getCustomer(c.id);
        if (openedId.current !== c.id) return; // another customer was opened meanwhile
        setDetailLoading(false);
        if (r.ok) setDetail(r.data);
    };

    const closeEditor = () => { openedId.current = ''; setEditor(null); };

    const submit = async (e) => {
        e.preventDefault();
        if (!editor) return;
        setSaving(true);
        setFormError('');
        const body = { name: form.name, email: form.email, area: form.area, tags: form.tags, notes: form.notes };
        if (form.password) body.password = form.password;
        const adding = editor.mode === 'add';
        const r = adding ? await createCustomer({ ...body, phone: form.phone }) : await updateCustomer(editor.customer.id, body);
        setSaving(false);
        if (!r.ok) { setFormError(r.error); return; }
        setFlash({ type: 'success', text: r.data.message || 'Saved.' });
        closeEditor();
        if (adding && page !== 1) setPage(1); else load();
    };

    const remove = async (c) => {
        const extra = c.userId ? ' Their login account is not affected.' : '';
        if (!confirm(`Remove ${c.name} (${c.phone}) from the customer list?${extra} Their bookings and orders are kept, and they reappear the next time they book or when you sync.`)) return;
        setDeletingId(c.id);
        const r = await deleteCustomer(c.id);
        setDeletingId('');
        if (!r.ok) { setFlash({ type: 'error', text: r.error }); return; }
        setFlash({ type: 'success', text: r.data.message });
        if (editor?.customer?.id === c.id) closeEditor();
        load();
    };

    const runSync = async () => {
        setSyncing(true);
        const r = await syncCustomers();
        setSyncing(false);
        if (!r.ok) { setFlash({ type: 'error', text: r.error }); return; }
        const s = r.data.scanned || {};
        setFlash({
            type: 'success',
            text: `${r.data.message} Checked ${s.accounts || 0} accounts, ${s.bookings || 0} bookings, ${s.registrations || 0} tournament entries, ${s.orders || 0} shop orders and ${s.teams || 0} teams.`
        });
        if (page !== 1) setPage(1); else load();
    };

    const filtersActive = Boolean(debouncedSearch || source || account);
    const set = (patch) => setForm(f => ({ ...f, ...patch }));

    return (<div className="space-y-5 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">Customers</h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Everyone the arena has dealt with, with or without a login. People are added automatically when they sign up, pay for a slot online, book at the counter, take a fixed slot, enter a tournament or order from the shop. You can also add someone yourself.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] font-mono text-slate-400">
            <span><strong className="text-white">{overview.total}</strong> customers</span>
            <span><strong className="text-emerald-400">{overview.withAccount}</strong> with a login</span>
            <span><strong className="text-lime-300">{overview.thisMonth}</strong> added this month</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openAdd} className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer">
            <UserPlus className="w-4 h-4"/> Add customer
          </button>
          <button type="button" onClick={runSync} disabled={syncing} title="Add everyone found in accounts, bookings, tournament entries, shop orders and teams" className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin"/> : <DatabaseZap className="w-4 h-4"/>} Sync from all records
          </button>
          <button type="button" onClick={load} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer" title="Reload from database" aria-label="Reload">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {flash && (<div role="status" className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${flash.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
        {flash.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0"/> : <AlertTriangle className="w-4 h-4 shrink-0"/>}
        <span className="flex-1">{flash.text}</span>
        <button type="button" onClick={() => setFlash(null)} className="text-current opacity-70 hover:opacity-100 cursor-pointer" aria-label="Dismiss"><X className="w-4 h-4"/></button>
      </div>)}

      {/* How people were added: click to filter */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setSource('')} className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${source === '' ? 'bg-white/10 border-white/30 text-white' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'}`}>
          All <span className="font-mono ml-1">{overview.total}</span>
        </button>
        {CUSTOMER_SOURCES.map(s => (<button key={s} type="button" onClick={() => setSource(source === s ? '' : s)} className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${source === s ? (SOURCE_STYLE[s] || '') : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'}`}>
          {sourceLabel(s)} <span className="font-mono ml-1">{overview.bySource?.[s] || 0}</span>
        </button>))}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, mobile, email, area, tag..." aria-label="Search customers" className={`${inputCls} pl-9`}/>
        </div>
        <select value={account} onChange={e => setAccount(e.target.value)} aria-label="Login account filter" className={`${inputCls} sm:w-44`}>
          <option value="">Login: any</option>
          <option value="with">Has a login</option>
          <option value="without">No login</option>
        </select>
        {filtersActive && (<button type="button" onClick={() => { setSearch(''); setSource(''); setAccount(''); }} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer">Clear filters</button>)}
      </div>

      {loadError && (<div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0"/> {loadError}</div>)}

      {/* Table */}
      {loading && rows.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading customers…</div>)
        : rows.length === 0 ? (<div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs space-y-2">
          <div className="text-sm font-bold text-white">{filtersActive ? 'No customers match.' : 'No customers yet.'}</div>
          {!filtersActive && (<p>Click “Sync from all records” to pull in everyone who has already booked, registered or ordered, or add someone yourself.</p>)}
        </div>) : (<div className={`rounded-2xl bg-[#0c131a] border border-white/10 overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/10">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Added via</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Last activity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const st = c.stats || {};
                const shown = (c.sources && c.sources.length ? c.sources : [c.source]).slice(0, 3);
                const more = (c.sources || []).length - shown.length;
                return (<tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-300 font-black flex items-center justify-center shrink-0">
                        {(c.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate flex items-center gap-1.5">
                          {c.name}
                          {c.userId && <span title="Has a login account"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400"/></span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(c.tags || []).slice(0, 3).map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 text-[10px]">#{t}</span>)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500"/>{c.phone}</div>
                    {c.email && <div className="flex items-center gap-1.5 text-slate-500 text-[11px]"><Mail className="w-3 h-3"/>{c.email}</div>}
                    {c.area && <div className="flex items-center gap-1.5 text-slate-500 text-[11px]"><MapPin className="w-3 h-3"/>{c.area}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[210px]">
                      {shown.map(s => <SourceChip key={s} source={s}/>)}
                      {more > 0 && <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 text-[10px] font-mono">+{more}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {st.bookings || 0} bookings · {st.tournaments || 0} cups · {st.orders || 0} orders
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-200 whitespace-nowrap">{money((st.paid || 0) + (st.orderTotal || 0))}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">{fmtDate(c.lastActivityAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => openEdit(c)} className="px-2.5 py-1.5 rounded-lg bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-slate-950 font-bold border border-lime-400/20 transition-colors cursor-pointer flex items-center gap-1">
                        <Pencil className="w-3 h-3"/> View / Edit
                      </button>
                      <button type="button" onClick={() => remove(c)} disabled={deletingId === c.id} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40" title="Remove from the customer list" aria-label={`Remove ${c.name}`}>
                        {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                      </button>
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/10 text-[11px] text-slate-400 font-mono">
          <span>{total} {total === 1 ? 'customer' : 'customers'}{filtersActive ? ' match' : ''} · page {page} of {pages}</span>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white disabled:opacity-30 cursor-pointer" aria-label="Previous page"><ChevronLeft className="w-4 h-4"/></button>
            <button type="button" disabled={page >= pages || loading} onClick={() => setPage(p => Math.min(pages, p + 1))} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white disabled:opacity-30 cursor-pointer" aria-label="Next page"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      </div>)}

      {/* ADD / EDIT MODAL */}
      {editor && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in" onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditor(); }}>
        <div role="dialog" aria-modal="true" aria-label={editor.mode === 'add' ? 'Add customer' : 'Customer details'} className="bg-[#0c131a] border border-lime-400/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-start justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white font-display">{editor.mode === 'add' ? 'Add a customer' : editor.customer.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {editor.mode === 'add' ? 'Added individually by you. Their bookings and orders link up through the mobile number.' : `Added ${fmtDate(editor.customer.createdAt)} · first via ${sourceLabel(editor.customer.source)}`}
              </p>
            </div>
            <button type="button" onClick={closeEditor} className="text-slate-400 hover:text-white cursor-pointer" aria-label="Close"><X className="w-5 h-5"/></button>
          </div>

          <form onSubmit={submit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cu-name" className="block text-slate-300 mb-1">Full name *</label>
                <input id="cu-name" type="text" required minLength={2} maxLength={100} value={form.name} onChange={e => set({ name: e.target.value })} className={inputCls} autoFocus/>
              </div>
              <div>
                <label htmlFor="cu-phone" className="block text-slate-300 mb-1">Mobile number *</label>
                <input id="cu-phone" type="tel" inputMode="numeric" required={editor.mode === 'add'} readOnly={editor.mode === 'edit'} placeholder="01XXXXXXXXX" value={form.phone} onChange={e => set({ phone: e.target.value })} className={`${inputCls} font-mono ${editor.mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}/>
                {editor.mode === 'edit' && <div className="text-[10px] text-slate-500 mt-1">The mobile number identifies the customer and cannot be changed.</div>}
              </div>
              <div>
                <label htmlFor="cu-email" className="block text-slate-300 mb-1">Email</label>
                <input id="cu-email" type="email" maxLength={120} value={form.email} onChange={e => set({ email: e.target.value })} placeholder="optional" className={inputCls}/>
              </div>
              <div>
                <label htmlFor="cu-area" className="block text-slate-300 mb-1">Area / locality</label>
                <input id="cu-area" type="text" maxLength={80} value={form.area} onChange={e => set({ area: e.target.value })} placeholder="e.g. Sector 11, Uttara" className={inputCls}/>
              </div>
              {(!editor.customer?.userId) && (<div>
                <label htmlFor="cu-password" className="block text-slate-300 mb-1">Customer panel login password</label>
                <input id="cu-password" type="password" minLength={6} maxLength={100} autoComplete="new-password" value={form.password} onChange={e => set({ password: e.target.value })} placeholder="Min 6 chars (optional)" className={inputCls}/>
                <div className="text-[10px] text-slate-500 mt-1">Set a password so this customer can log in to /customer with their mobile or email.</div>
              </div>)}
              <div>
                <label htmlFor="cu-tags" className="block text-slate-300 mb-1">Tags</label>
                <input id="cu-tags" type="text" value={form.tags} onChange={e => set({ tags: e.target.value })} placeholder="vip, corporate, regular (comma separated)" className={inputCls}/>
              </div>
            </div>
            <div>
              <label htmlFor="cu-notes" className="block text-slate-300 mb-1">Notes (staff only)</label>
              <textarea id="cu-notes" rows={2} maxLength={1000} value={form.notes} onChange={e => set({ notes: e.target.value })} placeholder="e.g. prefers evening slots, pays by bKash" className={inputCls}/>
            </div>

            {formError && (<div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0"/> {formError}</div>)}

            <div className="flex gap-2 pt-1">
              {editor.mode === 'edit' && (<button type="button" onClick={() => remove(editor.customer)} className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 cursor-pointer flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5"/> Remove
              </button>)}
              <button type="button" onClick={closeEditor} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin"/>} {editor.mode === 'add' ? 'Add customer' : 'Save changes'}
              </button>
            </div>
          </form>

          {editor.mode === 'edit' && (<div className="pt-4 border-t border-white/10 space-y-4 text-xs">
            {detailLoading && (<div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin"/> Loading activity…</div>)}
            {detail && (<>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ['Bookings', detail.customer.stats?.bookings || 0],
                  ['Paid for slots', money(detail.customer.stats?.paid)],
                  ['Tournaments', detail.customer.stats?.tournaments || 0],
                  ['Shop orders', detail.customer.stats?.orders || 0]
                ].map(([label, value]) => (<div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
                  <div className="text-base font-black text-white font-mono mt-0.5">{value}</div>
                </div>))}
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-slate-400">Login:{' '}
                    {detail.account
                      ? <strong className={detail.account.disabled ? 'text-rose-300' : 'text-emerald-300'}>{detail.account.disabled ? 'Disabled' : 'Active'} {detail.account.role} account</strong>
                      : <strong className="text-slate-300">None</strong>}
                    {detail.account && <Link href="/admin/players" className="ml-2 text-lime-400 hover:underline">Manage</Link>}
                  </span>
                  <span className="text-slate-400">Prefers: <strong className="text-slate-200">{CHANNEL_LABELS[detail.settings?.preferredChannel] || 'SMS'}</strong></span>
                  <span className="text-slate-400">Offers: <strong className="text-slate-200">{detail.settings?.notifications?.offers ? 'Opted in' : 'No'}</strong></span>
                </div>
                {(detail.customer.sources || []).length > 0 && (<div className="flex flex-wrap items-center gap-1">
                  <span className="text-slate-400 mr-1">Came in through:</span>
                  {detail.customer.sources.map(s => <SourceChip key={s} source={s}/>)}
                </div>)}
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-lime-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Recent bookings</h4>
                {detail.history.bookings.length === 0 ? <div className="text-slate-500">No bookings under this number.</div> : (
                  <div className="space-y-1">
                    {detail.history.bookings.slice(0, 8).map(b => {
                      const [label, cls] = BOOKING_STATUS[b.paymentStatus] || [String(b.paymentStatus || '').replaceAll('_', ' '), 'bg-white/10 text-slate-300'];
                      return (<div key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="font-mono"><span className="text-lime-400 font-bold">{b.bookingCode}</span> <span className="text-slate-300">{b.date} · {b.displayTime}</span> <span className="text-slate-500">· {b.teamName}</span></div>
                        <div className="flex items-center gap-2"><span className="font-mono text-slate-300">{money(b.totalPrice)}</span><span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${cls}`}>{label}</span></div>
                      </div>);
                    })}
                    {detail.history.bookings.length > 8 && <div className="text-[11px] text-slate-500">Showing the latest 8 of {detail.history.bookings.length}+ bookings. The full list is under All Bookings.</div>}
                  </div>)}
              </div>

              {detail.history.registrations.length > 0 && (<div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-lime-400 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5"/> Tournament entries</h4>
                <div className="space-y-1">
                  {detail.history.registrations.map(r => (<div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-200">{r.tournamentTitle} <span className="text-slate-500">· {r.teamName}</span></span>
                    <span className="flex items-center gap-2"><span className="font-mono text-slate-300">{money(r.amount)}</span><span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/10 text-slate-300">{r.status}</span></span>
                  </div>))}
                </div>
              </div>)}

              {detail.history.orders.length > 0 && (<div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-lime-400 flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5"/> Shop orders</h4>
                <div className="space-y-1">
                  {detail.history.orders.map(o => (<div key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="font-mono text-slate-300">{o.reservationCode} <span className="text-slate-500">· pickup {o.pickupDate}</span></span>
                    <span className="flex items-center gap-2"><span className="font-mono text-slate-300">{money(o.totalAmount)}</span><span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/10 text-slate-300">{String(o.status).replaceAll('_', ' ')}</span></span>
                  </div>))}
                </div>
              </div>)}
            </>)}
          </div>)}
        </div>
      </div>)}
    </div>);
}
