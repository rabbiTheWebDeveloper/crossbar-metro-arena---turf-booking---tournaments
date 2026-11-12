import React from 'react';
import { useOpenTab } from '@/lib/navigation';
import { Info, MapPin, Train, ShieldCheck, Clock } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen } from '@/components/ui';
import { ABOUT_FAQ } from '@/data/faq';
import { PageIntro } from '@/features/venue/PageIntro';
import { AboutStory } from '@/features/venue/AboutStory';
import { PriceTable } from '@/features/venue/PriceTable';
import { VenueLocation } from '@/features/venue/VenueLocation';
import { FaqList } from '@/features/venue/FaqList';

/** About the arena: story, facilities, the full 12-slot rate card, location and FAQ. */
export default function AboutScreen() {
    const openTab = useOpenTab();
    const { pricing } = useArena();
    const goBooking = () => openTab('/booking');

    return (
        <Screen back title="About" subtitle="Crossbar Metro Arena · Uttara, Dhaka">
            <PageIntro
                eyebrow="Dhaka's Premier Sports Destination"
                eyebrowIcon={Info}
                title="Crossbar Metro"
                highlight="Arena & Pitches"
                description="Built for football lovers right next to Uttara Center Metro Station. 12 daily 90-minute slots, professional 400-lux stadium floodlights, and seamless online booking."
                stats={[
                    { label: 'Location', value: 'Sector 17, Uttara', icon: MapPin },
                    { label: 'Metro Station', value: 'Uttara Center MRT-6', icon: Train },
                    { label: 'Daily Slots', value: '12 Slots (90 Min)', icon: Clock },
                    { label: 'Turf Spec', value: '50mm Shock-Pad', icon: ShieldCheck }
                ]}
            />

            <AboutStory />

            <PriceTable pricing={pricing} onBook={goBooking} />

            <VenueLocation onBookSlotClick={goBooking} />

            <FaqList
                items={ABOUT_FAQ}
                eyebrow="Arena FAQ"
                title="Everything about the turf, in one place"
                intro="Location, hours, pitch size, prices and tournaments. Still have a question? Call or WhatsApp the arena desk."
                ctaLabel="Book a slot"
                onCta={goBooking}
            />
        </Screen>
    );
}
