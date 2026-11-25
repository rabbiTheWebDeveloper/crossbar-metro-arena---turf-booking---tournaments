'use client';
import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

/**
 * Reusable confirmation alert dialog shown whenever a delete action is clicked.
 * Displays an explicit "Are you sure you want to delete this?" prompt before executing.
 */
export function ConfirmDeleteModal({
    open,
    title = 'Are you sure you want to delete this?',
    badge = 'Delete Confirmation',
    itemName = '',
    description = 'This action is permanent and cannot be undone.',
    confirmLabel = 'Yes, Delete',
    cancelLabel = 'No, Cancel',
    loading = false,
    disabled = false,
    error = '',
    onConfirm,
    onCancel,
    children
}) {
    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !loading) {
                onCancel?.();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, loading, onCancel]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-modal-title"
            aria-describedby="confirm-delete-modal-desc"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) {
                    onCancel?.();
                }
            }}
        >
            <div className="bg-[#0c131a] border-t sm:border border-rose-500/35 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 max-w-md w-full shadow-2xl shadow-black/70 space-y-4 text-xs animate-in slide-in-from-bottom sm:zoom-in-95">
                <div className="w-10 h-1 rounded-full bg-white/15 mx-auto sm:hidden" aria-hidden="true" />
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-rose-400">
                                {badge}
                            </div>
                            <h3 id="confirm-delete-modal-title" className="text-base font-extrabold text-white mt-0.5 leading-snug">
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onCancel}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                        aria-label="Close dialog"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {itemName && (
                    <div className="p-3 rounded-2xl bg-[#080d12] border border-white/10 text-white font-bold break-words">
                        {itemName}
                    </div>
                )}

                {description && (
                    <p id="confirm-delete-modal-desc" className="text-slate-300 leading-relaxed">
                        {description}
                    </p>
                )}

                {children}

                {error && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex items-center gap-2.5 pt-1">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onCancel}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        disabled={loading || disabled}
                        onClick={onConfirm}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>{loading ? 'Deleting…' : confirmLabel}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDeleteModal;
