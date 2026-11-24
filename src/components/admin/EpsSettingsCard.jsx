'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowUpRight } from 'lucide-react';

const INPUT = 'w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-lime-400/60';
const LABEL = 'block text-slate-300 font-semibold mb-1';

export function EpsSettingsCard() {
    const [form, setForm] = useState({
        epsUsername: '',
        epsPassword: '',
        epsHashKey: '',
        epsMerchantId: '',
        epsStoreId: '',
        epsSandbox: true
    });
    const [configured, setConfigured] = useState(false);
    const [configError, setConfigError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/settings/payment', { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (res.ok && data.eps) {
                    setForm({
                        epsUsername: data.eps.epsUsername || '',
                        epsPassword: data.eps.epsPassword || '',
                        epsHashKey: data.eps.epsHashKey || '',
                        epsMerchantId: data.eps.epsMerchantId || '',
                        epsStoreId: data.eps.epsStoreId || '',
                        epsSandbox: Boolean(data.eps.epsSandbox)
                    });
                    setConfigured(Boolean(data.eps.configured));
                    setConfigError(data.eps.configError || '');
                }
            } catch {
                // ignore load error
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const setField = (key) => (e) => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        setMsg(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch('/api/settings/payment', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMsg({ type: 'error', text: data.error || 'Could not save EPS settings.' });
            } else {
                if (data.eps) {
                    setConfigured(Boolean(data.eps.configured));
                    setConfigError(data.eps.configError || '');
                }
                setMsg({ type: 'success', text: data.message || 'EPS settings saved.' });
            }
        } catch {
            setMsg({ type: 'error', text: 'Network error while saving EPS settings.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (testing || saving) return;
        setTesting(true);
        setMsg(null);
        try {
            const res = await fetch('/api/settings/payment', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMsg({ type: 'error', text: data.error || 'EPS connection test failed.' });
            } else {
                setMsg({ type: 'success', text: data.message || 'EPS connection succeeded!' });
            }
        } catch {
            setMsg({ type: 'error', text: 'Network error while testing EPS connection.' });
        } finally {
            setTesting(false);
        }
    };

    return (
        <section className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-lime-400"/>
                        <span>EPS Payment Gateway</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                        Easy Payment System (eps.com.bd) credentials for online turf booking payments.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                        configured
                            ? (form.epsSandbox
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
                            : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                        {configured ? (form.epsSandbox ? 'Sandbox' : 'Live') : 'Not configured'}
                    </span>
                    <Link href="/admin/payments" className="text-[11px] text-lime-400 hover:underline inline-flex items-center gap-0.5 font-semibold">
                        <span>Payment List</span>
                        <ArrowUpRight className="w-3 h-3"/>
                    </Link>
                </div>
            </div>

            {configError && !msg && (
                <div role="alert" className="flex items-start gap-2 px-3 py-2 rounded-xl border text-xs bg-amber-500/10 border-amber-500/30 text-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-px"/>
                    <span>{configError}</span>
                </div>
            )}

            {msg && (
                <div role={msg.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs ${
                    msg.type === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-lime-400/10 border-lime-400/30 text-lime-300'
                }`}>
                    {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-px"/> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-px"/>}
                    <span>{msg.text}</span>
                </div>
            )}

            {loading ? (
                <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin"/> Loading EPS configuration…
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label htmlFor="eps-username" className={LABEL}>EPS User Name</label>
                            <input
                                id="eps-username"
                                type="text"
                                autoComplete="off"
                                value={form.epsUsername}
                                onChange={setField('epsUsername')}
                                placeholder="merchant@example.com"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="eps-password" className="text-slate-300 font-semibold">EPS Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowSecrets(v => !v)}
                                    className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                                >
                                    {showSecrets ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                    <span>{showSecrets ? 'Hide' : 'Show'}</span>
                                </button>
                            </div>
                            <input
                                id="eps-password"
                                type={showSecrets ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={form.epsPassword}
                                onChange={setField('epsPassword')}
                                placeholder="EPS merchant password"
                                className={INPUT}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="eps-hashkey" className={LABEL}>EPS Hash Key</label>
                            <input
                                id="eps-hashkey"
                                type={showSecrets ? 'text' : 'password'}
                                autoComplete="off"
                                value={form.epsHashKey}
                                onChange={setField('epsHashKey')}
                                placeholder="Base64 hash key provided by EPS"
                                className={`${INPUT} font-mono`}
                            />
                        </div>
                        <div>
                            <label htmlFor="eps-merchant-id" className={LABEL}>EPS Merchant ID</label>
                            <input
                                id="eps-merchant-id"
                                type="text"
                                autoComplete="off"
                                value={form.epsMerchantId}
                                onChange={setField('epsMerchantId')}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                className={`${INPUT} font-mono`}
                            />
                        </div>
                        <div>
                            <label htmlFor="eps-store-id" className={LABEL}>EPS Store ID</label>
                            <input
                                id="eps-store-id"
                                type="text"
                                autoComplete="off"
                                value={form.epsStoreId}
                                onChange={setField('epsStoreId')}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                className={`${INPUT} font-mono`}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <label htmlFor="eps-sandbox-toggle" className="flex items-center gap-3 cursor-pointer select-none">
                            <button
                                id="eps-sandbox-toggle"
                                type="button"
                                role="switch"
                                aria-checked={form.epsSandbox}
                                onClick={() => { setForm(f => ({ ...f, epsSandbox: !f.epsSandbox })); setMsg(null); }}
                                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                                    form.epsSandbox ? 'bg-amber-400' : 'bg-emerald-500'
                                }`}
                            >
                                <span className={`block w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                                    form.epsSandbox ? 'translate-x-6' : 'translate-x-1'
                                }`}/>
                            </button>
                            <div>
                                <div className="font-bold text-white">EPS Sandbox Mode</div>
                                <div className="text-[11px] text-slate-500">
                                    {form.epsSandbox ? 'ON — using EPS sandbox test gateway' : 'OFF — using EPS live production gateway'}
                                </div>
                            </div>
                        </label>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testing || saving}
                                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
                            >
                                {testing && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                                <span>{testing ? 'Testing…' : 'Test Connection'}</span>
                            </button>
                            <button
                                type="submit"
                                disabled={saving || testing}
                                className="px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}
                                <span>{saving ? 'Saving…' : 'Save EPS Settings'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </section>
    );
}

export default EpsSettingsCard;
