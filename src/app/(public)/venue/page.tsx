'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { VenueLocationSection } from '../../../components/VenueLocationSection';
import { MapPin, Train, Calendar, Phone, Sparkles } from 'lucide-react';
import { VENUE_INFO } from '../../../data/initialData';

export default function VenuePage() {
  const router = useRouter();

  return (
    <div className="py-8 md:py-12">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Train className="w-3.5 h-3.5" />
              <span>MRT Line-6 Connected</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-tight text-white">
              Uttara Metro Center Arena
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-2xl">
              Located right beneath the iconic Uttara Center Metro Station viaduct in Sector 17. Seamless transit from anywhere in Dhaka with private parking and full player amenities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/booking')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-black hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Calendar className="w-4 h-4" />
              <span>Reserve Pitch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Venue & Metro Section */}
      <VenueLocationSection onBookSlotClick={() => router.push('/booking')} />
    </div>
  );
}
