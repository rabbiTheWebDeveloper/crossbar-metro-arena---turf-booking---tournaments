import React from 'react';
import { ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { Search, Star, X, LayoutGrid, List } from 'lucide-react-native';
import { Card, Row, Input, Chip } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

function ViewModeButton({ icon: Icon, active, onPress, label }) {
    return (
        <Pressable onPress={onPress} style={[styles.modeBtn, active ? { backgroundColor: colors.brand } : null]} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}>
            <Icon size={16} color={active ? colors.onBrand : colors.textMuted} />
        </Pressable>
    );
}

/**
 * Search box, featured-only switch, grid / list toggle and the album chips of the gallery manager.
 *   albums: [{ name, count }] (the first entry is "All")
 */
export function GalleryFilters({ searchTerm, onSearch, onlyFeatured, onToggleFeatured, viewMode, onViewMode, albums, selectedAlbum, onSelectAlbum }) {
    return (
        <Card tone="brand" style={{ gap: spacing.md, padding: spacing.md }}>
            <Input
                icon={Search}
                value={searchTerm}
                onChangeText={onSearch}
                placeholder="Search by title, caption, tags or photographer..."
                autoCapitalize="none"
                returnKeyType="search"
                right={searchTerm ? (
                    <Pressable onPress={() => onSearch('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                        <X size={16} color={colors.textMuted} />
                    </Pressable>
                ) : null}
            />

            <Row justify="space-between">
                <Chip label="Featured Only" icon={Star} tone={colors.gold} selected={onlyFeatured} onPress={onToggleFeatured} />
                <View style={styles.modes}>
                    <ViewModeButton icon={LayoutGrid} label="Grid view" active={viewMode === 'grid'} onPress={() => onViewMode('grid')} />
                    <ViewModeButton icon={List} label="List view" active={viewMode === 'table'} onPress={() => onViewMode('table')} />
                </View>
            </Row>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6 }}>
                {albums.map(album => (
                    <Chip key={album.name} label={`${album.name} (${album.count})`} selected={selectedAlbum === album.name} onPress={() => onSelectAlbum(album.name)} />
                ))}
            </ScrollView>
        </Card>
    );
}

const styles = StyleSheet.create({
    modes: { flexDirection: 'row', gap: 2, padding: 2, borderRadius: radius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
    modeBtn: { width: 34, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' }
});
