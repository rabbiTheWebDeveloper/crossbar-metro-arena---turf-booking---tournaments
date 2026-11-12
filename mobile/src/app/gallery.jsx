import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Eye, Zap, Layers, Moon, Image as ImageIcon } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, Segmented, EmptyState, Notice } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { PageHero } from '@/components/PageHero';
import { PhotoTile, PhotoGridSkeleton } from '@/features/gallery/PhotoTile';
import { PhotoViewer } from '@/features/gallery/PhotoViewer';

const HERO_STATS = [
    { label: 'Lighting', value: '400-Lux Pro LED', icon: Zap },
    { label: 'Turf Spec', value: '50mm Monofilament', icon: Layers },
    { label: 'Skyline', value: 'MRT Line-6 View', icon: Eye },
    { label: 'Hours', value: '6 AM – 12 AM Midnight', icon: Moon }
];

/** Photo albums of the arena: album filter, 2-column grid and a fullscreen viewer. */
export default function GalleryScreen() {
    const { galleryPhotos, isLoadingData, loadError, refreshData } = useArena();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const [activeAlbum, setActiveAlbum] = useState('All');
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const photosList = useMemo(() => (Array.isArray(galleryPhotos) ? galleryPhotos.filter(Boolean) : []), [galleryPhotos]);

    const albums = useMemo(() => {
        const seen = [];
        photosList.forEach(p => { if (p.album && !seen.includes(p.album)) seen.push(p.album); });
        return ['All', ...seen];
    }, [photosList]);

    // An album can disappear after a refresh: fall back to "All" instead of an empty grid
    const album = albums.includes(activeAlbum) ? activeAlbum : 'All';
    const filteredItems = useMemo(() => photosList.filter(item => album === 'All' || item.album === album), [photosList, album]);

    const albumOptions = useMemo(() => albums.map(a => ({ value: a, label: a === 'All' ? 'All Photo Albums' : `${a} Album` })), [albums]);
    const tileSize = Math.floor((width - spacing.lg * 2 - spacing.md) / 2);
    const showSkeleton = isLoadingData && photosList.length === 0;

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try { await refreshData(); } finally { setRefreshing(false); }
    }, [refreshData]);

    const changeAlbum = (a) => { setLightboxIndex(null); setActiveAlbum(a); };

    const renderItem = useCallback(({ item, index }) => (
        <PhotoTile photo={item} size={tileSize} onPress={() => setLightboxIndex(index)} />
    ), [tileSize]);

    const header = (
        <View style={{ gap: spacing.lg, marginBottom: spacing.xs }}>
            <PageHero
                eyebrow="Visual Tour & Match Photo Albums"
                eyebrowIcon={Camera}
                title="Photo Albums &"
                highlight="Pitch Atmosphere"
                description="Explore certified visual albums covering matches, tournaments, and the floodlit night arena right next to Uttara Center Metro Station."
                stats={HERO_STATS}
            />
            {albums.length > 1 ? <Segmented scroll size="sm" value={album} onChange={changeAlbum} options={albumOptions} /> : null}
        </View>
    );

    const empty = showSkeleton ? (
        <PhotoGridSkeleton size={tileSize} />
    ) : (
        <View style={{ gap: spacing.md }}>
            {loadError && photosList.length === 0 ? <Notice type="error" message={loadError} /> : null}
            <EmptyState
                icon={ImageIcon}
                title="No Photos In This Album"
                message="Official match and tournament photos are uploaded directly from the Crossbar Arena media desk. Check back soon!"
            />
        </View>
    );

    return (
        <Screen back title="Arena Gallery" scroll={false} padded={false}>
            <FlatList
                data={showSkeleton ? [] : filteredItems}
                keyExtractor={(photo, idx) => String(photo.id || idx)}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={{ gap: spacing.md }}
                contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md }}
                ListHeaderComponent={header}
                ListEmptyComponent={empty}
                showsVerticalScrollIndicator={false}
                initialNumToRender={8}
                windowSize={7}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brand} colors={[colors.brand]} progressBackgroundColor={colors.card} />}
            />

            <PhotoViewer
                photos={filteredItems}
                index={lightboxIndex !== null && filteredItems[lightboxIndex] ? lightboxIndex : null}
                onIndexChange={setLightboxIndex}
                onClose={() => setLightboxIndex(null)}
            />
        </Screen>
    );
}
