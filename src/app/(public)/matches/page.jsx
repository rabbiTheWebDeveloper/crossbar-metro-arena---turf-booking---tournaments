import { buildMetadata } from '../../../lib/seo';
import MatchesClient from './MatchesClient';

export const metadata = buildMetadata({ title: 'Fixtures & Challenges', description: 'Upcoming fixtures and open squad challenges at Crossbar Metro Arena. Find an opponent for your next match.', path: '/matches' });

export default function MatchesPage() {
    return <MatchesClient />;
}
