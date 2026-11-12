import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, SectionHeader, AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { absoluteUrl } from '@/lib/api';

const PREVIEW_COUNT = 4;

/** Home preview of the gallery: four photos (featured first) in a 2 x 2 grid. */
export function GalleryPreview({ onSeeAll }) {
    const { galleryPhotos } = useArena();
    const { width } = useWindowDimensions();
    const tileWidth = Math.floor((width - spacing.lg * 2 - spacing.sm) / 2);
    const tileHeight = Math.round(tileWidth * 0.75);

    const photos = useMemo(() => {
        const list = Array.isArray(galleryPhotos) ? galleryPhotos.filter(p => p && p.url) : [];
        return [...list.filter(p => p.featured), ...list.filter(p => !p.featured)].slice(0, PREVIEW_COUNT);
    }, [galleryPhotos]);

    return (
        <View>
            <SectionHeader eyebrow="Pitch Visuals" title="Arena Highlights & Night Atmosphere" action="Full gallery" onAction={onSeeAll} />

            {photos.length === 0 ? (
                <Card>
                    <View style={{ alignItems: 'center', gap: spacing.sm }}>
                        <Camera size={24} color={colors.textDim} />
                        <AppText size="sm" tone="muted" center>Live photography is taken from the arena media deck during matches.</AppText>
                        <Button title="View photo albums" variant="outline" size="sm" onPress={onSeeAll} />
                    </View>
                </Card>
            ) : (
                <View style={styles.grid}>
                    {photos.map((item, idx) => (
                        <Pressable key={item.id || idx} onPress={onSeeAll} style={[styles.tile, { width: tileWidth, height: tileHeight }]} accessibilityRole="imagebutton" accessibilityLabel={String(item.title || 'Crossbar Arena')}>
                            <Image source={{ uri: absoluteUrl(item.url) }} style={{ width: tileWidth, height: tileHeight }} contentFit="cover" transition={150} />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.caption}>
                                <AppText size="xxs" weight="900" tone="brand" upper numberOfLines={1}>{String(item.album || 'Arena')}</AppText>
                                {item.title ? <AppText size="xs" weight="800" tone="white" numberOfLines={1}>{String(item.title)}</AppText> : null}
                            </LinearGradient>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardAlt, overflow: 'hidden' },
    caption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, paddingTop: spacing.xl }
});
