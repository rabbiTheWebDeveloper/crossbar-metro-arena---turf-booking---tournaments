import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { KIT_STYLES, DEFAULT_KIT } from './squadData';

const LINE = 'rgba(255,255,255,0.6)';
const STRIPES = ['rgba(16,185,129,0.09)', 'rgba(4,120,87,0.09)', 'rgba(16,185,129,0.09)', 'rgba(4,120,87,0.09)', 'rgba(16,185,129,0.09)', 'rgba(4,120,87,0.09)'];
const PIN_WIDTH = 104;
const PIN_HEIGHT = 58;
const SELECTED_RING = '#facc15';

/**
 * The tactics board: a portrait pitch with one tappable marker per player.
 *   players: [{ id, name, number, role, x, y }]  (x / y are percentages of the pitch)
 *   kitColor: key of KIT_STYLES      selectedId: marker to highlight
 *   onPressPlayer(player): open the editor for that marker
 */
export function Pitch({ teamName, matchTag, formatLabel, formation, players, kitColor, selectedId, onPressPlayer }) {
    const kit = KIT_STYLES[kitColor] || KIT_STYLES[DEFAULT_KIT];
    return (
        <View style={styles.frame}>
            <LinearGradient colors={['#15803d', '#166534']} style={styles.fill} />
            <View style={styles.fill}>
                {STRIPES.map((color, i) => <View key={i} style={{ flex: 1, backgroundColor: color }} />)}
            </View>

            {/* Markings */}
            <View style={styles.touchline} />
            <View style={styles.halfway} />
            <View style={styles.centerCircle} />
            <View style={styles.centerSpot} />
            <View style={[styles.box, styles.boxTop]} />
            <View style={[styles.box, styles.boxBottom]} />

            <View style={styles.watermark}>
                <AppText size="xs" tone="white" weight="900" upper style={{ letterSpacing: 3, fontFamily: fonts.displayBold }}>Crossbar Metro Arena</AppText>
            </View>

            {/* Player markers */}
            {(players || []).map(p => {
                const selected = p.id === selectedId;
                return (
                    <Pressable
                        key={p.id}
                        onPress={() => onPressPlayer(p)}
                        hitSlop={4}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${p.name}, number ${p.number}, ${p.role}`}
                        style={({ pressed }) => [styles.pin, { left: `${p.x}%`, top: `${p.y}%` }, pressed ? { opacity: 0.8 } : null]}
                    >
                        <View style={[styles.disc, { backgroundColor: kit.bg, borderColor: selected ? SELECTED_RING : kit.border }, selected ? styles.discSelected : null]}>
                            <AppText size={13} weight="900" mono style={{ color: kit.text, lineHeight: 17 }}>{String(p.number)}</AppText>
                        </View>
                        <View style={styles.nameTag}>
                            <AppText size={10} tone="white" weight="800" numberOfLines={1} style={{ lineHeight: 14 }}>
                                {p.name}
                                {p.role ? <AppText size={10} tone="brand" weight="800" style={{ lineHeight: 14 }}>{` (${p.role})`}</AppText> : null}
                            </AppText>
                        </View>
                    </Pressable>
                );
            })}

            {/* Banner */}
            <View style={styles.banner}>
                <View style={{ flex: 1 }}>
                    <AppText size="xs" tone="white" weight="900" upper numberOfLines={1}>{teamName || ' '}</AppText>
                    <AppText size="xxs" tone="brand" mono numberOfLines={1}>{matchTag || ' '}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <AppText size="xxs" tone="soft" weight="800" upper>{formatLabel}</AppText>
                    <AppText size="xxs" tone="brand" mono>{formation}</AppText>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    frame: { width: '100%', maxWidth: 420, alignSelf: 'center', aspectRatio: 3 / 4.2, borderRadius: 16, borderWidth: 4, borderColor: '#0f172a', overflow: 'hidden', backgroundColor: '#166534' },
    fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    touchline: { position: 'absolute', left: 10, right: 10, top: 10, bottom: 10, borderWidth: 2, borderColor: LINE, borderRadius: 8 },
    halfway: { position: 'absolute', left: 10, right: 10, top: '50%', height: 2, marginTop: -1, backgroundColor: LINE },
    centerCircle: { position: 'absolute', left: '50%', top: '50%', width: 84, height: 84, marginLeft: -42, marginTop: -42, borderRadius: 42, borderWidth: 2, borderColor: LINE },
    centerSpot: { position: 'absolute', left: '50%', top: '50%', width: 8, height: 8, marginLeft: -4, marginTop: -4, borderRadius: 4, backgroundColor: colors.white },
    box: { position: 'absolute', left: '50%', width: 124, height: 54, marginLeft: -62, borderWidth: 2, borderColor: LINE },
    boxTop: { top: 10, borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
    boxBottom: { bottom: 10, borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    watermark: { position: 'absolute', left: 0, right: 0, bottom: 64, alignItems: 'center', opacity: 0.3 },
    pin: { position: 'absolute', width: PIN_WIDTH, marginLeft: -PIN_WIDTH / 2, marginTop: -PIN_HEIGHT / 2, alignItems: 'center' },
    disc: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    discSelected: { borderWidth: 3, transform: [{ scale: 1.12 }] },
    nameTag: { marginTop: 4, maxWidth: PIN_WIDTH, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.82)' },
    banner: { position: 'absolute', left: 10, right: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(0,0,0,0.62)' }
});
