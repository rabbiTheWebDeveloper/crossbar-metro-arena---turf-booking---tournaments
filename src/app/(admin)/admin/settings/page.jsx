'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useArena } from '@/context/ArenaContext';
import { EmailVerificationBox } from '@/components/EmailVerificationBox';
import { EpsSettingsCard } from '@/components/admin/EpsSettingsCard';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import { Building2, Phone, MapPin, Share2, Save, RotateCcw, Download, Lock, User, ExternalLink, Tag, CheckCircle2, AlertCircle, Database } from 'lucide-react';

const CARD = 'p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4';
const INPUT = 'w-full bg-[#080d12] border rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-lime-400/60';
const INPUT_DISABLED = 'w-full bg-[#080d12]/50 border border-white/5 rounded-xl px-3 py-2 text-slate-500 text-xs';
const LABEL = 'block text-slate-300 font-semibold mb-1';
const HINT = 'text-[11px] text-slate-500 mt-1';
const BTN_PRIMARY = 'px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors';
const BTN_SECONDARY = 'px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

/**
 * Public venue details, stored in the single Setting document (PUT /api/settings).
 * `max` mirrors SETTINGS_SCHEMA in lib/schemas.js; booking rules and prices live on the Slot pricing page.
 */
const SECTIONS = [
    {
        id: 'venue', title: 'Venue profile', icon: Building2, hint: 'The name and description shown across the website.',
        fields: [
            { key: 'businessName', label: 'Business name', max: 100, required: true },
            { key: 'tagline', label: 'Tagline', max: 160 },
            { key: 'openingHours', label: 'Opening hours', max: 120, placeholder: 'e.g. 6:30 AM – 12:30 AM Every Day', wide: true },
            { key: 'aboutText', label: 'About the arena', max: 2000, multiline: true, rows: 4, wide: true }
        ]
    },
    {
        id: 'contact', title: 'Contact', icon: Phone, hint: 'How customers reach the arena desk.',
        fields: [
            { key: 'phone', label: 'Desk phone', max: 30, required: true, kind: 'phone', inputType: 'tel', mono: true, help: 'Dialled by the call buttons on the site.' },
            { key: 'phoneFormatted', label: 'Phone as displayed', max: 40, mono: true, placeholder: '+880 17XX-XXXXXX', help: 'How the number is written on the site.' },
            { key: 'email', label: 'Email', max: 120, required: true, kind: 'email', inputType: 'email' },
            { key: 'website', label: 'Website', max: 120, placeholder: 'bookcrossbar.com', help: 'Shown as text in the footer.' },
            { key: 'whatsappUrl', label: 'WhatsApp link', kind: 'url', inputType: 'url', mono: true, wide: true, placeholder: 'https://wa.me/8801XXXXXXXXX' }
        ]
    },
    {
        id: 'location', title: 'Location', icon: MapPin, hint: 'Address and directions on the venue page.',
        fields: [
            { key: 'address', label: 'Address', max: 240, wide: true },
            { key: 'metroStation', label: 'Nearest metro station', max: 100 },
            { key: 'googleMapsUrl', label: 'Google Maps link', kind: 'url', inputType: 'url', mono: true, placeholder: 'https://maps.google.com/…' },
            { key: 'metroDetails', label: 'Directions from the metro', max: 300, multiline: true, rows: 2, wide: true }
        ]
    },
    {
        id: 'social', title: 'Social media', icon: Share2, hint: 'Linked from the footer. Leave blank to hide a link.',
        fields: [
            { key: 'facebookUrl', label: 'Facebook page', kind: 'url', inputType: 'url', mono: true, placeholder: 'https://www.facebook.com/…' },
            { key: 'instagramUrl', label: 'Instagram profile', kind: 'url', inputType: 'url', mono: true, placeholder: 'https://www.instagram.com/…' }
        ]
    }
];
const ALL_FIELDS = SECTIONS.flatMap(s => s.fields);

const clean = (field, value) => {
    const s = String(value ?? '');
    return field.multiline ? s.trim() : s.trim().replace(/\s+/g, ' ');
};

function fieldError(field, rawValue) {
    const v = clean(field, rawValue);
    if (!v) return field.required ? `${field.label} is required.` : '';
    if (field.max && v.length > field.max) return `${field.label} must be at most ${field.max} characters.`;
    if (field.kind === 'email' && !EMAIL_RE.test(v)) return 'Enter a valid email address.';
    if (field.kind === 'url' && !URL_RE.test(v)) return 'Enter a full link starting with https://';
    if (field.kind === 'phone') {
        const digits = v.replace(/[^0-9]/g, '');
        if (digits.length < 7 || digits.length > 15 || /[^0-9+\-() ]/.test(v)) return 'Enter a valid phone number.';
    }
    return '';
}

function Message({ msg }) {
    if (!msg) return null;
    const isError = msg.type === 'error';
    const Icon = isError ? AlertCircle : CheckCircle2;
    return (
        <div role={isError ? 'alert' : 'status'} className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs ${isError ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-lime-400/10 border-lime-400/30 text-lime-300'}`}>
            <Icon className="w-4 h-4 shrink-0 mt-px"/>
            <span>{msg.text}</span>
        </div>
    );
}

function CardTitle({ icon: Icon, children, hint }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Icon className="w-4 h-4 text-lime-400"/>
                <span>{children}</span>
            </h3>
            {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
        </div>
    );
}

export default function AdminSettingsPage() {
    const { siteSettings, isLoadingData, currentUser, handleSaveSiteSettings, handleUpdateProfile, handleChangePassword, exportDatabaseBackup, isAdmin, can } = useArena();
    // Everyone in the portal can manage their own login here; the venue form needs the settings permission
    const canEditVenue = can('settings');

    // ---- Venue settings: `draft` holds only the fields being edited, on top of what the server has ----
    const [draft, setDraft] = useState({});
    const [touched, setTouched] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null);

    const valueOf = (field) => (draft[field.key] !== undefined ? draft[field.key] : String(siteSettings?.[field.key] ?? ''));
    const changedFields = useMemo(
        () => ALL_FIELDS.filter(f => draft[f.key] !== undefined && clean(f, draft[f.key]) !== clean(f, siteSettings?.[f.key])),
        [draft, siteSettings]
    );
    const dirty = changedFields.length > 0;
    const errors = useMemo(() => {
        const out = {};
        for (const f of ALL_FIELDS) { const err = fieldError(f, valueOf(f)); if (err) out[f.key] = err; }
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft, siteSettings]);

    // Warn before leaving the page with unsaved venue changes
    useEffect(() => {
        if (!dirty) return undefined;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const setValue = (key, value) => { setDraft(d => ({ ...d, [key]: value })); setSaveMsg(null); };
    const discard = () => { setDraft({}); setTouched({}); setSaveMsg(null); };

    const deskPhone = cleanPhone(valueOf(ALL_FIELDS.find(f => f.key === 'phone')));
    const canBuildWhatsapp = isValidBdPhone(deskPhone);
    const buildWhatsapp = () => {
        const name = clean({}, valueOf(ALL_FIELDS.find(f => f.key === 'businessName'))) || 'there';
        setValue('whatsappUrl', `https://wa.me/88${deskPhone}?text=${encodeURIComponent(`Hi ${name}, I want to book a slot!`)}`);
    };

    const saveVenue = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaveMsg(null);
        // Only the fields being changed can block a save; untouched stored values are left alone
        const firstBad = changedFields.find(f => errors[f.key]);
        if (firstBad) {
            setTouched(t => ({ ...t, ...Object.fromEntries(changedFields.map(f => [f.key, true])) }));
            setSaveMsg({ type: 'error', text: `Please fix: ${errors[firstBad.key]}` });
            document.getElementById(`setting-${firstBad.key}`)?.focus();
            return;
        }
        if (!dirty) return;
        const patch = Object.fromEntries(changedFields.map(f => [f.key, clean(f, draft[f.key])]));
        setSaving(true);
        const r = await handleSaveSiteSettings(patch);
        setSaving(false);
        if (r?.ok) { setDraft({}); setTouched({}); setSaveMsg({ type: 'success', text: 'Settings saved. The website now shows the new details.' }); }
        else setSaveMsg({ type: 'error', text: r?.error || 'Could not save the settings.' });
    };

    // ---- Admin login account ----
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [accountMsg, setAccountMsg] = useState(null);
    const [accountSaving, setAccountSaving] = useState(false);
    useEffect(() => {
        setName(currentUser?.name || '');
        setEmail(currentUser?.email || '');
    }, [currentUser?.id, currentUser?.name, currentUser?.email]);

    const saveAccount = async (e) => {
        e.preventDefault();
        if (accountSaving) return;
        setAccountMsg(null);
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        if (cleanName.length < 2) { setAccountMsg({ type: 'error', text: 'Please enter your full name.' }); return; }
        if (cleanEmail && !EMAIL_RE.test(cleanEmail)) { setAccountMsg({ type: 'error', text: 'Enter a valid email address.' }); return; }
        setAccountSaving(true);
        const r = await handleUpdateProfile({ name: cleanName, email: cleanEmail });
        setAccountSaving(false);
        setAccountMsg(r?.ok ? { type: 'success', text: 'Account details updated.' } : { type: 'error', text: r?.error || 'Could not update your account.' });
    };

    const [pwCurrent, setPwCurrent] = useState('');
    const [pwNew, setPwNew] = useState('');
    const [pwConfirm, setPwConfirm] = useState('');
    const [pwMsg, setPwMsg] = useState(null);
    const [pwSaving, setPwSaving] = useState(false);

    const savePassword = async (e) => {
        e.preventDefault();
        if (pwSaving) return;
        setPwMsg(null);
        if (!pwCurrent) { setPwMsg({ type: 'error', text: 'Enter your current password.' }); return; }
        if (pwNew.length < 6) { setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return; }
        if (pwNew !== pwConfirm) { setPwMsg({ type: 'error', text: 'New password and confirmation do not match.' }); return; }
        setPwSaving(true);
        const r = await handleChangePassword(pwCurrent, pwNew);
        setPwSaving(false);
        if (!r?.ok) { setPwMsg({ type: 'error', text: r?.error || 'Could not change the password.' }); return; }
        setPwMsg({ type: 'success', text: 'Password changed.' });
        setPwCurrent(''); setPwNew(''); setPwConfirm('');
    };

    const lastSaved = siteSettings?.updatedAt
        ? new Date(siteSettings.updatedAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : '';

    const renderField = (field) => {
        const id = `setting-${field.key}`;
        const value = valueOf(field);
        const error = touched[field.key] ? errors[field.key] : '';
        const common = {
            id,
            value,
            onChange: (e) => setValue(field.key, e.target.value),
            onBlur: () => setTouched(t => ({ ...t, [field.key]: true })),
            placeholder: field.placeholder,
            maxLength: field.max,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? `${id}-error` : (field.help ? `${id}-help` : undefined),
            className: `${INPUT} ${field.mono ? 'font-mono' : ''} ${error ? 'border-rose-500/60' : 'border-white/10'}`
        };
        const isLink = field.kind === 'url' && URL_RE.test(value.trim());
        return (
            <div key={field.key} className={field.wide ? 'sm:col-span-2' : ''}>
                <div className="flex items-center justify-between gap-2">
                    <label htmlFor={id} className={LABEL}>{field.label}{field.required && <span className="text-lime-400"> *</span>}</label>
                    <div className="flex items-center gap-3 mb-1 text-[11px]">
                        {field.key === 'whatsappUrl' && canBuildWhatsapp && (
                            <button type="button" onClick={buildWhatsapp} className="text-lime-400 hover:text-lime-300 font-semibold cursor-pointer">Build from desk phone</button>
                        )}
                        {isLink && (
                            <a href={value.trim()} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white flex items-center gap-1">
                                <span>Open</span><ExternalLink className="w-3 h-3"/>
                            </a>
                        )}
                        {field.multiline && <span className="text-slate-500 font-mono">{value.length}/{field.max}</span>}
                    </div>
                </div>
                {field.multiline
                    ? <textarea rows={field.rows || 3} {...common} className={`${common.className} resize-y leading-relaxed`}/>
                    : <input type={field.inputType || 'text'} {...common}/>}
                {error
                    ? <p id={`${id}-error`} className="text-[11px] text-rose-300 mt-1">{error}</p>
                    : field.help && <p id={`${id}-help`} className={HINT}>{field.help}</p>}
            </div>
        );
    };

    return (<div className="space-y-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white font-display">Arena Settings</h2>
          <p className="text-xs text-slate-400">{canEditVenue ? 'Venue details shown on the website, your login, and data backup.' : 'Your login details and password.'}</p>
        </div>
        {canEditVenue && lastSaved && <span className="text-[11px] font-mono text-slate-500">Venue details last saved {lastSaved}</span>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* VENUE SETTINGS */}
        {!canEditVenue ? null : isLoadingData ? (<div className="xl:col-span-2 space-y-4 animate-pulse" aria-busy="true">
            <div className="h-64 rounded-3xl bg-[#0c131a] border border-white/5"/>
            <div className="h-56 rounded-3xl bg-[#0c131a] border border-white/5"/>
            <div className="h-48 rounded-3xl bg-[#0c131a] border border-white/5"/>
          </div>) : (
        <div className="xl:col-span-2 space-y-6">
        <EpsSettingsCard />
        <form onSubmit={saveVenue} noValidate className="space-y-6">
          {SECTIONS.map(section => (
            <section key={section.id} className={CARD}>
              <CardTitle icon={section.icon} hint={section.hint}>{section.title}</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3.5 text-xs">
                {section.fields.map(renderField)}
              </div>
            </section>
          ))}

          {/* Save bar: stays in view while there are unsaved changes */}
          <div className={`sticky bottom-3 z-20 p-3 rounded-2xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${dirty ? 'bg-[#0c131a]/95 border-amber-400/30 shadow-2xl' : 'bg-[#0c131a]/80 border-white/5'}`}>
            <div className="text-xs min-w-0">
              {saveMsg
                  ? <Message msg={saveMsg}/>
                  : dirty
                      ? <span className="text-amber-300 font-mono">{changedFields.length} unsaved {changedFields.length === 1 ? 'change' : 'changes'}: {changedFields.map(f => f.label).join(', ')}</span>
                      : <span className="text-slate-500">No unsaved changes.</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={discard} disabled={!dirty || saving} className={BTN_SECONDARY}>
                <RotateCcw className="w-3.5 h-3.5"/><span>Discard</span>
              </button>
              <button type="submit" disabled={!dirty || saving} className={BTN_PRIMARY}>
                <Save className="w-4 h-4"/><span>{saving ? 'Saving…' : 'Save settings'}</span>
              </button>
            </div>
          </div>
        </form>
        </div>)}

        {/* RIGHT COLUMN */}
        <div className={canEditVenue ? 'space-y-6' : 'space-y-6 xl:col-span-3 max-w-xl'}>

          <section className={CARD}>
            <CardTitle icon={User}>Your account</CardTitle>
            <Message msg={accountMsg}/>
            <form onSubmit={saveAccount} noValidate className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="admin-name" className={LABEL}>Full name</label>
                <input id="admin-name" type="text" maxLength={60} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={`${INPUT} border-white/10`}/>
              </div>
              <div>
                <label htmlFor="admin-email" className={LABEL}>Email address</label>
                <input id="admin-email" type="email" maxLength={120} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={`${INPUT} border-white/10`}/>
                <EmailVerificationBox email={email} accent="lime"/>
              </div>
              <div>
                <label htmlFor="admin-phone" className={LABEL}>Login mobile</label>
                <input id="admin-phone" type="text" disabled value={currentUser?.phone || ''} className={`${INPUT_DISABLED} font-mono`}/>
                <p className={HINT}>Your mobile number is your login and cannot be changed here.</p>
              </div>
              <button type="submit" disabled={accountSaving} className={`${BTN_PRIMARY} w-full`}>
                {accountSaving ? 'Saving…' : 'Save account'}
              </button>
            </form>
          </section>

          <section className={CARD}>
            <CardTitle icon={Lock}>Change password</CardTitle>
            <Message msg={pwMsg}/>
            <form onSubmit={savePassword} noValidate className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="admin-pw-current" className={LABEL}>Current password</label>
                <input id="admin-pw-current" type="password" autoComplete="current-password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} className={`${INPUT} border-white/10`}/>
              </div>
              <div>
                <label htmlFor="admin-pw-new" className={LABEL}>New password</label>
                <input id="admin-pw-new" type="password" autoComplete="new-password" value={pwNew} onChange={e => setPwNew(e.target.value)} className={`${INPUT} border-white/10`}/>
                <p className={HINT}>At least 6 characters.</p>
              </div>
              <div>
                <label htmlFor="admin-pw-confirm" className={LABEL}>Confirm new password</label>
                <input id="admin-pw-confirm" type="password" autoComplete="new-password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} className={`${INPUT} border-white/10`}/>
              </div>
              <button type="submit" disabled={pwSaving} className={`${BTN_SECONDARY} w-full`}>
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>

          {can('pricing') && <section className={CARD}>
            <CardTitle icon={Tag} hint="Slot prices, advance deposit, hold time, booking window, cancellation cutoff and weekend days.">Pricing &amp; booking rules</CardTitle>
            <Link href="/admin/slot-pricing" className={`${BTN_SECONDARY} w-full`}>
              <span>Open slot pricing</span>
            </Link>
          </section>}

          {isAdmin && <section className={CARD}>
            <CardTitle icon={Database} hint="Downloads everything loaded in this console as one JSON file. Backups are read-only; they cannot be restored from here.">Data backup</CardTitle>
            <button type="button" onClick={exportDatabaseBackup} className={`${BTN_SECONDARY} w-full`}>
              <Download className="w-3.5 h-3.5"/><span>Download backup</span>
            </button>
          </section>}

        </div>
      </div>
    </div>);
}
