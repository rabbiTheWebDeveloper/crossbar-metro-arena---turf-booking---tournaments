'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, RefreshCw, Send } from 'lucide-react';

const INPUT = 'w-full bg-[#080d12] border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-lime-400/60';
const LABEL = 'block text-slate-300 font-semibold mb-1';

export function SmsSettingsCard() {
    const [form, setForm] = useState({ smsApiKey: '', smsSenderId: '' });
    const [configured, setConfigured] = useState(false);
    const [balance, setBalance] = useState(null);
    const [balanceError, setBalanceError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [msg, setMsg] = useState(null);

    // Quick test SMS
    const [testPhone, setTestPhone] = useState('');
    const [testText, setTestText] = useState('Crossbar Metro Arena: Test SMS from Admin Settings.');
    const [sendingTest, setSendingTest] = useState(false);

    const loadStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sms', { credentials: 'include' });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.sms) {
                setForm({
                    smsApiKey: data.sms.smsApiKey || '',
                    smsSenderId: data.sms.smsSenderId || ''
                });
                setConfigured(Boolean(data.sms.configured));
                setBalance(data.sms.balance);
                setBalanceError(data.sms.balanceError || '');
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadStatus(); }, [loadStatus]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch('/api/sms', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMsg({ type: 'error', text: data.error || 'Could not save SMS settings.' });
            } else {
                if (data.sms) {
                    setConfigured(Boolean(data.sms.configured));
                    setBalance(data.sms.balance);
                    setBalanceError(data.sms.balanceError || '');
                }
                setMsg({ type: 'success', text: data.message || 'SMS settings saved.' });
            }
        } catch {
            setMsg({ type: 'error', text: 'Network error while saving SMS settings.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSendTest = async (e) => {
        e.preventDefault();
        if (sendingTest) return;
        if (!testPhone.trim()) {
            setMsg({ type: 'error', text: 'Enter a Bangladeshi mobile number to send a test SMS.' });
            return;
        }
        setSendingTest(true);
        setMsg(null);
        try {
            const res = await fetch('/api/sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ to: testPhone.trim(), msg: testText.trim(), category: 'test' })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMsg({ type: 'error', text: data.error || 'Could not send test SMS.' });
            } else {
                setMsg({ type: 'success', text: data.message || 'Test SMS sent!' });
                loadStatus();
            }
        } catch {
            setMsg({ type: 'error', text: 'Network error while sending test SMS.' });
        } finally {
            setSendingTest(false);
        }
    };

    return (
        <section className="p-5 rounded-3xl bg-[#0c131a] border border-white/5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-lime-400"/>
                        <span>SMS Gateway (sms.net.bd)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                        Sends instant SMS on booking confirmation, payment success, and a scheduled reminder 15 minutes before kickoff.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {configured && balance !== null && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Balance: ৳{Number(balance).toFixed(2)}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={loadStatus}
                        disabled={loading}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
                        title="Refresh SMS balance"
                        aria-label="Refresh SMS balance"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
                    </button>
                </div>
            </div>

            {balanceError && !msg && (
                <div role="alert" className="flex items-start gap-2 px-3 py-2 rounded-xl border text-xs bg-amber-500/10 border-amber-500/30 text-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-px"/>
                    <span>{balanceError}</span>
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

            <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="sms-api-key" className="text-slate-300 font-semibold">API Key</label>
                            <button
                                type="button"
                                onClick={() => setShowKey(v => !v)}
                                className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                            >
                                {showKey ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                <span>{showKey ? 'Hide' : 'Show'}</span>
                            </button>
                        </div>
                        <input
                            id="sms-api-key"
                            type={showKey ? 'text' : 'password'}
                            autoComplete="off"
                            value={form.smsApiKey}
                            onChange={e => setForm(f => ({ ...f, smsApiKey: e.target.value }))}
                            placeholder="sms.net.bd API key"
                            className={`${INPUT} font-mono`}
                        />
                    </div>
                    <div>
                        <label htmlFor="sms-sender-id" className={LABEL}>Approved Sender ID <span className="text-slate-500 font-normal">(optional)</span></label>
                        <input
                            id="sms-sender-id"
                            type="text"
                            autoComplete="off"
                            value={form.smsSenderId}
                            onChange={e => setForm(f => ({ ...f, smsSenderId: e.target.value }))}
                            placeholder="Leave blank for default"
                            className={INPUT}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}
                        <span>{saving ? 'Saving…' : 'Save SMS Settings'}</span>
                    </button>
                </div>
            </form>

            {/* Quick Test SMS */}
            <form onSubmit={handleSendTest} className="pt-3 border-t border-white/10 space-y-2.5 text-xs">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Send Test SMS</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={testPhone}
                        onChange={e => setTestPhone(e.target.value)}
                        className={`${INPUT} font-mono`}
                    />
                    <input
                        type="text"
                        placeholder="Test message"
                        value={testText}
                        onChange={e => setTestText(e.target.value)}
                        className={`${INPUT} sm:col-span-2`}
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={sendingTest || !configured}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5 text-lime-400"/>}
                        <span>{sendingTest ? 'Sending…' : 'Send Test SMS'}</span>
                    </button>
                </div>
            </form>
        </section>
    );
}

export default SmsSettingsCard;
