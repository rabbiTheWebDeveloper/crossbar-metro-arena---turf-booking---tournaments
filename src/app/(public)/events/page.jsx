import { buildMetadata, webPageSchema, eventSchema, itemListSchema } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import { fetchPublicTournaments } from '../../../lib/seoData';
import EventsClient from './EventsClient';

// Tournament structured data follows the admin events list; refresh every 10 minutes.
export const revalidate = 600;

const title = 'Football Tournaments in Dhaka';
const description = 'Register your squad for 7v7 and 5v5 football tournaments with cash prize pools at Crossbar Metro Arena, Uttara. Entry fees, dates, formats and registration deadlines for every open cup in Dhaka.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/events',
    keywords: ['football tournament dhaka', 'turf tournament uttara', '7v7 tournament bangladesh', 'corporate football tournament dhaka', 'futsal tournament dhaka']
});

export default async function EventsPage() {
    const tournaments = await fetchPublicTournaments();
    const events = tournaments.map(eventSchema).filter(Boolean);
    return (<>
      <JsonLd id="events" data={[
            webPageSchema({ path: '/events', title, description, type: 'CollectionPage', breadcrumbs: [{ name: 'Tournaments & Events', path: '/events' }] }),
            events.length ? itemListSchema('Upcoming football tournaments at Crossbar Metro Arena', events, '/events') : null
        ]}/>
      <EventsClient />
    </>);
}
