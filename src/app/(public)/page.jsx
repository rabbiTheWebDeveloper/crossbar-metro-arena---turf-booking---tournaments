import { buildMetadata } from '../../lib/seo';
import HomeClient from './HomeClient';

export const metadata = buildMetadata({ absoluteTitle: 'Crossbar Metro Arena | Floodlit Football Turf in Uttara, Dhaka', description: 'Book floodlit 90-minute football turf slots beside Uttara Metro Center, Dhaka. Pay the advance online, join tournaments and post match results.', path: '/' });

export default function HomePage() {
    return <HomeClient />;
}
