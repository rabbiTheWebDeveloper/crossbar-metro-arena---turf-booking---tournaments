import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Star, Trash2, Pencil, Copy, Check } from 'lucide-react-native';
import { Card, Row, AppText, Badge, IconButton } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';

/**
 * Gallery photo as a compact row (the website's table view).
 *   busy: an action on this photo is in flight     copied: its URL was just copied
 */
export function PhotoRow({ photo, busy, copied, onView, onEdit, onCopy, onToggleFeatured, onDelete }) {
    return (
        <Card style={[{ gap: spacing.sm, padding: spacing.md }, busy ? { opacity: 0.6 } : null]}>
            <Row align="flex-start" gap={spacing.md}>
                <Pressable onPress={onView} style={styles.thumb} accessibilityRole="imagebutton" accessibilityLabel={`View ${photo.title || 'photo'}`}>
                    <Image source={{ uri: absoluteUrl(photo.url) }} style={styles.thumbImage} contentFit="cover" transition={150} />
                </Pressable>
                <View style={{ flex: 1, gap: 2 }}>
                    <AppText size="sm" weight="800" numberOfLines={1}>{photo.title}</AppText>
                    {photo.caption ? <AppText size="xs" tone="muted" numberOfLines={1}>{photo.caption}</AppText> : null}
                    <Row gap={6} wrap style={{ marginTop: 2 }}>
                        <Badge tone="brand" label={String(photo.album || 'Arena')} />
                        <AppText size="xs" tone="dim" mono numberOfLines={1} style={{ flexShrink: 1 }}>{`${photo.photographer || '—'} · ${String(photo.aspect || 'wide').toUpperCase()}`}</AppText>
                    </Row>
                </View>
            </Row>

            <Row gap={6} justify="flex-end">
                <IconButton
                    icon={Star}
                    size={32}
                    iconSize={15}
                    tone={photo.featured ? colors.gold : colors.textDim}
                    bg={photo.featured ? colors.warningSoft : colors.glassStrong}
                    border={photo.featured ? colors.gold : colors.border}
                    disabled={busy}
                    onPress={onToggleFeatured}
                    accessibilityLabel={photo.featured ? 'Featured (tap to unpin)' : 'Feature on the home page'}
                />
                <IconButton icon={Pencil} size={32} iconSize={15} onPress={onEdit} accessibilityLabel="Edit" />
                <IconButton icon={copied ? Check : Copy} size={32} iconSize={15} tone={copied ? colors.brand : colors.textSoft} onPress={onCopy} accessibilityLabel="Copy URL" />
                <IconButton icon={Trash2} size={32} iconSize={15} tone={colors.danger} disabled={busy} onPress={onDelete} accessibilityLabel="Delete" />
            </Row>
        </Card>
    );
}

const styles = StyleSheet.create({
    thumb: { width: 72, height: 52, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.border },
    thumbImage: { width: 72, height: 52 }
});
