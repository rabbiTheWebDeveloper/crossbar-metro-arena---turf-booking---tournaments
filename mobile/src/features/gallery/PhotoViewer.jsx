import React, { useRef, useState } from 'react';
import { Modal, View, Pressable, ActivityIndicator, PanResponder, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react-native';
import { AppText, Heading } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';

const SWIPE_DISTANCE = 48;

/**
 * Fullscreen photo viewer (the website's lightbox).
 *   photos: the list being browsed      index: position of the open photo, or null when closed
 *   onIndexChange(nextIndex) / onClose()
 * Previous / next wrap around; swiping left or right does the same.
 */
export function PhotoViewer({ photos, index, onIndexChange, onClose }) {
    const insets = useSafeAreaInsets();
    const total = Array.isArray(photos) ? photos.length : 0;
    const photo = index !== null && index !== undefined && total > 0 ? photos[index] : null;
    const uri = photo ? absoluteUrl(photo.url) : '';
    const [settledUri, setSettledUri] = useState(''); // last uri that finished loading (or failed)
    const [failedUri, setFailedUri] = useState('');

    const goPrev = () => { if (photo && total > 1) onIndexChange(index === 0 ? total - 1 : index - 1); };
    const goNext = () => { if (photo && total > 1) onIndexChange(index === total - 1 ? 0 : index + 1); };

    // The PanResponder is created once, so it reads the latest handlers through a ref
    const nav = useRef({ goPrev, goNext });
    nav.current = { goPrev, goNext };
    const pan = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_e, g) => {
            if (g.dx > SWIPE_DISTANCE) nav.current.goPrev();
            else if (g.dx < -SWIPE_DISTANCE) nav.current.goNext();
        }
    })).current;

    const loading = !!uri && settledUri !== uri;
    const failed = !!uri && failedUri === uri;
    const position = photo ? `Photo ${index + 1} of ${total}` : '';

    return (
        <Modal visible={!!photo} animationType="fade" transparent={false} statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
            <View style={styles.root}>
                <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
                    <Pressable onPress={onClose} hitSlop={10} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Close">
                        <X size={22} color={colors.white} />
                    </Pressable>
                </View>

                <View style={styles.stage} {...pan.panHandlers}>
                    {loading ? <ActivityIndicator size="large" color={colors.brand} style={styles.center} /> : null}
                    {failed ? (
                        <View style={styles.center}>
                            <ImageOff size={30} color={colors.textDim} strokeWidth={1.6} />
                            <AppText size="sm" tone="muted" center style={{ marginTop: spacing.sm }}>This photo could not be loaded.</AppText>
                        </View>
                    ) : null}
                    {uri ? (
                        <Image
                            source={{ uri }}
                            style={styles.image}
                            contentFit="contain"
                            transition={150}
                            accessibilityLabel={photo?.title || 'Arena visual'}
                            onLoad={() => { setSettledUri(uri); setFailedUri(''); }}
                            onError={() => { setSettledUri(uri); setFailedUri(uri); }}
                        />
                    ) : null}

                    {total > 1 ? (
                        <>
                            <Pressable onPress={goPrev} hitSlop={8} style={[styles.roundBtn, styles.navBtn, { left: spacing.md }]} accessibilityRole="button" accessibilityLabel="Previous photo">
                                <ChevronLeft size={24} color={colors.white} />
                            </Pressable>
                            <Pressable onPress={goNext} hitSlop={8} style={[styles.roundBtn, styles.navBtn, { right: spacing.md }]} accessibilityRole="button" accessibilityLabel="Next photo">
                                <ChevronRight size={24} color={colors.white} />
                            </Pressable>
                        </>
                    ) : null}
                </View>

                {photo ? (
                    <View style={[styles.captionWrap, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm }]}>
                        <View style={styles.caption}>
                            <AppText size="xs" tone="brand" weight="800" upper>{`${photo.album ? `${photo.album} Album · ` : ''}${position}`}</AppText>
                            {photo.title ? <Heading level={3}>{String(photo.title)}</Heading> : null}
                            {photo.caption ? <AppText size="sm" tone="soft" numberOfLines={5}>{String(photo.caption)}</AppText> : null}
                        </View>
                    </View>
                ) : null}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    center: { position: 'absolute', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    image: { width: '100%', height: '100%' },
    navBtn: { position: 'absolute', top: '50%', marginTop: -22 },
    captionWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    caption: { gap: 3, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }
});
