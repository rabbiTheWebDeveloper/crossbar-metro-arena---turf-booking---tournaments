import { buildMetadata } from '../../../lib/seo';
import VenueClient from './VenueClient';

export const metadata = buildMetadata({ title: 'Venue & Metro Directions', description: 'How to reach Crossbar Metro Arena: two minutes from Uttara Center Metro Station, Sector 17, Dhaka, with free guarded parking.', path: '/venue' });

export default function VenuePage() {
    return <VenueClient />;
}
