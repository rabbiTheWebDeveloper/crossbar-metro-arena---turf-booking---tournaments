import { buildMetadata, webPageSchema } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import VenueClient from './VenueClient';

const title = 'Location & Metro Directions';
const description = 'How to reach Crossbar Metro Arena: Uttara Metro Center, Sector 17, Dhaka 1230, a two-minute walk from Uttara Center Metro Station on MRT Line-6, with free guarded parking, changing rooms and player amenities.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/venue',
    keywords: ['turf near uttara center metro station', 'football turf sector 17 uttara', 'crossbar metro arena location', 'turf with parking uttara']
});

export default function VenuePage() {
    return (<>
      <JsonLd id="venue" data={webPageSchema({ path: '/venue', title, description, type: 'ContactPage', breadcrumbs: [{ name: 'Venue & Directions', path: '/venue' }] })}/>
      <VenueClient />
    </>);
}
