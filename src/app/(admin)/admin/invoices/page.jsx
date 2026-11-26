'use client';
import React, { useState, useMemo } from 'react';
import { useArena, todayDhaka } from '@/context/ArenaContext';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import {
    buildBookingInvoice,
    buildPayoutInvoice,
    buildShopOrderInvoice,
    buildRegistrationInvoice,
    buildRefundInvoice,
    buildCustomInvoice
} from '@/lib/invoice';
import { printInvoiceDocument } from '@/lib/invoicePdf';
import {
    FileText, Plus, Search, Download, Eye, Printer, CheckCircle2,
    Pencil, Trash2, X, Loader2, Users
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 40;
const money = (n) => `৳${Math.round(Number(n) || 0).toLocaleString()}`;

const TABS = [
    { key: 'all', label: 'All Invoices' },
    { key: 'custom', label: 'Custom Created' },
    { key: 'booking', label: 'Turf Bookings' },
    { key: 'investor_payout', label: 'Investor Payouts' },
    { key: 'shop_order', label: 'Shop Orders' },
    { key: 'tournament', label: 'Tournaments' },
    { key: 'refund', label: 'Refund Vouchers' }
];

const CATEGORY_OPTIONS = [
    { value: 'custom', label: 'Custom Official Invoice' },
    { value: 'booking', label: 'Corporate / Turf Booking Invoice' },
    { value: 'investor_payout', label: 'Investor Dividend Payout Voucher' },
    { value: 'sponsorship', label: 'Sponsorship & Event Invoice' },
    { value: 'shop_order', label: 'Pro Shop / Equipment Invoice' },
    { value: 'tournament', label: 'Tournament Entry Invoice' }
];

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash (Arena Desk)' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card', label: 'Card (POS / Online)' },
    { value: 'eps', label: 'EPS Online Gateway' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'unpaid', label: 'Unpaid / Due Later' }
];

const TONE_PILL = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    slate: 'bg-white/10 text-slate-300 border-white/15'
};

const makeEmptyForm = () => ({
    id: '',
    category: 'custom',
    recipientRole: 'customer',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    recipientSubtitle: '',
    userId: '',
    investorId: '',
    issueDate: todayDhaka(),
    dueDate: '',
    items: [{ description: '', meta: '', quantity: 1, unitPrice: 1000 }],
    discount: 0,
    tax: 0,
    paidAmount: 1000,
    paymentMethod: 'cash',
    transactionRef: '',
    notes: ''
});

export default function AdminInvoicesPage() {
    const {
        bookings,
        payouts,
        investors,
        shopReservations,
        registrations,
        refunds,
        invoices,
        users,
        siteSettings,
        isAdmin,
        can,
        isLoadingData,
        openInvoice,
        downloadInvoice,
        handleCreateInvoice,
        handleUpdateInvoice,
        handleDeleteInvoice,
        calculateMonthlyFinance
    } = useArena();

    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [settlementFilter, setSettlementFilter] = useState('all'); // all | paid | due
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Create / Edit Custom Invoice modal
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(makeEmptyForm);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    // Super Admin Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [busyId, setBusyId] = useState('');

    const investorById = useMemo(
        () => Object.fromEntries((investors || []).map(i => [i.id, i])),
        [investors]
    );

    // Memoize monthly finance per payout month so investor payout vouchers carry monthly net profit context
    const financeByPayoutMonth = useMemo(() => {
        const months = [...new Set((payouts || []).map(p => p.month).filter(Boolean))];
        const map = {};
        months.forEach(m => { map[m] = calculateMonthlyFinance(m); });
        return map;
    }, [payouts, calculateMonthlyFinance]);

    // Unified ledger of ALL Arena Invoices (Custom + Bookings + Investor Payouts + Shop + Tournaments + Refunds)
    const allInvoiceRows = useMemo(() => {
        const out = [];

        // 1. Custom Admin-created invoices (MongoDB Invoice collection)
        (invoices || []).forEach(doc => {
            const inv = buildCustomInvoice(doc, siteSettings);
            out.push({
                key: `custom-${doc.id}`,
                sourceGroup: 'custom',
                sortDate: doc.issueDate || String(doc.createdAt || '').slice(0, 10),
                invoice: inv,
                rawCustom: doc
            });
        });

        // 2. Turf Slot Booking invoices
        if (can('bookings') || can('finance')) {
            (bookings || []).forEach(b => {
                if (b.isPublicView || b.paymentStatus === 'pending_payment') return;
                const inv = buildBookingInvoice(b, siteSettings);
                out.push({
                    key: `booking-${b.id}`,
                    sourceGroup: 'booking',
                    sortDate: b.date || inv.issueDate,
                    invoice: inv
                });
            });
        }

        // 3. Investor Dividend Payout vouchers
        if (can('investors') || can('finance')) {
            (payouts || []).forEach(p => {
                const partner = investorById[p.investorId];
                const mFin = p.month ? financeByPayoutMonth[p.month] : null;
                const inv = buildPayoutInvoice(p, partner, mFin, siteSettings);
                out.push({
                    key: `payout-${p.id}`,
                    sourceGroup: 'investor_payout',
                    sortDate: p.datePaid || inv.issueDate,
                    invoice: inv
                });
            });
        }

        // 4. Pro Shop Order invoices
        if (can('shop_orders') || can('finance')) {
            (shopReservations || []).forEach(o => {
                const inv = buildShopOrderInvoice(o, siteSettings);
                out.push({
                    key: `shop-${o.id}`,
                    sourceGroup: 'shop_order',
                    sortDate: inv.issueDate,
                    invoice: inv
                });
            });
        }

        // 5. Tournament Registration invoices
        if (can('registrations') || can('finance')) {
            (registrations || []).forEach(r => {
                const inv = buildRegistrationInvoice(r, siteSettings);
                out.push({
                    key: `reg-${r.id}`,
                    sourceGroup: 'tournament',
                    sortDate: inv.issueDate,
                    invoice: inv
                });
            });
        }

        // 6. Refund Vouchers
        if (can('refunds') || can('finance')) {
            (refunds || []).forEach(rf => {
                const inv = buildRefundInvoice(rf, siteSettings);
                out.push({
                    key: `refund-${rf.id}`,
                    sourceGroup: 'refund',
                    sortDate: inv.issueDate,
                    invoice: inv
                });
            });
        }

        return out.sort((a, b) => String(b.sortDate || '').localeCompare(String(a.sortDate || '')));
    }, [invoices, bookings, payouts, shopReservations, registrations, refunds, investorById, financeByPayoutMonth, siteSettings, can]);

    const counts = useMemo(() => {
        const c = { all: allInvoiceRows.length, custom: 0, booking: 0, investor_payout: 0, shop_order: 0, tournament: 0, refund: 0 };
        allInvoiceRows.forEach(r => { c[r.sourceGroup] = (c[r.sourceGroup] || 0) + 1; });
        return c;
    }, [allInvoiceRows]);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allInvoiceRows.filter(row => {
            if (activeTab !== 'all' && row.sourceGroup !== activeTab) return false;
            const inv = row.invoice;
            if (settlementFilter === 'paid' && (Number(inv.dueAmount) > 0 || inv.statusTone === 'rose')) return false;
            if (settlementFilter === 'due' && !(Number(inv.dueAmount) > 0)) return false;
            if (!q) return true;
            const hay = [
                inv.invoiceNumber,
                inv.referenceCode,
                inv.docTypeLabel,
                inv.recipient?.name,
                inv.recipient?.phone,
                inv.recipient?.email,
                inv.recipient?.subtitle,
                inv.transactionRef,
                ...(inv.items || []).map(i => i.description)
            ].map(v => String(v || '').toLowerCase());
            return hay.some(h => h.includes(q));
        });
    }, [allInvoiceRows, activeTab, settlementFilter, search]);

    const visibleRows = filteredRows.slice(0, visibleCount);

    // ---- Custom Invoice Modal Helpers ----
    const formSubtotal = useMemo(
        () => form.items.reduce((s, it) => s + Math.round((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0),
        [form.items]
    );
    const formTotal = useMemo(
        () => Math.max(0, formSubtotal - (Number(form.discount) || 0) + (Number(form.tax) || 0)),
        [formSubtotal, form.discount, form.tax]
    );
    const formDue = useMemo(
        () => Math.max(0, formTotal - Math.min(formTotal, Math.max(0, Number(form.paidAmount) || 0))),
        [formTotal, form.paidAmount]
    );

    const openCreateModal = (presetCategory = 'custom') => {
        const base = makeEmptyForm();
        base.category = presetCategory;
        if (presetCategory === 'investor_payout') {
            base.recipientRole = 'investor';
            base.paymentMethod = 'bank_transfer';
            base.items = [{ description: `Monthly Partner Dividend Payout (${todayDhaka().slice(0, 7)})`, meta: 'Equity profit share distribution', quantity: 1, unitPrice: 5000 }];
            base.paidAmount = 5000;
        }
        setForm(base);
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (doc) => {
        setForm({
            id: doc.id,
            category: doc.category || 'custom',
            recipientRole: doc.recipientRole || 'customer',
            recipientName: doc.recipientName || '',
            recipientPhone: doc.recipientPhone || '',
            recipientEmail: doc.recipientEmail || '',
            recipientSubtitle: doc.recipientSubtitle || '',
            userId: doc.userId || '',
            investorId: doc.investorId || '',
            issueDate: doc.issueDate || todayDhaka(),
            dueDate: doc.dueDate || '',
            items: Array.isArray(doc.items) && doc.items.length
                ? doc.items.map(i => ({ description: i.description, meta: i.meta || '', quantity: i.quantity || 1, unitPrice: i.unitPrice || 0 }))
                : [{ description: '', meta: '', quantity: 1, unitPrice: 0 }],
            discount: doc.discount || 0,
            tax: doc.tax || 0,
            paidAmount: doc.paidAmount || 0,
            paymentMethod: doc.paymentMethod || 'cash',
            transactionRef: doc.transactionRef || '',
            notes: doc.notes || ''
        });
        setFormError('');
        setModalOpen(true);
    };

    const applyQuickCustomer = (userId) => {
        const u = (users || []).find(x => x.id === userId);
        if (!u) return;
        setForm(f => ({
            ...f,
            userId: u.id,
            recipientName: u.name || f.recipientName,
            recipientPhone: u.phone || f.recipientPhone,
            recipientEmail: u.email && !u.email.endsWith('@bookcrossbar.com') ? u.email : f.recipientEmail,
            recipientSubtitle: 'Registered Arena Customer'
        }));
    };

    const applyQuickInvestor = (invId) => {
        const inv = (investors || []).find(x => x.id === invId);
        if (!inv) return;
        setForm(f => ({
            ...f,
            investorId: inv.id,
            category: 'investor_payout',
            recipientRole: 'investor',
            recipientName: inv.name || f.recipientName,
            recipientPhone: inv.phone || f.recipientPhone,
            recipientEmail: inv.email || f.recipientEmail,
            recipientSubtitle: `${inv.sharePercentage ?? 0}% Equity Shareholder${Number(inv.capitalInvested) > 0 ? ` · Invested ৳${Number(inv.capitalInvested).toLocaleString()}` : ''}`
        }));
    };

    const updateLineItem = (idx, field, val) => {
        setForm(f => {
            const nextItems = f.items.map((it, i) => (i === idx ? { ...it, [field]: val } : it));
            return { ...f, items: nextItems };
        });
    };

    const addLineItem = () => {
        if (form.items.length >= 20) return;
        setForm(f => ({ ...f, items: [...f.items, { description: '', meta: '', quantity: 1, unitPrice: 0 }] }));
    };

    const removeLineItem = (idx) => {
        if (form.items.length <= 1) return;
        setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
    };

    const handleSubmitInvoice = async (e) => {
        e.preventDefault();
        if (saving) return;
        setFormError('');

        if (form.recipientName.trim().length < 2) {
            setFormError('Enter the recipient name (at least 2 characters).');
            return;
        }
        const badItem = form.items.find(it => String(it.description || '').trim().length < 2);
        if (badItem) {
            setFormError('Every line item needs a description of at least 2 characters.');
            return;
        }

        const payload = {
            category: form.category,
            recipientRole: form.recipientRole,
            recipientName: form.recipientName.trim(),
            recipientPhone: form.recipientPhone.trim(),
            recipientEmail: form.recipientEmail.trim(),
            recipientSubtitle: form.recipientSubtitle.trim(),
            userId: form.userId || '',
            investorId: form.investorId || '',
            issueDate: form.issueDate || todayDhaka(),
            dueDate: form.dueDate || undefined,
            items: form.items.map(it => ({
                description: it.description.trim(),
                meta: (it.meta || '').trim(),
                quantity: Math.max(1, Number(it.quantity) || 1),
                unitPrice: Math.max(0, Number(it.unitPrice) || 0)
            })),
            discount: Math.max(0, Number(form.discount) || 0),
            tax: Math.max(0, Number(form.tax) || 0),
            paidAmount: form.paymentMethod === 'unpaid' ? 0 : Math.max(0, Number(form.paidAmount) || 0),
            paymentMethod: form.paymentMethod,
            transactionRef: form.transactionRef.trim(),
            notes: form.notes.trim()
        };

        setSaving(true);
        const res = form.id
            ? await handleUpdateInvoice(form.id, payload)
            : await handleCreateInvoice(payload);
        setSaving(false);

        if (!res?.ok) {
            setFormError(res?.error || 'Could not save invoice.');
            return;
        }
        setModalOpen(false);
        if (res.invoice) {
            openInvoice(buildCustomInvoice(res.invoice, siteSettings));
        }
    };

    const handleMarkCustomPaid = async (doc) => {
        if (busyId) return;
        setBusyId(doc.id);
        await handleUpdateInvoice(doc.id, { markPaid: true, paymentMethod: doc.paymentMethod === 'unpaid' ? 'cash' : doc.paymentMethod });
        setBusyId('');
    };

    const confirmDeleteCustomInvoice = async () => {
        if (!deleteTarget || deleting) return;
        setDeleteError('');
        setDeleting(true);
        const res = await handleDeleteInvoice(deleteTarget.id);
        setDeleting(false);
        if (!res?.ok) {
            setDeleteError(res?.error || 'Could not delete invoice.');
            return;
        }
        setDeleteTarget(null);
    };

    const inputCls = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2 text-xs text-white outline-none';

    return (
        <div className="space-y-5 animate-fade-in font-sans">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
                        <FileText className="w-5 h-5 text-lime-400"/>
                        <span>Invoices, Receipts &amp; Payout Vouchers</span>
                    </h2>
                    <p className="text-xs text-slate-400 max-w-2xl mt-1">
                        Create custom invoices, or preview, print, and download A4 PDF invoices for every turf slot booking, customer payment, shop order, tournament entry, refund, and investor dividend payout.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {can('investors') && (
                        <button
                            type="button"
                            onClick={() => openCreateModal('investor_payout')}
                            className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            <Users className="w-4 h-4"/>
                            <span>+ Payout Voucher</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => openCreateModal('custom')}
                        className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shadow-lg shadow-lime-400/20 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 stroke-[3]"/>
                        <span>Create Invoice</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c131a] border border-white/10">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">All Documents</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">{counts.all}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Ready for instant PDF download</div>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c131a] border border-emerald-500/20">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Booking Invoices</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">{counts.booking}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Customer turf &amp; add-on bills</div>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c131a] border border-lime-400/20">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Investor Payouts</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-lime-400 mt-1">{counts.investor_payout}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Dividend disbursement vouchers</div>
                </div>
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0c131a] border border-white/10">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Custom Invoices</div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">{counts.custom}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{counts.shop_order + counts.tournament} shop &amp; cup invoices</div>
                </div>
            </div>

            {/* Category Tabs + Search & Settlement Filter */}
            <div className="space-y-3">
                <div className="app-tab-strip text-xs">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => { setActiveTab(tab.key); setVisibleCount(PAGE_SIZE); }}
                            className={`px-3.5 py-2 rounded-xl whitespace-nowrap font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                                activeTab === tab.key
                                    ? 'bg-lime-400 text-slate-950 font-black'
                                    : 'bg-[#0c131a] border border-white/10 text-slate-400 hover:text-white'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                                activeTab === tab.key ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-400'
                            }`}>
                                {counts[tab.key] || 0}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                        <input
                            type="search"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                            placeholder="Search invoice #, booking code, customer, investor, phone, team, TrxID..."
                            className="w-full bg-[#0c131a] border border-white/10 focus:border-lime-400 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 outline-none"
                        />
                    </div>
                    <select
                        value={settlementFilter}
                        onChange={e => { setSettlementFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
                        aria-label="Filter by payment status"
                        className="bg-[#0c131a] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none sm:w-44"
                    >
                        <option value="all">All Statuses</option>
                        <option value="paid">Settled / Paid / Disbursed</option>
                        <option value="due">Balance Due / Unpaid</option>
                    </select>
                </div>
            </div>

            {/* Invoices List */}
            {isLoadingData && allInvoiceRows.length === 0 ? (
                <div className="space-y-2.5">
                    {[1, 2, 3, 4].map(n => <div key={n} className="h-20 rounded-2xl bg-[#0c131a] border border-white/5 animate-pulse"/>)}
                </div>
            ) : filteredRows.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#0c131a] border border-white/10 text-slate-400 text-xs space-y-2">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto"/>
                    <div className="text-sm font-bold text-white">No matching invoices found</div>
                    <p>Try clearing the search filter or click &ldquo;Create Invoice&rdquo; to issue a new custom invoice.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {/* MOBILE APP CARDS */}
                    <div className="md:hidden space-y-2.5">
                        {visibleRows.map(row => {
                            const inv = row.invoice;
                            const raw = row.rawCustom;
                            const pillCls = TONE_PILL[inv.statusTone] || TONE_PILL.emerald;
                            return (
                                <div key={row.key} className="p-4 rounded-2xl bg-[#0c131a] border border-white/10 space-y-3 text-xs">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{inv.docTypeLabel}</div>
                                            <div className="font-mono font-black text-lime-400 text-sm truncate mt-0.5">{inv.invoiceNumber}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border shrink-0 ${pillCls}`}>
                                            {inv.statusBadge}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-bold text-white truncate">{inv.recipient?.name}</div>
                                            <div className="text-[11px] text-slate-400 truncate">
                                                {inv.recipient?.subtitle || inv.recipient?.phone || inv.issueDate}
                                            </div>
                                        </div>
                                        <div className="text-right font-mono shrink-0">
                                            <div className="text-sm font-black text-white">{money(inv.totalAmount)}</div>
                                            {Number(inv.dueAmount) > 0 && (
                                                <div className="text-[10.5px] text-amber-300 font-bold">Due {money(inv.dueAmount)}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-1.5">
                                        <span className="text-[11px] font-mono text-slate-500">{inv.issueDate}</span>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {raw && Number(raw.dueAmount) > 0 && raw.status !== 'cancelled' && (
                                                <button
                                                    type="button"
                                                    disabled={busyId === raw.id}
                                                    onClick={() => handleMarkCustomPaid(raw)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] cursor-pointer"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => openInvoice(inv)}
                                                className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-emerald-400"/>
                                                <span>Preview</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => downloadInvoice(inv)}
                                                className="px-2.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <Download className="w-3.5 h-3.5"/>
                                                <span>PDF</span>
                                            </button>
                                            {raw && (
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(raw)}
                                                    className="p-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                                                    aria-label="Edit custom invoice"
                                                >
                                                    <Pencil className="w-3.5 h-3.5"/>
                                                </button>
                                            )}
                                            {raw && isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setDeleteError(''); setDeleteTarget(raw); }}
                                                    className="p-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/25 cursor-pointer"
                                                    aria-label="Delete custom invoice"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5"/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block rounded-2xl bg-[#0c131a] border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/10">
                                        <th className="px-4 py-3">Invoice &amp; Type</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Recipient / Party</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3 text-right">Paid / Due</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {visibleRows.map(row => {
                                        const inv = row.invoice;
                                        const raw = row.rawCustom;
                                        const pillCls = TONE_PILL[inv.statusTone] || TONE_PILL.emerald;
                                        return (
                                            <tr key={row.key} className="hover:bg-white/[0.025] transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-mono font-bold text-lime-400">{inv.invoiceNumber}</div>
                                                    <div className="text-[10.5px] uppercase tracking-wider text-slate-400 mt-0.5">{inv.docTypeLabel}</div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                                                    {inv.issueDate}
                                                </td>
                                                <td className="px-4 py-3 max-w-[260px]">
                                                    <div className="font-bold text-white truncate">{inv.recipient?.name}</div>
                                                    <div className="text-[11px] text-slate-400 truncate">
                                                        {[inv.recipient?.phone, inv.recipient?.subtitle].filter(Boolean).join(' · ') || '—'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono font-black text-white text-right whitespace-nowrap">
                                                    {money(inv.totalAmount)}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-right whitespace-nowrap">
                                                    <div className="text-emerald-400 font-bold">{money(inv.paidAmount)}</div>
                                                    {Number(inv.dueAmount) > 0 && (
                                                        <div className="text-[11px] text-amber-300">Due {money(inv.dueAmount)}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${pillCls}`}>
                                                        {inv.statusBadge}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center justify-end gap-1.5">
                                                        {raw && Number(raw.dueAmount) > 0 && raw.status !== 'cancelled' && (
                                                            <button
                                                                type="button"
                                                                disabled={busyId === raw.id}
                                                                onClick={() => handleMarkCustomPaid(raw)}
                                                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 font-bold text-[11px] transition-colors cursor-pointer"
                                                                title="Mark invoice paid in full"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1"/>
                                                                Settled
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => openInvoice(inv)}
                                                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                                            title="Preview invoice"
                                                        >
                                                            <Eye className="w-3.5 h-3.5 text-emerald-400"/>
                                                            <span>View</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => printInvoiceDocument(inv)}
                                                            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                                                            title="Print A4 invoice"
                                                            aria-label="Print invoice"
                                                        >
                                                            <Printer className="w-3.5 h-3.5"/>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadInvoice(inv)}
                                                            className="px-2.5 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                                            title="Download PDF"
                                                        >
                                                            <Download className="w-3.5 h-3.5"/>
                                                            <span>PDF</span>
                                                        </button>
                                                        {raw && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(raw)}
                                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                                                                title="Edit custom invoice"
                                                                aria-label="Edit custom invoice"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5"/>
                                                            </button>
                                                        )}
                                                        {raw && isAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { setDeleteError(''); setDeleteTarget(raw); }}
                                                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 cursor-pointer"
                                                                title="Delete custom invoice (Super Admin only)"
                                                                aria-label="Delete custom invoice"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5"/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {filteredRows.length > visibleCount && (
                        <div className="pt-2 flex justify-center">
                            <button
                                type="button"
                                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                            >
                                Show more ({filteredRows.length - visibleCount} remaining)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* CREATE / EDIT CUSTOM INVOICE MODAL */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="custom-invoice-modal-title"
                    onClick={(e) => { if (e.target === e.currentTarget && !saving) setModalOpen(false); }}
                >
                    <div className="bg-[#0c131a] border-t sm:border border-lime-400/30 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-2xl w-full max-h-[93dvh] overflow-y-auto custom-scrollbar space-y-4 shadow-2xl text-xs">
                        <div className="sm:hidden w-10 h-1 rounded-full bg-white/15 mx-auto -mt-1 mb-1"/>
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div>
                                <h3 id="custom-invoice-modal-title" className="text-base font-bold text-white font-display">
                                    {form.id ? 'Edit Official Invoice' : 'Create Official Invoice / Voucher'}
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Saved to MongoDB with a unique invoice number and downloadable as A4 PDF immediately.
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitInvoice} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Document Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => {
                                            const cat = e.target.value;
                                            setForm(f => ({
                                                ...f,
                                                category: cat,
                                                recipientRole: cat === 'investor_payout' ? 'investor' : f.recipientRole
                                            }));
                                        }}
                                        className={inputCls}
                                    >
                                        {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Recipient Type</label>
                                    <select
                                        value={form.recipientRole}
                                        onChange={e => setForm(f => ({ ...f, recipientRole: e.target.value }))}
                                        className={inputCls}
                                    >
                                        <option value="customer">Customer / Squad Captain</option>
                                        <option value="investor">Equity Investor Partner</option>
                                        <option value="organization">Company / Sponsor / Organization</option>
                                    </select>
                                </div>
                            </div>

                            {/* Quick-fill from existing Investors or Customers */}
                            {form.recipientRole === 'investor' && investors.length > 0 && (
                                <div className="p-3 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20">
                                    <label className="block text-emerald-300 font-semibold mb-1">Quick-fill Equity Partner</label>
                                    <select
                                        value={form.investorId}
                                        onChange={e => applyQuickInvestor(e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="">— Select partner to auto-fill details —</option>
                                        {investors.map(inv => (
                                            <option key={inv.id} value={inv.id}>
                                                {inv.name} ({inv.sharePercentage}% · {inv.phone})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {form.recipientRole === 'customer' && users.length > 0 && (
                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                                    <label className="block text-slate-300 font-semibold mb-1">Quick-fill Registered Customer (optional)</label>
                                    <select
                                        value={form.userId}
                                        onChange={e => applyQuickCustomer(e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="">— Type manually below or pick an account —</option>
                                        {users.filter(u => u.role === 'player').slice(0, 100).map(u => (
                                            <option key={u.id} value={u.id}>{u.name} · {u.phone}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Recipient Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Recipient Name <span className="text-lime-400">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={100}
                                        placeholder="Customer, partner, or company name"
                                        value={form.recipientName}
                                        onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Squad / Organization / Subtitle</label>
                                    <input
                                        type="text"
                                        maxLength={140}
                                        placeholder="e.g. Uttara FC · Corporate Friendly"
                                        value={form.recipientSubtitle}
                                        onChange={e => setForm(f => ({ ...f, recipientSubtitle: e.target.value }))}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        maxLength={20}
                                        placeholder="017XXXXXXXX"
                                        value={form.recipientPhone}
                                        onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))}
                                        className={`${inputCls} font-mono`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        maxLength={120}
                                        placeholder="email@example.com"
                                        value={form.recipientEmail}
                                        onChange={e => setForm(f => ({ ...f, recipientEmail: e.target.value }))}
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#080d12] border border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-lime-400 font-bold">
                                        Invoice Line Items ({form.items.length})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={addLineItem}
                                        className="px-2.5 py-1 rounded-lg bg-lime-400/15 hover:bg-lime-400/25 border border-lime-400/30 text-lime-300 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3 h-3"/> Add Line
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {form.items.map((it, idx) => (
                                        <div key={idx} className="p-2.5 rounded-xl bg-[#0c131a] border border-white/10 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength={160}
                                                    placeholder="Item description (e.g. 3-Hour Corporate Tournament Turf Hire)"
                                                    value={it.description}
                                                    onChange={e => updateLineItem(idx, 'description', e.target.value)}
                                                    className={inputCls}
                                                />
                                                {form.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLineItem(idx)}
                                                        className="p-2 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 cursor-pointer shrink-0"
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5"/>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                                <div className="sm:col-span-6">
                                                    <input
                                                        type="text"
                                                        maxLength={120}
                                                        placeholder="Optional subtitle / date / slot note"
                                                        value={it.meta}
                                                        onChange={e => updateLineItem(idx, 'meta', e.target.value)}
                                                        className={inputCls}
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={10000}
                                                        value={it.quantity}
                                                        onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                                                        aria-label="Quantity"
                                                        placeholder="Qty"
                                                        className={`${inputCls} font-mono`}
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={10}
                                                        value={it.unitPrice}
                                                        onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                                                        aria-label="Unit price"
                                                        placeholder="Rate (৳)"
                                                        className={`${inputCls} font-mono`}
                                                    />
                                                </div>
                                                <div className="sm:col-span-2 text-right font-mono font-bold text-lime-400 px-1">
                                                    {money((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals, Dates & Payment */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Discount (৳)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.discount}
                                        onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                                        className={`${inputCls} font-mono`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">VAT / Tax (৳)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.tax}
                                        onChange={e => setForm(f => ({ ...f, tax: e.target.value }))}
                                        className={`${inputCls} font-mono`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Issue Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.issueDate}
                                        onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                                        className={`${inputCls} font-mono [color-scheme:dark]`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Due Date (optional)</label>
                                    <input
                                        type="date"
                                        value={form.dueDate}
                                        onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                        className={`${inputCls} font-mono [color-scheme:dark]`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-slate-300 font-semibold">Paid / Disbursed (৳)</label>
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, paidAmount: formTotal, paymentMethod: f.paymentMethod === 'unpaid' ? 'cash' : f.paymentMethod }))}
                                            className="text-[10.5px] font-bold text-lime-400 hover:underline cursor-pointer"
                                        >
                                            Full ({money(formTotal)})
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        min={0}
                                        max={formTotal}
                                        value={form.paymentMethod === 'unpaid' ? 0 : form.paidAmount}
                                        disabled={form.paymentMethod === 'unpaid'}
                                        onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))}
                                        className={`${inputCls} font-mono disabled:opacity-50`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                                    <select
                                        value={form.paymentMethod}
                                        onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value, paidAmount: e.target.value === 'unpaid' ? 0 : f.paidAmount }))}
                                        className={inputCls}
                                    >
                                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Transaction Ref / TrxID</label>
                                    <input
                                        type="text"
                                        maxLength={100}
                                        placeholder="Optional TrxID / Cheque #"
                                        value={form.transactionRef}
                                        onChange={e => setForm(f => ({ ...f, transactionRef: e.target.value }))}
                                        className={`${inputCls} font-mono`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 font-semibold mb-1">Notes / Terms</label>
                                <textarea
                                    rows={2}
                                    maxLength={500}
                                    placeholder="Optional invoice notes, bank account info, or match instructions..."
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    className={`${inputCls} resize-y`}
                                />
                            </div>

                            {/* Live Summary Strip */}
                            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                                <span>Subtotal: <strong className="text-white">{money(formSubtotal)}</strong></span>
                                <span>Total: <strong className="text-lime-400 text-sm">{money(formTotal)}</strong></span>
                                <span>Balance Due: <strong className={formDue > 0 ? 'text-amber-300' : 'text-emerald-400'}>{money(formDue)}</strong></span>
                            </div>

                            {formError && <p role="alert" className="text-rose-400 text-xs">{formError}</p>}

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                                    <span>{saving ? 'Saving…' : form.id ? 'Update & Preview' : 'Create & Open Invoice'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                open={Boolean(deleteTarget)}
                badge="Delete Invoice · Super Admin"
                title="Are you sure you want to delete this invoice?"
                itemName={deleteTarget ? `${deleteTarget.invoiceNumber} · ${deleteTarget.recipientName} (${money(deleteTarget.totalAmount)})` : ''}
                description="This permanently removes the custom invoice from MongoDB. Automatically generated booking, shop, and payout invoices are unaffected."
                loading={deleting}
                error={deleteError}
                onCancel={() => { if (!deleting) setDeleteTarget(null); }}
                onConfirm={confirmDeleteCustomInvoice}
            />
        </div>
    );
}
