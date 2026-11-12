import { formatIsoDate } from '@/lib/dateUtils';
import { HTTPS_URL_RE } from '../content/ImageUrlField';

export const ALBUMS = ['Matches', 'Arena', 'Tournaments', 'Facilities', 'Night Floodlights', 'Community'];

export const ASPECTS = [
    { value: 'wide', label: 'Wide (16:9 landscape)' },
    { value: 'square', label: 'Square (1:1)' },
    { value: 'portrait', label: 'Portrait (4:5 mobile)' }
];

/** "12 Nov 2026" for an ISO date / timestamp, '' when there is none. */
export const photoDate = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? formatIsoDate(String(iso).slice(0, 10), { weekday: false }) : '');

export const emptyPhotoForm = () => ({ title: '', album: 'Matches', caption: '', url: '', aspect: 'wide', featured: false, photographer: '', tags: '' });

export const photoToForm = (photo) => ({
    title: photo.title || '',
    album: photo.album || 'Arena',
    caption: photo.caption || '',
    url: photo.url || '',
    aspect: ASPECTS.some(a => a.value === photo.aspect) ? photo.aspect : 'wide',
    featured: !!photo.featured,
    photographer: photo.photographer || '',
    tags: (photo.tags || []).join(', ')
});

/** Search (title, caption, photographer, tags) + album + featured-only filter. */
export function filterPhotos(photos, { searchTerm, selectedAlbum, onlyFeatured }) {
    const q = String(searchTerm || '').trim().toLowerCase();
    return photos.filter(photo => {
        const matchesSearch = !q || [photo.title, photo.caption, photo.photographer, ...(photo.tags || [])].some(v => String(v || '').toLowerCase().includes(q));
        const matchesAlbum = selectedAlbum === 'All' || photo.album === selectedAlbum;
        const matchesFeatured = onlyFeatured ? !!photo.featured : true;
        return matchesSearch && matchesAlbum && matchesFeatured;
    });
}

/**
 * Validates the form exactly like the website and builds the API payload.
 * Returns { error } or { payload }.
 */
export function buildPhotoPayload(form, editing) {
    const title = form.title.trim();
    const url = form.url.trim();
    if (!title) return { error: 'Photo title is required.' };
    if (!HTTPS_URL_RE.test(url)) return { error: 'Paste a public https:// image URL (e.g. from ImageKit or Cloudinary). File uploads and data: URLs are not supported.' };
    const tags = form.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    return {
        payload: {
            ...(editing ? { id: editing.id } : {}),
            title,
            album: form.album.trim() || 'Arena',
            caption: form.caption.trim(),
            url,
            aspect: form.aspect,
            featured: form.featured,
            photographer: form.photographer.trim() || undefined,
            tags
        }
    };
}
