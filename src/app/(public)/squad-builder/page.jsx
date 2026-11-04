import { buildMetadata, webPageSchema, getCanonicalUrl } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import SquadBuilderClient from './SquadBuilderClient';

const title = 'Squad Builder & Formation Planner';
const description = 'Free 7v7 and 5v5 football squad builder: pick a formation, place your players on the tactical pitch, customise kits and share the lineup with your team before kickoff at Crossbar Metro Arena.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/squad-builder',
    keywords: ['7v7 formation builder', '5v5 football lineup maker', 'football squad builder online']
});

export default function SquadBuilderPage() {
    return (<>
      <JsonLd id="squad-builder" data={[
            webPageSchema({ path: '/squad-builder', title, description, breadcrumbs: [{ name: 'Squad Builder', path: '/squad-builder' }] }),
            {
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: 'Crossbar Squad Builder',
                url: getCanonicalUrl('/squad-builder'),
                applicationCategory: 'SportsApplication',
                operatingSystem: 'Any',
                browserRequirements: 'Requires JavaScript',
                isAccessibleForFree: true,
                offers: { '@type': 'Offer', price: 0, priceCurrency: 'BDT' },
                description
            }
        ]}/>
      <SquadBuilderClient />
    </>);
}
