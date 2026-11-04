import { buildMetadata, webPageSchema } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import MatchesClient from './MatchesClient';

const title = 'Fixtures & Squad Challenges';
const description = 'Upcoming kickoffs and open squad challenges at Crossbar Metro Arena, Uttara. Find an opponent team in Dhaka, post a challenge and lock in a floodlit 90-minute match.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/matches',
    keywords: ['find football opponent dhaka', 'turf match fixtures uttara', 'football squad challenge dhaka']
});

export default function MatchesPage() {
    return (<>
      <JsonLd id="matches" data={webPageSchema({ path: '/matches', title, description, type: 'CollectionPage', breadcrumbs: [{ name: 'Fixtures & Challenges', path: '/matches' }] })}/>
      <MatchesClient />
    </>);
}
