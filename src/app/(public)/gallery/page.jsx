import { buildMetadata, webPageSchema, imageGallerySchema } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import { fetchGalleryPhotos } from '../../../lib/seoData';
import GalleryClient from './GalleryClient';

// Gallery image structured data follows the admin uploads; refresh every 10 minutes.
export const revalidate = 600;

const title = 'Turf & Match Photo Gallery';
const description = 'Photos of the floodlit 7v7 turf, tournament nights, match highlights and the Uttara metro skyline at Crossbar Metro Arena, Dhaka.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/gallery',
    keywords: ['crossbar metro arena photos', 'uttara turf photos', 'dhaka football turf gallery']
});

export default async function GalleryPage() {
    const photos = await fetchGalleryPhotos();
    return (<>
      <JsonLd id="gallery" data={[
            webPageSchema({ path: '/gallery', title, description, type: 'CollectionPage', breadcrumbs: [{ name: 'Gallery', path: '/gallery' }] }),
            photos.length ? imageGallerySchema(photos) : null
        ]}/>
      <GalleryClient />
    </>);
}
