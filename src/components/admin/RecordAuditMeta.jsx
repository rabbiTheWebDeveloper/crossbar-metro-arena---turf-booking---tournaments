'use client';

import React, { useState } from 'react';
import { User, Pencil, Hash, Check } from 'lucide-react';
import { resolveAuditMeta } from '@/lib/audit';

function formatShortId(id) {
    const clean = String(id || '').trim();
    if (!clean) return '';
    if (clean.length <= 10) return clean;
    return `${clean.slice(0, 4)}…${clean.slice(-4)}`;
}

/**
 * Dark-themed audit trail strip for Admin Portal cards, tables, and detail drawers.
 * Surfaces `Created by`, `Updated by`, and `User ID` (with one-click copy).
 */
export default function RecordAuditMeta({
    record,
    compact = false,
    className = '',
    fallbackCreatedBy = 'System'
}) {
    const [copied, setCopied] = useState(false);
    if (!record || typeof record !== 'object') return null;

    const { createdBy, updatedBy, userId } = resolveAuditMeta(record);
    const creator = createdBy || (record.isWalkIn ? 'Admin Desk' : fallbackCreatedBy);
    const updater = updatedBy || createdBy || '—';

    const handleCopyUserId = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!userId || typeof navigator === 'undefined' || !navigator.clipboard) return;
        navigator.clipboard.writeText(userId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
    };

    if (compact) {
        return (
            <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] leading-tight text-slate-400 font-sans ${className}`}>
                <span className="inline-flex items-center gap-1" title={`Created by: ${creator}`}>
                    <User className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span className="text-slate-500">By:</span>
                    <span className="text-slate-300 font-medium truncate max-w-[135px]">{creator}</span>
                </span>
                <span className="text-white/15">·</span>
                <span className="inline-flex items-center gap-1" title={`Updated by: ${updater}`}>
                    <Pencil className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span className="text-slate-500">Upd:</span>
                    <span className="text-slate-300 font-medium truncate max-w-[135px]">{updater}</span>
                </span>
                <span className="text-white/15">·</span>
                {userId ? (
                    <button
                        type="button"
                        onClick={handleCopyUserId}
                        title={`User ID: ${userId} (click to copy)`}
                        className="inline-flex items-center gap-1 rounded bg-white/[0.05] hover:bg-white/10 border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 hover:text-lime-300 transition-colors cursor-pointer"
                    >
                        {copied ? <Check className="w-2.5 h-2.5 text-lime-400 shrink-0" /> : <Hash className="w-2.5 h-2.5 text-slate-500 shrink-0" />}
                        <span>{copied ? 'Copied' : formatShortId(userId)}</span>
                    </button>
                ) : (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-500" title="No linked User ID">
                        <Hash className="w-2.5 h-2.5 shrink-0" />
                        <span>—</span>
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={`flex flex-wrap items-center gap-1.5 text-[10.5px] leading-tight text-slate-400 font-sans ${className}`}>
            <span
                className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] border border-white/[0.08] px-2 py-0.5"
                title={`Created by: ${creator}`}
            >
                <User className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                <span className="text-slate-500">Created:</span>
                <span className="font-medium text-slate-200 truncate max-w-[155px]">{creator}</span>
            </span>
            <span
                className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] border border-white/[0.08] px-2 py-0.5"
                title={`Updated by: ${updater}`}
            >
                <Pencil className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                <span className="text-slate-500">Updated:</span>
                <span className="font-medium text-slate-200 truncate max-w-[155px]">{updater}</span>
            </span>
            {userId ? (
                <button
                    type="button"
                    onClick={handleCopyUserId}
                    title={`User ID: ${userId} (click to copy)`}
                    className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] hover:bg-white/10 border border-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:text-lime-300 transition-colors cursor-pointer"
                >
                    {copied ? <Check className="w-2.5 h-2.5 text-lime-400 shrink-0" /> : <Hash className="w-2.5 h-2.5 text-slate-500 shrink-0" />}
                    <span className="text-slate-500 font-sans">UID:</span>
                    <span>{copied ? 'Copied!' : formatShortId(userId)}</span>
                </button>
            ) : (
                <span
                    className="inline-flex items-center gap-1 rounded-md bg-white/[0.02] border border-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-slate-500"
                    title="No linked User ID"
                >
                    <Hash className="w-2.5 h-2.5 shrink-0" />
                    <span className="font-sans">UID:</span>
                    <span>—</span>
                </span>
            )}
        </div>
    );
}
