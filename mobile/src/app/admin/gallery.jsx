import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Camera, Plus, ExternalLink, Star, Layers, Image as ImageIcon } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { AppText, Button, Row, StatCard, StatGrid, EmptyState, Loading, confirm } from '@/components/ui';
import { usePaged, ShowMoreButton } from '@/features/admin/content/paging';
import { GalleryFilters } from '@/features/admin/gallery/GalleryFilters';
import { PhotoCard } from '@/features/admin/gallery/PhotoCard';
import { PhotoRow } from '@/features/admin/gallery/PhotoRow';
import { PhotoFormSheet } from '@/features/admin/gallery/PhotoFormSheet';
import { PhotoLightbox } from '@/features/admin/gallery/PhotoLightbox';
import { filterPhotos } from '@/features/admin/gallery/helpers';

/** Admin · Gallery & Pitch Photos: add by image URL, edit, feature, copy link and delete. */
export default function AdminGalleryScreen() {
    const router = useRouter();
    const { galleryPhotos, handleDeletePhoto, handleToggleFeaturedPhoto, showNotice, isLoadingData } = useArena();
    // Search, filter & view mode
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAlbum, setSelectedAlbum] = useState('All');
    const [onlyFeatured, setOnlyFeatured] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    // Sheets
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const copiedTimer = useRef(null);

    useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);

    const albumNames = useMemo(() => Array.from(new Set(galleryPhotos.map(p => p.album).filter(Boolean))), [galleryPhotos]);
    const albums = useMemo(() => [
        { name: 'All', count: galleryPhotos.length },
        ...albumNames.map(name => ({ name, count: galleryPhotos.filter(p => p.album === name).length }))
    ], [albumNames, galleryPhotos]);

    const filteredPhotos = useMemo(() => filterPhotos(galleryPhotos, { searchTerm, selectedAlbum, onlyFeatured }), [galleryPhotos, searchTerm, selectedAlbum, onlyFeatured]);
    const paged = usePaged(filteredPhotos, `${selectedAlbum}|${onlyFeatured}|${searchTerm}`, 20);

    const featuredCount = galleryPhotos.filter(p => p.featured).length;
    const albumCount = new Set(galleryPhotos.map(p => p.album)).size;

    const openAdd = () => { setEditingPhoto(null); setSheetOpen(true); };
    const openEdit = (photo) => { setEditingPhoto(photo); setSheetOpen(true); };

    const toggleFeatured = async (photo) => {
        if (busyId) return;
        setBusyId(photo.id);
        const res = await handleToggleFeaturedPhoto(photo.id);
        setBusyId(null);
        if (res?.ok) showNotice('success', photo.featured ? 'Removed from featured' : 'Pinned to featured highlights');
    };

    const remove = async (photo) => {
        if (busyId) return;
        const ok = await confirm('Delete photo?', `Delete "${photo.title}" from the gallery?`, { confirmText: 'Delete', destructive: true });
        if (!ok) return;
        setBusyId(photo.id);
        const res = await handleDeletePhoto(photo.id);
        setBusyId(null);
        if (res?.ok) { showNotice('success', 'Photo deleted'); setLightboxIndex(null); }
    };

    const copyUrl = async (photo) => {
        try {
            await Clipboard.setStringAsync(String(photo.url || ''));
            setCopiedId(photo.id);
            if (copiedTimer.current) clearTimeout(copiedTimer.current);
            copiedTimer.current = setTimeout(() => setCopiedId(null), 2000);
        } catch {
            showNotice('error', 'Clipboard is not available on this device.');
        }
    };

    const PhotoItem = viewMode === 'grid' ? PhotoCard : PhotoRow;

    return (
        <AdminScreen title="Gallery" subtitle="Gallery & Pitch Photos">
            <AppText size="sm" tone="muted">
                Manage match, tournament and arena photos. Changes publish to the public gallery immediately.
            </AppText>
            <Row>
                <Button title="Public Gallery" iconRight={ExternalLink} variant="secondary" onPress={() => router.push('/gallery')} style={{ flex: 1 }} />
                <Button title="Add Photo" icon={Plus} onPress={openAdd} style={{ flex: 1 }} />
            </Row>

            {/* Counts */}
            <StatGrid>
                <StatCard label="Photos" value={String(galleryPhotos.length)} icon={ImageIcon} tone="neutral" />
                <StatCard label="Featured" value={String(featuredCount)} icon={Star} tone="warning" hint="Shown on the public home page" />
                <StatCard label="Albums" value={String(albumCount)} icon={Layers} tone="neutral" />
            </StatGrid>

            <GalleryFilters
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                onlyFeatured={onlyFeatured}
                onToggleFeatured={() => setOnlyFeatured(v => !v)}
                viewMode={viewMode}
                onViewMode={setViewMode}
                albums={albums}
                selectedAlbum={selectedAlbum}
                onSelectAlbum={setSelectedAlbum}
            />

            {/* Results */}
            {isLoadingData && galleryPhotos.length === 0 ? (
                <Loading label="Loading photos…" />
            ) : filteredPhotos.length === 0 ? (
                <EmptyState
                    icon={Camera}
                    title="No photos found"
                    message={galleryPhotos.length === 0 ? 'The gallery is empty. Add a photo by pasting an image URL.' : 'Try adjusting your search or album filter.'}
                    action={<Button title="Add Photo" size="sm" onPress={openAdd} style={{ marginTop: 6 }} />}
                />
            ) : (
                <>
                    {paged.visible.map((photo, idx) => (
                        <PhotoItem
                            key={photo.id}
                            photo={photo}
                            busy={busyId === photo.id}
                            copied={copiedId === photo.id}
                            onView={() => setLightboxIndex(idx)}
                            onEdit={() => openEdit(photo)}
                            onCopy={() => copyUrl(photo)}
                            onToggleFeatured={() => toggleFeatured(photo)}
                            onDelete={() => remove(photo)}
                        />
                    ))}
                    <ShowMoreButton paged={paged} />
                </>
            )}

            <PhotoFormSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} photo={editingPhoto} existingAlbums={albumNames} />
            <PhotoLightbox photos={filteredPhotos} index={lightboxIndex} onChangeIndex={setLightboxIndex} onClose={() => setLightboxIndex(null)} />
        </AdminScreen>
    );
}
