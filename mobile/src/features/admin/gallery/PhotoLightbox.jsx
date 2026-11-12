import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { AppText, Heading, IconButton, Row } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';

/**
 * Full-screen photo viewer with previous / next (wraps around).
 *   photos: the list currently shown in the manager     index: position in that list, or null when closed
 */
export function PhotoLightbox({ photos, index, onChangeIndex, onClose }) {
    const insets = useSafeAreaInsets();
    const photo = index !== null && index !== undefined ? photos[index] : null;
    const total = photos.length;

    const prev = () => { if (photo) onChangeIndex(index === 0 ? total - 1 : index - 1); };
    const next = () => { if (photo) onChangeIndex(index === total - 1 ? 0 : index + 1); };

    return (
        <Modal visible={!!photo} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
            <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                <Row justify="flex-end" style={{ paddingHorizontal: spacing.lg }}>
                    <IconButton icon={X} onPress={onClose} size={42} iconSize={22} tone={colors.white} accessibilityLabel="Close" />
                </Row>

                {photo ? (
                    <>
                        <View style={styles.stage}>
                            <Image source={{ uri: absoluteUrl(photo.url) }} style={styles.image} contentFit="contain" transition={150} />
                        </View>

                        <View style={styles.info}>
                            <Row justify="space-between" align="flex-start">
                                <AppText size="xs" tone="brand" weight="800" mono upper style={{ flex: 1 }}>
                                    {`${photo.album || 'Arena'} · Photo ${index + 1} of ${total}`}
                                </AppText>
                                {photo.photographer ? <AppText size="xs" tone="muted" mono numberOfLines={1} style={{ flexShrink: 1 }}>{`Credit: ${photo.photographer}`}</AppText> : null}
                            </Row>
                            <Heading level={3}>{photo.title}</Heading>
                            {photo.caption ? <AppText size="sm" tone="soft">{photo.caption}</AppText> : null}
                        </View>

                        <Row justify="space-between" style={{ paddingHorizontal: spacing.lg }}>
                            <IconButton icon={ChevronLeft} onPress={prev} size={46} iconSize={24} tone={colors.white} disabled={total < 2} accessibilityLabel="Previous" />
                            <IconButton icon={ChevronRight} onPress={next} size={46} iconSize={24} tone={colors.white} disabled={total < 2} accessibilityLabel="Next" />
                        </Row>
                    </>
                ) : null}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgDeep, gap: spacing.md },
    stage: { flex: 1, paddingHorizontal: spacing.sm },
    image: { width: '100%', height: '100%' },
    info: { marginHorizontal: spacing.lg, padding: spacing.md, gap: 6, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
});
