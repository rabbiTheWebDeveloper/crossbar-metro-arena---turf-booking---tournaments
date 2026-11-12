import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, Star, Trash2, Pencil, Copy, Check } from 'lucide-react-native';
import { Card, Row, AppText, Heading, Button, IconButton } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';
import { photoDate } from './helpers';

/**
 * Gallery photo as a large card (grid view).
 *   busy: an action on this photo is in flight     copied: its URL was just copied
 */
export function PhotoCard({ photo, busy, copied, onView, onEdit, onCopy, onToggleFeatured, onDelete }) {
    const tags = Array.isArray(photo.tags) ? photo.tags : [];
    return (
        <Card padded={false} style={busy ? { opacity: 0.6 } : null}>
            <Pressable onPress={onView} style={styles.frame} accessibilityRole="imagebutton" accessibilityLabel={`View ${photo.title || 'photo'}`}>
                <Image source={{ uri: absoluteUrl(photo.url) }} style={styles.image} contentFit="cover" transition={200} />
                <LinearGradient colors={[colors.transparent, colors.overlay]} start={{ x: 0, y: 0.45 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />

                <View style={styles.top}>
                    <View style={styles.albumPill}>
                        <AppText size="xxs" weight="900" tone="brand" mono upper numberOfLines={1}>{photo.album || 'Arena'}</AppText>
                    </View>
                    <Pressable
                        onPress={onToggleFeatured}
                        disabled={busy}
                        hitSlop={8}
                        style={[styles.starBtn, photo.featured ? { borderColor: colors.gold, backgroundColor: colors.warningSoft } : null]}
                        accessibilityRole="button"
                        accessibilityLabel={photo.featured ? 'Featured (tap to unpin)' : 'Feature on the home page'}
                    >
                        <Star size={15} color={photo.featured ? colors.gold : colors.textSoft} fill={photo.featured ? colors.gold : 'none'} />
                    </Pressable>
                </View>

                <Row justify="space-between" style={styles.bottom} pointerEvents="none">
                    <AppText size="xs" tone="soft" mono numberOfLines={1} style={{ flex: 1 }}>{photo.photographer || ''}</AppText>
                    <AppText size="xs" tone="brand" weight="800" mono upper>{photo.aspect || 'wide'}</AppText>
                </Row>
            </Pressable>

            <View style={styles.body}>
                <View>
                    <Heading level={4} numberOfLines={1}>{photo.title}</Heading>
                    {photo.caption ? <AppText size="sm" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>{photo.caption}</AppText> : null}
                </View>

                <Row justify="space-between" style={styles.meta}>
                    <Row gap={4} style={{ flex: 1 }}>
                        {tags.length > 0 ? tags.slice(0, 2).map(tag => (
                            <View key={tag} style={styles.tag}>
                                <AppText size="xs" tone="soft" mono numberOfLines={1}>{`#${tag}`}</AppText>
                            </View>
                        )) : <AppText size="xs" tone="dim" mono>No tags</AppText>}
                    </Row>
                    <AppText size="xs" tone="dim" mono>{photoDate(photo.uploadedAt || photo.createdAt)}</AppText>
                </Row>

                <Row gap={6}>
                    <Button title="View" icon={Eye} variant="secondary" size="sm" onPress={onView} style={{ flex: 1 }} />
                    <Button title="Edit" icon={Pencil} variant="secondary" size="sm" onPress={onEdit} style={{ flex: 1 }} />
                    <IconButton icon={copied ? Check : Copy} size={34} iconSize={15} tone={copied ? colors.brand : colors.textSoft} onPress={onCopy} accessibilityLabel="Copy URL" />
                    <IconButton icon={Trash2} size={34} iconSize={15} tone={colors.danger} disabled={busy} onPress={onDelete} accessibilityLabel="Delete photo" />
                </Row>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    frame: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.bgDeep },
    image: { width: '100%', height: '100%' },
    top: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    albumPill: { flexShrink: 1, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.sm, backgroundColor: colors.overlay, borderWidth: 1, borderColor: colors.borderBrand },
    starBtn: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlay, borderWidth: 1, borderColor: colors.borderStrong },
    bottom: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: 10 },
    body: { padding: spacing.lg, gap: spacing.md },
    meta: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    tag: { flexShrink: 1, paddingVertical: 2, paddingHorizontal: 6, borderRadius: radius.sm, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border }
});
