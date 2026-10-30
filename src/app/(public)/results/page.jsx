import { buildMetadata } from '../../../lib/seo';
import ResultsClient from './ResultsClient';

export const metadata = buildMetadata({ title: 'Match Day Results & Leaderboard', description: 'Latest match results, the team leaderboard and top scorers from Crossbar Metro Arena.', path: '/results' });

export default function ResultsPage() {
    return <ResultsClient />;
}
