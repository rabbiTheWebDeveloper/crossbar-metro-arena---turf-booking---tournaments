import { buildMetadata } from '../../../lib/seo';
import AboutClient from './AboutClient';

export const metadata = buildMetadata({ title: 'About the Arena', description: 'Facilities, slot timings and pricing at Crossbar Metro Arena, the floodlit football turf beside Uttara Center Metro Station.', path: '/about' });

export default function AboutPage() {
    return <AboutClient />;
}
