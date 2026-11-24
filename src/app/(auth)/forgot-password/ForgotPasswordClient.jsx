'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArena } from '@/context/ArenaContext';
import { ForgotPasswordFlow } from '@/components/ForgotPasswordFlow';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordClient() {
    const router = useRouter();
    const { siteSettings } = useArena();

    return (
        <div className="w-full space-y-6">
            <div className="bg-[#0c131a]/95 border border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"/>

                <div className="text-center space-y-2 mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-mono font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                        <KeyRound className="w-3 h-3 text-emerald-400"/>
                        <span>PASSWORD RECOVERY</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                        Reset Your Password
                    </h2>
                </div>

                <ForgotPasswordFlow
                    whatsappUrl={siteSettings?.whatsappUrl}
                    deskPhone={siteSettings?.phone}
                    deskPhoneFormatted={siteSettings?.phoneFormatted}
                    onBackToLogin={() => router.push('/login')}
                />

                <div className="mt-6 pt-5 border-t border-emerald-500/15 text-center">
                    <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5"/>
                        <span>Back to Sign In</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
