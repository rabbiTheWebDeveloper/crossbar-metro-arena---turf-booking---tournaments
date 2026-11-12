import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ImageIcon } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { colors, radius, spacing, fonts } from '@/theme';

/**
 * One photo of the gallery grid: thumbnail with the album + title over a dark gradient.
 *   size: tile width in px (the tile is square)      onPress: opens the fullscreen viewer
 */
export function PhotoTile({ photo, size, onPress }) {
    const uri = absoluteUrl(photo.url);
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="imagebutton"
            accessibilityLabel={photo.title || 'Crossbar Arena photo'}
            style={({ pressed }) => [styles.tile, { width: size, height: size }, pressed ? { borderColor: colors.borderBrand, opacity: 0.88 } : null]}
        >
            <ImageIcon size={24} color={colors.textDim} strokeWidth={1.6} />
            {uri ? <Image source={{ uri }} style={styles.fill} contentFit="cover" transition={200} recyclingKey={String(photo.id || uri)} /> : null}
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.92)']} locations={[0, 0.45, 1]} style={styles.shade}>
                {photo.album ? <AppText size="xxs" tone="brand" weight="800" upper numberOfLines={1}>{String(photo.album)}</AppText> : null}
                {photo.title ? <AppText size="sm" tone="white" weight="900" style={{ fontFamily: fonts.heading }} numberOfLines={2}>{String(photo.title)}</AppText> : null}
            </LinearGradient>
        </Pressable>
    );
}

/** Pulsing placeholders shown while the first gallery load is in flight. */
export function PhotoGridSkeleton({ size, count = 6 }) {
    const pulse = useRef(new Animated.Value(0.45)).current;
    useEffect(() => {
        const loop = Animated.loop(Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true })
        ]));
        loop.start();
        return () => loop.stop();
    }, [pulse]);
    const cells = [];
    for (let i = 0; i < count; i++) cells.push(i);
    return (
        <View style={styles.skeletonGrid} accessibilityLabel="Loading photos">
            {cells.map(n => (
                <Animated.View key={n} style={[styles.tile, { width: size, height: size, opacity: pulse }]} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    tile: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
    shade: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end', padding: spacing.md, gap: 1 },
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }
});
