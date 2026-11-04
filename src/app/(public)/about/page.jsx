import { buildMetadata, webPageSchema, faqSchema } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import { ABOUT_FAQ } from '../../../data/faq';
import AboutClient from './AboutClient';

const title = 'About the Arena, Facilities & Prices';
const description = 'Crossbar Metro Arena is a FIFA-standard 7v7 football turf with 400-lux floodlights beside Uttara Center Metro Station, Dhaka. See the facilities, the 12-slot weekday and weekend price table and answers to common questions.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/about',
    keywords: ['turf price dhaka', 'football turf rent price uttara', 'crossbar metro arena facilities', 'turf opening hours dhaka']
});

export default function AboutPage() {
    return (<>
      <JsonLd id="about" data={[
            webPageSchema({ path: '/about', title, description, type: 'AboutPage', breadcrumbs: [{ name: 'About', path: '/about' }] }),
            faqSchema(ABOUT_FAQ)
        ]}/>
      <AboutClient />
    </>);
}
