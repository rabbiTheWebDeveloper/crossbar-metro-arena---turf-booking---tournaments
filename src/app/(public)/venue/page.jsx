'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VenueLocationSection } from '../../../components/VenueLocationSection';
import { PageHero } from '../../../components/PageHero';
import { Train, Calendar, Footprints, Car, Clock, MapPin } from 'lucide-react';
export default function VenuePage() {
    const router = useRouter();
    return (<>
      <PageHero crumb="Metro & Venue" eyebrow="MRT Line-6 Connected" eyebrowIcon={Train} title="Right Beside" highlight="Uttara Metro" description="Located under the Uttara Center Metro viaduct in Sector 17. Skip the Dhaka traffic — ride the Metro straight to the turf, with secure parking and full player amenities." stats={[
            { label: 'From Station', value: '2 min walk', icon: Footprints },
            { label: 'Location', value: 'Sector 17', icon: MapPin },
            { label: 'Parking', value: 'Free & Guarded', icon: Car },
            { label: 'Open', value: '6AM – 2AM', icon: Clock }
        ]} actions={<Link href="/booking" className="btn-volt inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm">
            <Calendar className="w-4 h-4"/>
            <span>Reserve A Pitch</span>
          </Link>}/>

      <VenueLocationSection onBookSlotClick={() => router.push('/booking')} hideHeading/>
    </>);
}
