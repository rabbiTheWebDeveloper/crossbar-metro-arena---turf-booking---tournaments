'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArena } from '../../../context/ArenaContext';
import { MatchTrackerSection } from '../../../components/MatchTrackerSection';
import { PageHero } from '../../../components/PageHero';
import { Flame, Calendar, Users, Swords, Ticket } from 'lucide-react';
export default function MatchesPage() {
    const router = useRouter();
    const { bookings, challenges, handleAddChallenge, siteSettings } = useArena();
    const todayIso = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    const upcomingFixtures = bookings.filter(b => b.date >= todayIso && ['paid_advance', 'paid_full', 'confirmed_unpaid'].includes(b.paymentStatus)).length;
    return (<>
      <PageHero crumb="Live Fixtures" eyebrow="Matchday Hub" eyebrowIcon={Flame} title="Fixtures &" highlight="Squad Challenges" description="Track upcoming kickoffs on the arena turf, find opponents for a scrimmage, or recruit guest players to complete your squad." stats={[
            { label: 'Confirmed Fixtures', value: `${upcomingFixtures}`, icon: Ticket },
            { label: 'Open Challenges', value: `${challenges.length}`, icon: Swords },
            { label: 'Turf', value: '1 Floodlit Pitch', icon: Users },
            { label: 'Kickoff Window', value: (siteSettings.openingHours || '6 AM – 12 AM').replace(/s*(Midnight)/i, '').replace(/ Every Day/i, ''), icon: Calendar }
        ]} actions={<>
            <Link href="/booking" className="btn-volt inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm">
              <Calendar className="w-4 h-4"/>
              <span>Schedule A Fixture</span>
            </Link>
            <Link href="/squad-builder" className="btn-ghost inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold">
              <Users className="w-4 h-4 text-emerald-400"/>
              <span>Build Your Squad</span>
            </Link>
          </>}/>

      <MatchTrackerSection bookings={bookings} challenges={challenges} onAddChallenge={handleAddChallenge} onBookSlotClick={() => router.push('/booking')} hideHeading/>
    </>);
}
