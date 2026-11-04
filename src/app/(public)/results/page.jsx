import { buildMetadata, webPageSchema } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import ResultsClient from './ResultsClient';

const title = 'Match Results & Standings';
const description = 'Official match results, the team leaderboard and top scorers from Crossbar Metro Arena, the floodlit football turf in Uttara, Dhaka. Updated after every published fixture.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/results',
    keywords: ['turf football results dhaka', 'uttara turf leaderboard', 'amateur football standings dhaka']
});

export default function ResultsPage() {
    return (<>
      <JsonLd id="results" data={webPageSchema({ path: '/results', title, description, type: 'CollectionPage', breadcrumbs: [{ name: 'Match Results', path: '/results' }] })}/>
      <ResultsClient />
    </>);
}
