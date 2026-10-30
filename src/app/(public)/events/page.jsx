import { buildMetadata } from '../../../lib/seo';
import EventsClient from './EventsClient';

export const metadata = buildMetadata({ title: 'Tournaments & Events', description: 'Register your squad for 7v7 and 5v5 tournaments at Crossbar Metro Arena under floodlights.', path: '/events' });

export default function EventsPage() {
    return <EventsClient />;
}
