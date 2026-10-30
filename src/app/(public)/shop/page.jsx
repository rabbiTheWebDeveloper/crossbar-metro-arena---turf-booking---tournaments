import { buildMetadata } from '../../../lib/seo';
import ShopClient from './ShopClient';

export const metadata = buildMetadata({ title: 'Arena Shop', description: 'Reserve match balls, shin guards, socks and gear online and pick them up at the arena.', path: '/shop' });

export default function ShopPage() {
    return <ShopClient />;
}
