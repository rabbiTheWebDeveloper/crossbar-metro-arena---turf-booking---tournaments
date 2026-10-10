'use client';
import React from 'react';
import { useArena } from '../../../context/ArenaContext';
import { TournamentSection } from '../../../components/TournamentSection';
import { PageHero } from '../../../components/PageHero';
import { Trophy, Award, Flame, Users, ShieldCheck, Sparkles, Radio, Camera } from 'lucide-react';
const PERKS = [
    { icon: Radio, tone: 'amber', title: 'Livestreamed', text: 'Multi-camera knockout coverage with pro commentary on Facebook.' },
    { icon: ShieldCheck, tone: 'emerald', title: 'BFF Referees', text: 'Neutral certified officials and on-pitch medical first-aid.' },
    { icon: Award, tone: 'sky', title: 'Golden Boot & Glove', text: 'Engraved trophies and cash rewards for standout players.' },
    { icon: Camera, tone: 'purple', title: 'Squad Media', text: 'Pitchside photographer captures every goal and celebration.' }
];
const TONES = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/25'
};
export default function TournamentsPage() {
    const { tournaments, handleRegistrationSuccess } = useArena();
    const totalPool = tournaments.reduce((s, t) => s + t.prizePool, 0);
    const totalTeams = tournaments.reduce((s, t) => s + t.registeredCount, 0);
    return (<>
      <PageHero accent="amber" crumb="Tournaments" eyebrow="Championship Arena" eyebrowIcon={Trophy} title="Tournaments &" highlight="Cups" description="Compete with Dhaka's top amateur and semi-pro squads. Cash prizes, trophies, medals, live commentary and certified referees." stats={[
            { label: 'Total Prize Pool', value: `৳${totalPool.toLocaleString()}`, icon: Award },
            { label: 'Teams Entered', value: `${totalTeams}`, icon: Users },
            { label: 'Live Events', value: `${tournaments.length}`, icon: Flame },
            { label: 'Streamed', value: 'Facebook Live', icon: Sparkles }
        ]}/>

      {/* Perks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERKS.map((p) => {
            const Icon = p.icon;
            return (<div key={p.title} className="glass glass-hover rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${TONES[p.tone]}`}>
                  <Icon className="w-5 h-5"/>
                </div>
                <div className="text-sm font-bold text-white font-display">{p.title}</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{p.text}</p>
              </div>);
        })}
        </div>
      </section>

      <TournamentSection tournaments={tournaments} onRegistrationSuccess={handleRegistrationSuccess} hideHeading/>
    </>);
}
