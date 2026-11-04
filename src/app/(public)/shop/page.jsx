import { buildMetadata, webPageSchema, productSchema, itemListSchema } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import { fetchPublicProducts } from '../../../lib/seoData';
import ShopClient from './ShopClient';

// Product structured data follows the admin catalogue; refresh every 10 minutes.
export const revalidate = 600;

const title = 'Football Gear Shop in Uttara';
const description = 'Reserve match balls, shin guards, grip socks, turf shoes and arena merchandise online and pick them up at Crossbar Metro Arena, Uttara, Dhaka. Prices in BDT, pay at the counter.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/shop',
    keywords: ['football gear shop uttara', 'buy football dhaka', 'shin guards dhaka', 'grip socks bangladesh']
});

export default async function ShopPage() {
    const products = await fetchPublicProducts();
    const items = products.map(productSchema).filter(Boolean);
    return (<>
      <JsonLd id="shop" data={[
            webPageSchema({ path: '/shop', title, description, type: 'CollectionPage', breadcrumbs: [{ name: 'Arena Shop', path: '/shop' }] }),
            items.length ? itemListSchema('Crossbar Metro Arena shop', items, '/shop') : null
        ]}/>
      <ShopClient />
    </>);
}
