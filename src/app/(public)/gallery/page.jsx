import { buildMetadata } from '../../../lib/seo';
import GalleryClient from './GalleryClient';

export const metadata = buildMetadata({ title: 'Gallery', description: 'Photos from matches, tournaments and the turf at Crossbar Metro Arena, Uttara.', path: '/gallery' });

export default function GalleryPage() {
    return <GalleryClient />;
}
