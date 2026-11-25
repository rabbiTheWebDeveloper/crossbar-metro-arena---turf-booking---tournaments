'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
    MessageSquare, Send, Users, Phone, Wallet, Clock, AlertTriangle, CheckCircle2,
    RefreshCw, Search, Calendar, Sparkles, ChevronDown, ChevronUp, ChevronLeft,
    ChevronRight, FileText, Download, X, CheckSquare, Square, Settings, BellRing,
    Copy, Check, Loader2, ShieldAlert, Layers
} from 'lucide-react';
import { parsePhoneTokens, estimateSmsParts, normalizeScheduleInput } from '@/lib/smsUtils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 15;

const INPUT_CLS = 'w-full bg-[#080d12] border border-white/10 focus:border-lime-400/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-colors';

const CATEGORY_META = {
    manual: { label: 'Manual SMS', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    bulk_campaign: { label: 'Bulk Campaign', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
    booking_confirmed: { label: 'Booking Confirmed', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    payment_success: { label: 'Payment Success', cls: 'bg-lime-400/15 text-lime-300 border-lime-400/30' },
    pre_match_reminder: { label: '15m Reminder', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    bulk_booking_series: { label: 'Fixed Series', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
    test: { label: 'Test SMS', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
};

const STATUS_META = {
    submitted: { label: 'Submitted', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    scheduled: { label: 'Scheduled', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    completed: { label: 'Delivered', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    partial: { label: 'Partial', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
    failed: { label: 'Failed', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' }
};

const HISTORY_TABS = [
    { key: 'all', label: 'All History' },
    { key: 'manual_bulk', label: 'Manual & Bulk' },
    { key: 'booking_confirmed', label: 'Booking Confirmed' },
    { key: 'payment_success', label: 'Payment Success' },
    { key: 'pre_match_reminder', label: '15m Reminders' },
    { key: 'bulk_booking_series', label: 'Fixed Series' }
];

const CONTACT_FILTERS = [
    { key: 'all', label: 'All Contacts' },
    { key: 'customer', label: 'Customers' },
    { key: 'today', label: "Today's Captains" },
    { key: 'player', label: 'Players' },
    { key: 'investor', label: 'Investors' },
    { key: 'staff', label: 'Staff & Admins' }
];

const SMS_TEMPLATES = [
    {
        id: 'tonight_slots',
        label: 'Prime Slots Open',
        text: 'Crossbar Metro Arena: Prime evening slots are open tonight! Book your 90-min match at bookcrossbar.com or call our desk to lock your pitch.'
    },
    {
        id: 'weekend_promo',
        label: 'Weekend Booking',
        text: 'Crossbar Metro Arena: Weekend turf slots are filling fast! Confirm your squad slot now with Tk 500 advance at bookcrossbar.com.'
    },
    {
        id: 'tournament',
        label: 'Tournament Open',
        text: 'Crossbar Metro Arena: Tournament registration is NOW OPEN! Limited squad spots available. Register online at bookcrossbar.com/events.'
    },
    {
        id: 'match_notice',
        label: 'Match Notice',
        text: 'Crossbar Metro Arena: Please arrive 15 mins before your scheduled kickoff time. Turf/AG boots only (no metal/FG studs). Uttara Sector 17.'
    }
];

function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function csvCell(value) {
    const str = String(value ?? '');
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
}

export default function AdminBulkSmsPage() {
    // Gateway status & KPI stats
    const [smsInfo, setSmsInfo] = useState({
        configured: false,
        source: 'none',
        smsSenderId: '',
        balance: null,
        validity: '',
        balanceError: ''
    });
    const [stats, setStats] = useState({
        totalRecords: 0,
        totalDispatched: 0,
        totalRecipients: 0,
        totalSegments: 0,
        scheduledCount: 0,
        failedCount: 0
    });

    // Contacts & audiences directory
    const [contacts, setContacts] = useState([]);
    const [audiences, setAudiences] = useState([]);
    const [contactsLoading, setContactsLoading] = useState(true);

    // Composer recipient selection state (all 3 sources combine & deduplicate!)
    const [recipientTab, setRecipientTab] = useState('manual'); // 'manual' | 'contacts' | 'audiences'
    const [manualNumbers, setManualNumbers] = useState('');
    const [selectedPhones, setSelectedPhones] = useState(() => new Set());
    const [selectedAudiences, setSelectedAudiences] = useState(() => new Set());
    const [contactGroupFilter, setContactGroupFilter] = useState('all');
    const [contactSearch, setContactSearch] = useState('');

    // Message & delivery options
    const [message, setMessage] = useState('');
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduleInput, setScheduleInput] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [senderIdOverride, setSenderIdOverride] = useState('');
    const [contentId, setContentId] = useState('');

    // Submission & confirmation modal
    const [sending, setSending] = useState(false);
    const [composerFeedback, setComposerFeedback] = useState(null);
    const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
    const [syncingReminders, setSyncingReminders] = useState(false);

    // History table state
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [historyError, setHistoryError] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [historySearch, setHistorySearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 1 });

    // Delivery report modal state
    const [checkingLogId, setCheckingLogId] = useState('');
    const [activeReportModal, setActiveReportModal] = useState(null);
    const [copiedId, setCopiedId] = useState('');

    const latestHistoryReq = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(historySearch.trim()), 300);
        return () => clearTimeout(timer);
    }, [historySearch]);

    useEffect(() => {
        setPage(1);
    }, [categoryFilter, statusFilter, debouncedSearch]);

    // Load SMS status, balance, KPI stats, and paginated history
    const loadHistoryAndStatus = useCallback(async () => {
        const reqId = ++latestHistoryReq.current;
        setLogsLoading(true);
        try {
            const qs = new URLSearchParams({
                includeLogs: '1',
                page: String(page),
                limit: String(PAGE_SIZE),
                category: categoryFilter,
                status: statusFilter
            });
            if (debouncedSearch) qs.set('q', debouncedSearch);

            const res = await fetch(`/api/sms?${qs.toString()}`, { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (reqId !== latestHistoryReq.current) return;

            if (!res.ok) {
                setHistoryError(data.error || `Failed to load SMS history (${res.status})`);
                return;
            }
            setHistoryError('');
            if (data.sms) setSmsInfo(data.sms);
            if (data.stats) setStats(data.stats);
            setLogs(data.logs || []);
            if (data.pagination) setPagination(data.pagination);
        } catch {
            if (reqId === latestHistoryReq.current) {
                setHistoryError('Network error while loading SMS data.');
            }
        } finally {
            if (reqId === latestHistoryReq.current) {
                setLogsLoading(false);
            }
        }
    }, [page, categoryFilter, statusFilter, debouncedSearch]);

    // Load Customers, Users, Investors & Audience presets
    const loadContacts = useCallback(async () => {
        setContactsLoading(true);
        try {
            const res = await fetch('/api/sms/contacts', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setContacts(data.contacts || []);
                setAudiences(data.audiences || []);
            }
        } catch {
            // ignore contact directory fetch error
        } finally {
            setContactsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistoryAndStatus();
    }, [loadHistoryAndStatus]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    // Real-time manual phone parsing
    const manualParsed = useMemo(() => parsePhoneTokens(manualNumbers), [manualNumbers]);

    // Filtered contact directory for the picker
    const filteredContacts = useMemo(() => {
        const q = contactSearch.trim().toLowerCase();
        return contacts.filter(c => {
            if (contactGroupFilter !== 'all' && !(c.groups || []).includes(contactGroupFilter)) {
                return false;
            }
            if (!q) return true;
            return (
                (c.name || '').toLowerCase().includes(q) ||
                (c.phone || '').includes(q) ||
                (c.teamName || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q)
            );
        });
    }, [contacts, contactGroupFilter, contactSearch]);

    // Deduplicated union of Audience phones + Picked contacts + Manual numbers
    const mergedRecipients = useMemo(() => {
        const all = new Set();
        const audienceLabels = [];

        for (const key of selectedAudiences) {
            const aud = audiences.find(a => a.key === key);
            if (aud) {
                audienceLabels.push(aud.label);
                for (const p of aud.phones || []) all.add(p);
            }
        }
        for (const p of selectedPhones) all.add(p);
        for (const p of manualParsed.valid) all.add(p);

        return {
            phones: [...all],
            total: all.size,
            audienceLabels
        };
    }, [selectedAudiences, audiences, selectedPhones, manualParsed.valid]);

    // Live SMS character & segment calculator
    const smsMetrics = useMemo(() => estimateSmsParts(message), [message]);
    const estimatedTotalSegments = Math.max(0, smsMetrics.parts * mergedRecipients.total);

    const togglePhone = (phone) => {
        setSelectedPhones(prev => {
            const next = new Set(prev);
            if (next.has(phone)) next.delete(phone);
            else next.add(phone);
            return next;
        });
    };

    const selectAllVisibleContacts = () => {
        setSelectedPhones(prev => {
            const next = new Set(prev);
            for (const c of filteredContacts) next.add(c.phone);
            return next;
        });
    };

    const clearSelectedContacts = () => {
        setSelectedPhones(new Set());
    };

    const toggleAudience = (key) => {
        setSelectedAudiences(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const clearAllRecipients = () => {
        setManualNumbers('');
        setSelectedPhones(new Set());
        setSelectedAudiences(new Set());
    };

    // Human-readable recipient summary for SmsLog
    const buildRecipientSummary = () => {
        const parts = [...mergedRecipients.audienceLabels];
        if (selectedPhones.size === 1 && parts.length === 0 && manualParsed.valid.length === 0) {
            const onlyPhone = [...selectedPhones][0];
            const found = contacts.find(c => c.phone === onlyPhone);
            return found?.name ? `${found.name} (${onlyPhone})` : onlyPhone;
        }
        if (selectedPhones.size > 0) {
            parts.push(`${selectedPhones.size} selected contact${selectedPhones.size === 1 ? '' : 's'}`);
        }
        if (manualParsed.valid.length > 0) {
            if (manualParsed.valid.length === 1 && parts.length === 0) {
                const onlyManual = manualParsed.valid[0];
                const found = contacts.find(c => c.phone === onlyManual);
                return found?.name ? `${found.name} (${onlyManual})` : onlyManual;
            }
            parts.push(`${manualParsed.valid.length} manual number${manualParsed.valid.length === 1 ? '' : 's'}`);
        }
        return parts.length > 0
            ? `${parts.join(' + ')} (${mergedRecipients.total})`
            : `${mergedRecipients.total} recipient${mergedRecipients.total === 1 ? '' : 's'}`;
    };

    const executeSendSms = async () => {
        if (sending) return;
        setConfirmBulkOpen(false);
        setSending(true);
        setComposerFeedback(null);

        try {
            const formattedSchedule = scheduleEnabled ? normalizeScheduleInput(scheduleInput) : '';
            const payload = {
                to: manualNumbers,
                recipients: [...selectedPhones],
                audiences: [...selectedAudiences],
                msg: message.trim(),
                schedule: formattedSchedule || undefined,
                senderId: senderIdOverride.trim() || undefined,
                contentId: contentId.trim() || undefined,
                recipientSummary: buildRecipientSummary()
            };

            const res = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setComposerFeedback({
                    type: 'error',
                    text: data.error || 'Failed to dispatch SMS.'
                });
                loadHistoryAndStatus();
                return;
            }

            setComposerFeedback({
                type: 'success',
                text: data.message || `SMS sent to ${data.recipientCount} recipient(s).`
            });
            // Reset composer recipients & schedule on success, keep history fresh
            clearAllRecipients();
            setMessage('');
            setScheduleEnabled(false);
            setScheduleInput('');
            setPage(1);
            loadHistoryAndStatus();
        } catch {
            setComposerFeedback({
                type: 'error',
                text: 'Network error while sending SMS.'
            });
        } finally {
            setSending(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setComposerFeedback(null);

        if (!smsInfo.configured) {
            setComposerFeedback({
                type: 'error',
                text: 'SMS gateway is not configured yet. Add SMS_API_KEY in Settings first.'
            });
            return;
        }
        if (mergedRecipients.total === 0) {
            setComposerFeedback({
                type: 'error',
                text: 'Add at least one valid Bangladeshi mobile number or pick a customer/user.'
            });
            return;
        }
        if (!message.trim()) {
            setComposerFeedback({
                type: 'error',
                text: 'Enter an SMS message before sending.'
            });
            return;
        }
        if (scheduleEnabled) {
            const norm = normalizeScheduleInput(scheduleInput);
            if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(norm)) {
                setComposerFeedback({
                    type: 'error',
                    text: 'Pick a valid future schedule date and time.'
                });
                return;
            }
        }

        // Confirm before blasting more than 5 numbers at once
        if (mergedRecipients.total > 5) {
            setConfirmBulkOpen(true);
            return;
        }

        executeSendSms();
    };

    // Trigger 15-minute pre-match reminder check for upcoming bookings
    const handleSyncMatchReminders = async () => {
        if (syncingReminders) return;
        setSyncingReminders(true);
        setComposerFeedback(null);
        try {
            const res = await fetch('/api/sms/reminders', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setComposerFeedback({
                    type: 'error',
                    text: data.error || 'Could not sync 15-minute match reminders.'
                });
            } else {
                setComposerFeedback({
                    type: 'success',
                    text: `Checked ${data.checked || 0} upcoming booking(s): ${data.scheduled || 0} scheduled, ${data.sentNow || 0} sent immediately.`
                });
                loadHistoryAndStatus();
            }
        } catch {
            setComposerFeedback({
                type: 'error',
                text: 'Network error while syncing reminders.'
            });
        } finally {
            setSyncingReminders(false);
        }
    };

    // Fetch live delivery report from api.sms.net.bd/report/request/{id}/
    const handleCheckDeliveryReport = async (log) => {
        if (!log?.requestId) return;
        setCheckingLogId(log.id);
        try {
            const qs = new URLSearchParams({
                logId: log.id || '',
                requestId: log.requestId
            });
            const res = await fetch(`/api/sms?${qs.toString()}`, { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setActiveReportModal({
                    log,
                    error: data.message || data.error || 'Could not fetch gateway report.',
                    report: null
                });
            } else {
                const updatedLog = data.log || log;
                setLogs(prev => prev.map(item => (item.id === updatedLog.id ? updatedLog : item)));
                setActiveReportModal({
                    log: updatedLog,
                    error: '',
                    report: data.report || updatedLog.deliveryReport || null
                });
            }
        } catch {
            setActiveReportModal({
                log,
                error: 'Network error while querying sms.net.bd delivery report.',
                report: null
            });
        } finally {
            setCheckingLogId('');
        }
    };

    const handleReuseInComposer = (log) => {
        setMessage(log.message || '');
        if (Array.isArray(log.recipients) && log.recipients.length > 0) {
            setManualNumbers(log.recipients.join(', '));
            setRecipientTab('manual');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCopyText = async (key, value) => {
        try {
            await navigator.clipboard.writeText(String(value || ''));
            setCopiedId(key);
            setTimeout(() => setCopiedId(''), 1500);
        } catch {
            // ignore clipboard errors
        }
    };

    const handleExportCsv = () => {
        if (logs.length === 0) return;
        const headers = [
            'Date & Time',
            'Category',
            'Status',
            'Recipient Summary',
            'Recipient Count',
            'Recipients',
            'Encoding',
            'Total Segments',
            'Schedule',
            'Request ID',
            'Charge (BDT)',
            'Booking Code',
            'Sent By',
            'Message'
        ];
        const rows = logs.map(l => [
            formatDateTime(l.createdAt),
            CATEGORY_META[l.category]?.label || l.category,
            STATUS_META[l.status]?.label || l.status,
            l.recipientSummary || '',
            l.recipientCount || 0,
            (l.recipients || []).join('; '),
            l.encoding || 'GSM-7',
            l.totalSegments || 1,
            l.schedule || '',
            l.requestId || '',
            l.charge || '',
            l.bookingCode || '',
            l.sentBy || '',
            l.message || ''
        ]);
        const csv = [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crossbar-sms-history-page-${page}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const validityDateLabel = useMemo(() => {
        if (!smsInfo.validity) return '';
        return String(smsInfo.validity).split(' ')[0];
    }, [smsInfo.validity]);

    return (
        <div className="space-y-6">
            {/* TOP KPI & LIVE BALANCE BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* 1. Current Balance */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0e1a18] via-[#0c131a] to-[#0c131a] border border-emerald-500/25 shadow-lg shadow-black/20 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-400 font-bold flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5" />
                                <span>Current SMS Balance</span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                {smsInfo.configured && smsInfo.balance !== null ? (
                                    <span className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                                        ৳{Number(smsInfo.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                ) : (
                                    <span className="text-lg font-extrabold text-amber-300">
                                        {smsInfo.configured ? 'Unavailable' : 'Not Configured'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={loadHistoryAndStatus}
                            disabled={logsLoading}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                            title="Refresh live balance & history"
                            aria-label="Refresh live balance"
                        >
                            <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin text-emerald-400' : ''}`} />
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-white/[0.06]">
                        <span>
                            Sender: <strong className="text-slate-200 font-mono">{smsInfo.smsSenderId || 'Default Route'}</strong>
                        </span>
                        {validityDateLabel ? (
                            <span className="text-emerald-300/90 font-mono">Exp: {validityDateLabel}</span>
                        ) : (
                            <Link href="/admin/settings" className="text-lime-400 hover:underline inline-flex items-center gap-1 font-semibold">
                                <Settings className="w-3 h-3" />
                                <span>Gateway Settings</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* 2. Dispatched & Recipients */}
                <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/[0.07] flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400 font-bold">
                                SMS Dispatched
                            </div>
                            <div className="mt-2 text-2xl sm:text-3xl font-black font-display text-white">
                                {stats.totalRecipients.toLocaleString('en-IN')}
                                <span className="text-xs font-semibold text-slate-400 ml-1.5">recipients</span>
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                            <Send className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-white/[0.06] flex items-center justify-between">
                        <span>{stats.totalDispatched.toLocaleString('en-IN')} dispatches</span>
                        <span className="font-mono text-slate-300">{stats.totalSegments.toLocaleString('en-IN')} total segs</span>
                    </div>
                </div>

                {/* 3. Scheduled Queue + 15m Reminder Sync */}
                <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/[0.07] flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400 font-bold">
                                Scheduled Queue
                            </div>
                            <div className="mt-2 text-2xl sm:text-3xl font-black font-display text-amber-300">
                                {stats.scheduledCount.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 truncate">15m pre-match &amp; campaigns</span>
                        <button
                            type="button"
                            onClick={handleSyncMatchReminders}
                            disabled={syncingReminders || !smsInfo.configured}
                            className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-[11px] font-bold text-amber-200 inline-flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                            title="Ensure all upcoming confirmed matches in the next 24h have 15-min SMS reminders scheduled"
                        >
                            {syncingReminders ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellRing className="w-3 h-3" />}
                            <span>Sync 15m</span>
                        </button>
                    </div>
                </div>

                {/* 4. Gateway Failures */}
                <div className="p-5 rounded-3xl bg-[#0c131a] border border-white/[0.07] flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400 font-bold">
                                Failed / Rejected
                            </div>
                            <div className={`mt-2 text-2xl sm:text-3xl font-black font-display ${stats.failedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {stats.failedCount.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
                            stats.failedCount > 0
                                ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        }`}>
                            {stats.failedCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-white/[0.06] flex items-center justify-between">
                        <span>{contacts.length.toLocaleString('en-IN')} reachable contacts</span>
                        {stats.failedCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setStatusFilter('failed')}
                                className="text-rose-300 hover:underline font-semibold cursor-pointer"
                            >
                                View failed
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {smsInfo.balanceError && (
                <div role="alert" className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Gateway notice: {smsInfo.balanceError}</span>
                    </div>
                    <Link href="/admin/settings" className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold shrink-0">
                        Configure SMS
                    </Link>
                </div>
            )}

            {/* COMPOSER HUB: RECIPIENTS (LEFT) + MESSAGE & SCHEDULE (RIGHT) */}
            <form onSubmit={handleFormSubmit} className="rounded-3xl bg-[#0c131a] border border-white/[0.07] p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-lime-400" />
                            <span>Send Manual or Bulk SMS</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Combine manual mobile numbers, individual customers/users, or entire audience groups — duplicate numbers are merged automatically.
                        </p>
                    </div>
                    {mergedRecipients.total > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-lime-400/15 text-lime-300 border border-lime-400/30">
                                {mergedRecipients.total.toLocaleString('en-IN')} unique recipient{mergedRecipients.total === 1 ? '' : 's'}
                            </span>
                            <button
                                type="button"
                                onClick={clearAllRecipients}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 cursor-pointer"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {composerFeedback && (
                    <div
                        role={composerFeedback.type === 'error' ? 'alert' : 'status'}
                        className={`flex items-start justify-between gap-3 px-4 py-3 rounded-2xl border text-xs ${
                            composerFeedback.type === 'error'
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        }`}
                    >
                        <div className="flex items-start gap-2">
                            {composerFeedback.type === 'error'
                                ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                            <span>{composerFeedback.text}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setComposerFeedback(null)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                            aria-label="Dismiss notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: RECIPIENT SELECTION (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Recipient Source Tabs */}
                        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#080d12] border border-white/[0.07]">
                            <button
                                type="button"
                                onClick={() => setRecipientTab('manual')}
                                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    recipientTab === 'manual'
                                        ? 'bg-lime-400 text-slate-950 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Manual Numbers</span>
                                {manualParsed.valid.length > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                                        recipientTab === 'manual' ? 'bg-slate-950/20 text-slate-950' : 'bg-lime-400/20 text-lime-300'
                                    }`}>
                                        {manualParsed.valid.length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setRecipientTab('contacts')}
                                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    recipientTab === 'contacts'
                                        ? 'bg-lime-400 text-slate-950 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Customers &amp; Users</span>
                                {selectedPhones.size > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                                        recipientTab === 'contacts' ? 'bg-slate-950/20 text-slate-950' : 'bg-lime-400/20 text-lime-300'
                                    }`}>
                                        {selectedPhones.size}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setRecipientTab('audiences')}
                                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    recipientTab === 'audiences'
                                        ? 'bg-lime-400 text-slate-950 shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Bulk Groups</span>
                                {selectedAudiences.size > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                                        recipientTab === 'audiences' ? 'bg-slate-950/20 text-slate-950' : 'bg-lime-400/20 text-lime-300'
                                    }`}>
                                        {selectedAudiences.size}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* TAB 1: MANUAL NUMBERS */}
                        {recipientTab === 'manual' && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs">
                                    <label htmlFor="manual-sms-numbers" className="font-semibold text-slate-200">
                                        Enter Single or Multiple Mobile Numbers
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        Comma, space, or newline separated
                                    </span>
                                </div>
                                <textarea
                                    id="manual-sms-numbers"
                                    rows={6}
                                    value={manualNumbers}
                                    onChange={e => setManualNumbers(e.target.value)}
                                    placeholder={'01711223344\n01812345678, +8801911223344\nPaste phone column from Excel or type any number...'}
                                    className={`${INPUT_CLS} font-mono leading-relaxed resize-y`}
                                />
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-mono">
                                            Valid: {manualParsed.valid.length}
                                        </span>
                                        {manualParsed.invalid.length > 0 && (
                                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 font-mono">
                                                Invalid ignored ({manualParsed.invalid.length}): {manualParsed.invalid.slice(0, 3).join(', ')}
                                                {manualParsed.invalid.length > 3 ? '…' : ''}
                                            </span>
                                        )}
                                    </div>
                                    {manualNumbers && (
                                        <button
                                            type="button"
                                            onClick={() => setManualNumbers('')}
                                            className="text-slate-400 hover:text-white cursor-pointer"
                                        >
                                            Clear numbers
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: CUSTOMERS & USERS PICKER */}
                        {recipientTab === 'contacts' && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {CONTACT_FILTERS.map(f => (
                                        <button
                                            key={f.key}
                                            type="button"
                                            onClick={() => setContactGroupFilter(f.key)}
                                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                                                contactGroupFilter === f.key
                                                    ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40'
                                                    : 'bg-[#080d12] text-slate-400 border-white/10 hover:text-white'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={contactSearch}
                                            onChange={e => setContactSearch(e.target.value)}
                                            placeholder="Search customer, player, investor, team, or 01XXXXXXXXX..."
                                            className={`${INPUT_CLS} pl-9`}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={selectAllVisibleContacts}
                                            disabled={filteredContacts.length === 0}
                                            className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-200 cursor-pointer disabled:opacity-40"
                                        >
                                            Select visible ({filteredContacts.length})
                                        </button>
                                        {selectedPhones.size > 0 && (
                                            <button
                                                type="button"
                                                onClick={clearSelectedContacts}
                                                className="px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-[11px] font-bold text-rose-300 cursor-pointer"
                                            >
                                                Clear ({selectedPhones.size})
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="max-h-64 overflow-y-auto custom-scrollbar rounded-2xl bg-[#080d12] border border-white/[0.07] divide-y divide-white/[0.05]">
                                    {contactsLoading ? (
                                        <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
                                            <span>Loading customers &amp; users…</span>
                                        </div>
                                    ) : filteredContacts.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-slate-500">
                                            No matching contacts found. You can still type any phone number in the Manual Numbers tab.
                                        </div>
                                    ) : (
                                        filteredContacts.slice(0, 250).map(c => {
                                            const checked = selectedPhones.has(c.phone);
                                            return (
                                                <button
                                                    key={c.phone}
                                                    type="button"
                                                    onClick={() => togglePhone(c.phone)}
                                                    className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                                                        checked ? 'bg-lime-400/[0.09]' : 'hover:bg-white/[0.03]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {checked
                                                            ? <CheckSquare className="w-4 h-4 text-lime-400 shrink-0" />
                                                            : <Square className="w-4 h-4 text-slate-600 shrink-0" />}
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-bold text-white truncate">
                                                                {c.name || 'Unnamed Contact'}
                                                                {c.teamName ? (
                                                                    <span className="text-slate-400 font-normal"> · {c.teamName}</span>
                                                                ) : null}
                                                            </div>
                                                            <div className="text-[11px] font-mono text-slate-400">
                                                                {c.phone}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-end gap-1 shrink-0">
                                                        {c.isTodayCaptain && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                                                                Today {c.todaySlot ? `· ${c.todaySlot}` : ''}
                                                            </span>
                                                        )}
                                                        {c.bookingCount > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                                                {c.bookingCount} match{c.bookingCount === 1 ? '' : 'es'}
                                                            </span>
                                                        )}
                                                        {c.role && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono bg-white/[0.06] text-slate-300 border border-white/10">
                                                                {c.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: QUICK AUDIENCE GROUPS */}
                        {recipientTab === 'audiences' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {audiences.map(aud => {
                                    const active = selectedAudiences.has(aud.key);
                                    return (
                                        <button
                                            key={aud.key}
                                            type="button"
                                            onClick={() => toggleAudience(aud.key)}
                                            disabled={aud.count === 0}
                                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                                                active
                                                    ? 'bg-lime-400/10 border-lime-400/45 shadow-sm'
                                                    : 'bg-[#080d12] border-white/[0.08] hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {active
                                                        ? <CheckSquare className="w-4 h-4 text-lime-400 shrink-0" />
                                                        : <Square className="w-4 h-4 text-slate-500 shrink-0" />}
                                                    <span className="text-xs font-bold text-white">{aud.label}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                                    active ? 'bg-lime-400 text-slate-950' : 'bg-white/10 text-slate-200'
                                                }`}>
                                                    {aud.count}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1.5 pl-6">
                                                {aud.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* MERGED RECIPIENTS SUMMARY PREVIEW */}
                        <div className="p-3.5 rounded-2xl bg-[#080d12] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="text-slate-400 font-semibold">Target Recipients:</span>
                                {mergedRecipients.total === 0 ? (
                                    <span className="text-slate-500">None selected yet</span>
                                ) : (
                                    <>
                                        <span className="font-bold text-white">{buildRecipientSummary()}</span>
                                        <span className="text-[11px] font-mono text-slate-500 truncate">
                                            ({mergedRecipients.phones.slice(0, 3).join(', ')}{mergedRecipients.phones.length > 3 ? ', …' : ''})
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: MESSAGE, TEMPLATES, SCHEDULE & SUBMIT (5 cols) */}
                    <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3.5">
                            {/* Quick Templates */}
                            <div>
                                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                                    <span>Quick Templates</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {SMS_TEMPLATES.map(tpl => (
                                        <button
                                            key={tpl.id}
                                            type="button"
                                            onClick={() => setMessage(tpl.text)}
                                            className="px-2.5 py-1 rounded-xl bg-[#080d12] hover:bg-white/[0.07] border border-white/10 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                                        >
                                            {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Body */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="sms-composer-msg" className="text-xs font-semibold text-slate-200">
                                        SMS Message
                                    </label>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                        smsMetrics.encoding === 'Unicode'
                                            ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                                            : 'bg-white/[0.06] text-slate-300 border border-white/10'
                                    }`}>
                                        {smsMetrics.encoding === 'Unicode' ? 'Unicode / Bangla (70/part)' : 'GSM-7 English (160/part)'}
                                    </span>
                                </div>
                                <textarea
                                    id="sms-composer-msg"
                                    rows={5}
                                    maxLength={1500}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Write your SMS message in English or বাংলা..."
                                    className={`${INPUT_CLS} leading-relaxed resize-y`}
                                />
                                <div className="mt-1.5 grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 bg-[#080d12] px-3 py-2 rounded-xl border border-white/[0.05]">
                                    <div>
                                        Chars: <strong className="text-white">{smsMetrics.length}</strong>
                                    </div>
                                    <div className="text-center">
                                        Parts/SMS: <strong className="text-white">{smsMetrics.parts}</strong>
                                    </div>
                                    <div className="text-right">
                                        Est. Segs: <strong className="text-lime-300">{estimatedTotalSegments}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Toggle */}
                            <div className="p-3 rounded-2xl bg-[#080d12] border border-white/[0.07] space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Delivery Timing</span>
                                    </span>
                                    <div className="inline-flex rounded-xl bg-[#0c131a] p-0.5 border border-white/10 text-[11px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setScheduleEnabled(false)}
                                            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                                                !scheduleEnabled ? 'bg-lime-400 text-slate-950' : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Send Now
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setScheduleEnabled(true)}
                                            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                                                scheduleEnabled ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            Schedule
                                        </button>
                                    </div>
                                </div>

                                {scheduleEnabled && (
                                    <div className="space-y-1">
                                        <input
                                            type="datetime-local"
                                            value={scheduleInput}
                                            onChange={e => setScheduleInput(e.target.value)}
                                            className={`${INPUT_CLS} font-mono`}
                                        />
                                        <p className="text-[10.5px] text-slate-500">
                                            Scheduled in Bangladesh Standard Time (Asia/Dhaka) via sms.net.bd.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Optional Gateway Parameters */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(v => !v)}
                                    className="text-[11px] font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                                >
                                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    <span>Gateway Options (Sender ID / Campaign Content ID)</span>
                                </button>
                                {showAdvanced && (
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label htmlFor="sms-override-sender" className="block text-[11px] text-slate-400 mb-1">
                                                Sender ID <span className="text-slate-600">(optional)</span>
                                            </label>
                                            <input
                                                id="sms-override-sender"
                                                type="text"
                                                value={senderIdOverride}
                                                onChange={e => setSenderIdOverride(e.target.value)}
                                                placeholder={smsInfo.smsSenderId || 'Default gateway route'}
                                                className={`${INPUT_CLS} font-mono`}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="sms-content-id" className="block text-[11px] text-slate-400 mb-1">
                                                Content ID <span className="text-slate-600">(bulk campaign)</span>
                                            </label>
                                            <input
                                                id="sms-content-id"
                                                type="text"
                                                value={contentId}
                                                onChange={e => setContentId(e.target.value)}
                                                placeholder="Optional content_id"
                                                className={`${INPUT_CLS} font-mono`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={sending || !smsInfo.configured}
                            className="w-full py-3 px-4 rounded-2xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-lime-400/15 cursor-pointer disabled:opacity-50 transition-all"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Dispatching via sms.net.bd…</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>
                                        {scheduleEnabled ? 'Schedule SMS' : 'Send SMS Now'}
                                        {mergedRecipients.total > 0 ? ` (${mergedRecipients.total})` : ''}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* SMS HISTORY & LIVE DELIVERY REPORTS */}
            <section className="rounded-3xl bg-[#0c131a] border border-white/[0.07] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span>SMS History &amp; Live Delivery Reports</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Complete log of manual, bulk, booking confirmation, payment, and 15-minute pre-match reminder SMS.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={logs.length === 0}
                            className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Export CSV</span>
                        </button>
                        <button
                            type="button"
                            onClick={loadHistoryAndStatus}
                            disabled={logsLoading}
                            className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin text-lime-400' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Filter Tabs + Search + Status Select */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                        {HISTORY_TABS.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setCategoryFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                    categoryFilter === tab.key
                                        ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40'
                                        : 'bg-[#080d12] text-slate-400 border-white/10 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative min-w-[220px]">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={historySearch}
                                onChange={e => setHistorySearch(e.target.value)}
                                placeholder="Search phone, msg, req ID, CMA code..."
                                className={`${INPUT_CLS} pl-9`}
                            />
                        </div>
                        <select
                            aria-label="Filter SMS status"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className={`${INPUT_CLS} sm:w-40 cursor-pointer`}
                        >
                            <option value="all">Status: All</option>
                            <option value="submitted">Submitted</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Delivered</option>
                            <option value="partial">Partial</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>

                {historyError && (
                    <div role="alert" className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                        {historyError}
                    </div>
                )}

                {/* History Table */}
                <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#080d12]">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-white/[0.07] text-[10.5px] font-mono uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                                <th className="py-3 px-4">Date &amp; Time</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Recipients</th>
                                <th className="py-3 px-4 min-w-[260px]">Message</th>
                                <th className="py-3 px-4">Gateway Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                            {logsLoading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
                                            <span>Loading SMS history…</span>
                                        </span>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        No SMS logs match your current filters yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => {
                                    const catMeta = CATEGORY_META[log.category] || CATEGORY_META.manual;
                                    const stMeta = STATUS_META[log.status] || STATUS_META.submitted;
                                    const isChecking = checkingLogId === log.id;

                                    return (
                                        <tr key={log.id} className="hover:bg-white/[0.02] align-top transition-colors">
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="font-semibold text-slate-200">
                                                    {formatDateTime(log.createdAt)}
                                                </div>
                                                {log.schedule && (
                                                    <div className="mt-1 text-[10.5px] font-mono text-amber-300 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>Sched: {log.schedule}</span>
                                                    </div>
                                                )}
                                                <div className="mt-0.5 text-[10.5px] text-slate-500">
                                                    By {log.sentBy || 'System'}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${catMeta.cls}`}>
                                                    {catMeta.label}
                                                </span>
                                                {log.bookingCode && (
                                                    <div className="mt-1.5 font-mono text-[11px] text-emerald-300">
                                                        {log.bookingCode}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-white max-w-[210px] break-words">
                                                    {log.recipientSummary || (log.recipients || [])[0] || '—'}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono text-slate-400">
                                                    <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-300">
                                                        {log.recipientCount || 1} num{(log.recipientCount || 1) === 1 ? '' : 's'}
                                                    </span>
                                                    <span>· {log.totalSegments || 1} seg{(log.totalSegments || 1) === 1 ? '' : 's'}</span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 max-w-md">
                                                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                                                    {log.message}
                                                </p>
                                                <div className="mt-1 text-[10px] font-mono text-slate-500">
                                                    {log.encoding || 'GSM-7'}{log.senderId ? ` · Sender: ${log.senderId}` : ''}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${stMeta.cls}`}>
                                                    {stMeta.label}
                                                </span>
                                                {log.requestId && (
                                                    <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-slate-400">
                                                        <span>#{log.requestId}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyText(log.id, log.requestId)}
                                                            className="text-slate-500 hover:text-white cursor-pointer"
                                                            title="Copy Request ID"
                                                        >
                                                            {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                        </button>
                                                    </div>
                                                )}
                                                {log.charge && (
                                                    <div className="mt-0.5 text-[11px] font-mono text-emerald-300">
                                                        Charge: ৳{Number(log.charge).toFixed(2)}
                                                    </div>
                                                )}
                                                {log.errorMessage && (
                                                    <div className="mt-1 text-[10.5px] text-rose-300 max-w-[190px] whitespace-normal">
                                                        {log.errorMessage}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                <div className="inline-flex flex-col items-end gap-1.5">
                                                    {log.requestId && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCheckDeliveryReport(log)}
                                                            disabled={isChecking}
                                                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold text-emerald-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                        >
                                                            {isChecking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                            <span>Check Report</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReuseInComposer(log)}
                                                        className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-[11px] font-semibold text-slate-300 cursor-pointer"
                                                    >
                                                        Reuse in Composer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                        <span>
                            Page <strong className="text-white">{pagination.page}</strong> of <strong className="text-white">{pagination.pages}</strong> ({pagination.total} records)
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 cursor-pointer disabled:opacity-40"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={page >= pagination.pages}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 cursor-pointer disabled:opacity-40"
                                aria-label="Next page"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* BULK DISPATCH CONFIRMATION MODAL */}
            {confirmBulkOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-bulk-sms-title"
                >
                    <div className="bg-[#0c131a] border border-lime-400/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 id="confirm-bulk-sms-title" className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                                <Send className="w-4 h-4 text-lime-400" />
                                <span>Confirm Bulk SMS Dispatch</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setConfirmBulkOpen(false)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#080d12] border border-white/10 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Unique Recipients:</span>
                                <strong className="text-lime-300 font-mono">{mergedRecipients.total}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Estimated Total Segments:</span>
                                <strong className="text-white font-mono">{estimatedTotalSegments} ({smsMetrics.encoding})</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Delivery:</span>
                                <strong className="text-amber-200 font-mono">
                                    {scheduleEnabled ? normalizeScheduleInput(scheduleInput) : 'Immediate'}
                                </strong>
                            </div>
                            <div className="pt-2 border-t border-white/[0.06] text-slate-300 whitespace-pre-wrap break-words">
                                {message.trim()}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setConfirmBulkOpen(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={executeSendSms}
                                disabled={sending}
                                className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>Confirm &amp; Send ({mergedRecipients.total})</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE GATEWAY DELIVERY REPORT MODAL */}
            {activeReportModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="sms-report-modal-title"
                    onClick={e => {
                        if (e.target === e.currentTarget) setActiveReportModal(null);
                    }}
                >
                    <div className="bg-[#0c131a] border border-emerald-500/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[88vh] flex flex-col">
                        <div className="flex items-center justify-between shrink-0">
                            <div>
                                <h3 id="sms-report-modal-title" className="text-sm font-extrabold text-white uppercase tracking-wider">
                                    Gateway Delivery Report
                                </h3>
                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                    Request ID: #{activeReportModal.log?.requestId}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveReportModal(null)}
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {activeReportModal.error ? (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                                {activeReportModal.error}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 gap-2.5 shrink-0 text-xs">
                                    <div className="p-3 rounded-2xl bg-[#080d12] border border-white/10">
                                        <div className="text-[10px] font-mono uppercase text-slate-400">Status</div>
                                        <div className="mt-1 font-bold text-emerald-300">
                                            {activeReportModal.report?.request_status || 'Submitted'}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-[#080d12] border border-white/10">
                                        <div className="text-[10px] font-mono uppercase text-slate-400">Total Charge</div>
                                        <div className="mt-1 font-bold font-mono text-white">
                                            ৳{Number(activeReportModal.report?.request_charge || 0).toFixed(4)}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-[#080d12] border border-white/10">
                                        <div className="text-[10px] font-mono uppercase text-slate-400">Recipients</div>
                                        <div className="mt-1 font-bold font-mono text-white">
                                            {(activeReportModal.report?.recipients || []).length || activeReportModal.log?.recipientCount || 1}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar rounded-2xl bg-[#080d12] border border-white/10 divide-y divide-white/[0.05]">
                                    {(activeReportModal.report?.recipients || []).length === 0 ? (
                                        <div className="p-5 text-center text-xs text-slate-400">
                                            Per-recipient delivery breakdown is not yet populated by the carrier. Check again shortly.
                                        </div>
                                    ) : (
                                        activeReportModal.report.recipients.map((r, i) => (
                                            <div key={`${r.number}-${i}`} className="px-4 py-2.5 flex items-center justify-between text-xs">
                                                <span className="font-mono text-slate-200">{r.number}</span>
                                                <div className="flex items-center gap-3">
                                                    {r.charge !== undefined && (
                                                        <span className="font-mono text-[11px] text-slate-400">
                                                            ৳{Number(r.charge || 0).toFixed(4)}
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                                        /fail|reject|undeliver/i.test(String(r.status || ''))
                                                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                    }`}>
                                                        {r.status || 'Sent'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
