import { buildMetadata, siteConfig, webPageSchema, bookingServiceSchema } from '../../lib/seo';
import { JsonLd } from '../../components/JsonLd';
import HomeClient from './HomeClient';

const description = 'Book floodlit 90-minute football turf slots online beside Uttara Center Metro Station, Dhaka. 12 slots a day from 6:30 AM to 12:30 AM, pay with bKash, Nagad or card, join 7v7 tournaments and track match results.';

export const metadata = buildMetadata({
    absoluteTitle: siteConfig.defaultTitle,
    description,
    path: '/',
    keywords: ['book turf online dhaka', 'turf near uttara metro', 'football turf sector 17 uttara', 'night football turf dhaka']
});

export default function HomePage() {
    return (<>
      <JsonLd id="home" data={[
            webPageSchema({ path: '/', description, type: 'WebPage' }),
            bookingServiceSchema()
        ]}/>
      <HomeClient />
    </>);
}
