'use client';

import React from 'react';
import { useArena } from '../../../context/ArenaContext';
import { PageHero } from '../../../components/PageHero';
import { TournamentSection } from '../../../components/TournamentSection';
import { Trophy, Calendar, Award, Shield, Sparkles, CheckCircle2 } from 'lucide-react';

export default function EventsPage() {
  const { tournaments, handleRegistrationSuccess } = useArena();

  const totalPrizePool = tournaments.reduce((sum, t) => sum + t.prizePool, 0);

  return (
    <>
      <PageHero
        crumb="Arena Events"
        eyebrow="Competitive Football & Corporate Cups"
        eyebrowIcon={Trophy}
        title="Tournaments &"
        highlight="Events"
        description="Compete in high-stakes 7v7 and 5v5 weekend blitz tournaments under 400-lux stadium floodlights. Register your squad online today."
        stats={[
          { label: 'Active Cups', value: `${tournaments.length} Tournaments`, icon: Trophy },
          { label: 'Total Prize Pool', value: `৳${(totalPrizePool / 1000).toFixed(0)}K+`, icon: Award },
          { label: 'Officiating', value: 'BFF Certified', icon: Shield },
          { label: 'Format', value: '7-a-side & 5-a-side', icon: Calendar }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TournamentSection
          tournaments={tournaments}
          onRegistrationSuccess={handleRegistrationSuccess}
          hideHeading
        />
      </div>
    </>
  );
}
