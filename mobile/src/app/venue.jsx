import React from 'react';
import { useOpenTab } from '@/lib/navigation';
import { Train, Calendar, Footprints, Car, Clock, MapPin } from 'lucide-react-native';
import { Screen, Button } from '@/components/ui';
import { PageIntro } from '@/features/venue/PageIntro';
import { VenueLocation } from '@/features/venue/VenueLocation';
import { useVenueContacts } from '@/features/venue/useVenueContacts';

/** Metro & Venue: how to reach the arena, amenities, contacts and the WhatsApp enquiry form. */
export default function VenueScreen() {
    const openTab = useOpenTab();
    const { venue } = useVenueContacts();
    const goBooking = () => openTab('/booking');
    const openLabel = String(venue.openingHours || '6 AM – 12 AM').replace(/\s*\(Midnight\)/i, '').replace(/ Every Day/i, '');

    return (
        <Screen back title="Metro & Venue" subtitle="MRT Line-6 · Sector 17, Uttara">
            <PageIntro
                eyebrow="MRT Line-6 Connected"
                eyebrowIcon={Train}
                title="Right Beside"
                highlight="Uttara Metro"
                description="Located under the Uttara Center Metro viaduct in Sector 17. Skip the Dhaka traffic — ride the Metro straight to the turf, with secure parking and full player amenities."
                stats={[
                    { label: 'From Station', value: '2 min walk', icon: Footprints },
                    { label: 'Location', value: 'Sector 17', icon: MapPin },
                    { label: 'Parking', value: 'Free & Guarded', icon: Car },
                    { label: 'Open', value: openLabel, icon: Clock }
                ]}
            >
                <Button title="Reserve A Pitch" icon={Calendar} onPress={goBooking} />
            </PageIntro>

            <VenueLocation onBookSlotClick={goBooking} hideHeading />
        </Screen>
    );
}
