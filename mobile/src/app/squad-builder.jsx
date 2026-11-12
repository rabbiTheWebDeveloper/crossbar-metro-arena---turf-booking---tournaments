import React, { useCallback, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useOpenTab } from '@/lib/navigation';
import { Users, Share2, Copy, Check, Sparkles, Shirt, Calendar, Trophy, MessageCircle, RotateCcw, UserPlus } from 'lucide-react-native';
import { Screen, Card, Row, AppText, Heading, Label, Mono, Input, Field, Segmented, Button, Badge, Loading, confirm } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { PageHero } from '@/components/PageHero';
import { Pitch } from '@/features/squad/Pitch';
import { PlayerEditSheet } from '@/features/squad/PlayerEditSheet';
import { useSquad } from '@/features/squad/useSquad';
import { useLineupShare } from '@/features/squad/useLineupShare';
import { FORMAT_OPTIONS, KIT_KEYS, KIT_STYLES, DEFAULT_KIT, TEAM_NAME_MAX, MATCH_TAG_MAX, formatOf, buildShareText } from '@/features/squad/squadData';

const WHATSAPP_GREEN = '#25D366';

/** Squad lineup & tactics board: pick a format, name the players, choose a kit and share the lineup. */
export default function SquadBuilderScreen() {
    const openTab = useOpenTab();
    const squad = useSquad();
    const { teamName, matchTag, format, formation, kitColor, players, source, sourceTeam, loaded, myTeam, canLoadRoster, isCustomLineup } = squad;
    const [editingPlayerId, setEditingPlayerId] = useState(null);

    const kit = KIT_STYLES[kitColor] || KIT_STYLES[DEFAULT_KIT];
    const formatLabel = formatOf(format).label;
    const isSample = source !== 'roster';
    const editingPlayer = editingPlayerId ? (players.find(p => p.id === editingPlayerId) || null) : null;

    const getShareText = useCallback(() => buildShareText({ teamName, matchTag, format, formation, players }), [teamName, matchTag, format, formation, players]);
    const { copied, copyError, copy, shareWhatsApp, shareOther } = useLineupShare(getShareText);

    const handleFormatChange = async (next) => {
        if (next === format) return;
        if (isCustomLineup) {
            const ok = await confirm(`Switch to ${formatOf(next).label}?`, 'This lays out a fresh lineup for the new format. The names and numbers you edited will be replaced.', { confirmText: 'Switch format' });
            if (!ok) return;
        }
        setEditingPlayerId(null);
        squad.changeFormat(next);
    };

    const handleLoadRoster = async () => {
        if (isCustomLineup) {
            const ok = await confirm('Load your team roster?', `The lineup on the pitch will be replaced with the registered players of ${myTeam?.name || 'your team'}.`, { confirmText: 'Load roster' });
            if (!ok) return;
        }
        setEditingPlayerId(null);
        squad.loadRoster();
    };

    const handleReset = async () => {
        const ok = await confirm('Reset the squad?', 'Team name, match tag, kit and lineup go back to the sample squad.', { confirmText: 'Reset', destructive: true });
        if (!ok) return;
        setEditingPlayerId(null);
        squad.reset();
    };

    if (!loaded) {
        return (
            <Screen back title="Squad Builder" refreshable={false}>
                <Loading label="Loading your squad…" />
            </Screen>
        );
    }

    return (
        <>
            <Screen back title="Squad Builder" subtitle="Squad lineup & tactics board">
                <PageHero
                    eyebrow="Interactive Tactical Room"
                    eyebrowIcon={Sparkles}
                    title="Squad Lineup &"
                    highlight="Tactics Board"
                    description="Pick your 7v7 or 5v5 setup, assign jersey numbers and captain armbands, customise your kit and share the lineup with your squad on WhatsApp."
                    stats={[
                        { label: 'Format', value: formatLabel, icon: Users },
                        { label: 'Formation', value: formation, icon: Shirt },
                        { label: 'Players', value: `${players.length} on pitch`, icon: Trophy },
                        { label: 'Kit', value: kit.label, icon: Sparkles }
                    ]}
                    actions={<Button title="Book Turf For Squad" icon={Calendar} onPress={() => openTab('/booking')} />}
                />

                {/* Tactical pitch */}
                <View style={{ gap: spacing.sm }}>
                    <Pitch
                        teamName={teamName}
                        matchTag={matchTag}
                        formatLabel={format}
                        formation={formation}
                        players={players}
                        kitColor={kitColor}
                        selectedId={editingPlayerId}
                        onPressPlayer={(p) => setEditingPlayerId(p.id)}
                    />
                    <AppText size="xs" tone="muted" center>
                        {isSample
                            ? 'Sample squad shown. Tap any player on the pitch to rename or edit the jersey number.'
                            : 'Lineup seeded from your registered roster. Tap any player to adjust name or number.'}
                    </AppText>
                </View>

                {/* Squad & match details */}
                <Card style={{ gap: spacing.md }}>
                    <Row gap={8}>
                        <Shirt size={16} color={colors.brand} />
                        <Heading level={4} upper style={{ flex: 1 }}>Squad & Match Details</Heading>
                    </Row>
                    <Input label="Team Name" value={teamName} onChangeText={squad.setTeamName} maxLength={TEAM_NAME_MAX} autoCapitalize="words" />
                    <Input label="Match Tag / Description" value={matchTag} onChangeText={squad.setMatchTag} maxLength={MATCH_TAG_MAX} />
                    <Field label="Format" hint={`Formation ${formation}`}>
                        <Segmented value={format} onChange={handleFormatChange} options={FORMAT_OPTIONS} />
                    </Field>
                    <Field label="Kit Color">
                        <View style={styles.kitGrid}>
                            {KIT_KEYS.map(k => {
                                const active = kitColor === k;
                                return (
                                    <Pressable
                                        key={k}
                                        onPress={() => squad.setKitColor(k)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: active }}
                                        accessibilityLabel={`${KIT_STYLES[k].label} kit`}
                                        style={[styles.kitOption, active ? styles.kitOptionActive : null]}
                                    >
                                        <View style={[styles.kitSwatch, { backgroundColor: KIT_STYLES[k].bg, borderColor: KIT_STYLES[k].border }]} />
                                        <AppText size="xs" weight="700" tone={active ? 'default' : 'muted'} style={{ flex: 1 }} numberOfLines={1}>{KIT_STYLES[k].label}</AppText>
                                        {active ? <Check size={14} color={colors.brand} strokeWidth={3} /> : null}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Field>
                </Card>

                {/* Starting roster */}
                <Card style={{ gap: spacing.sm }}>
                    <Row justify="space-between">
                        <Label tone="soft">Starting Roster</Label>
                        <Badge tone={isSample ? 'warning' : 'success'} label={isSample ? 'Sample squad' : `From ${sourceTeam || 'your team'}`} style={{ maxWidth: '60%' }} />
                    </Row>
                    {players.map(p => (
                        <Pressable
                            key={p.id}
                            onPress={() => setEditingPlayerId(p.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Edit ${p.name}`}
                            style={({ pressed }) => [styles.rosterRow, pressed ? { backgroundColor: colors.glassStrong } : null]}
                        >
                            <Mono size="sm" tone="brand" weight="900" style={{ minWidth: 34 }}>{`#${p.number}`}</Mono>
                            <AppText size="sm" weight="600" style={{ flex: 1 }} numberOfLines={1}>{p.name}</AppText>
                            <AppText size="xs" tone="muted" weight="800" upper>{p.role}</AppText>
                        </Pressable>
                    ))}
                    <Row wrap style={{ marginTop: 4 }}>
                        {canLoadRoster ? <Button title={`Load ${myTeam?.name || 'team'} roster`} variant="outline" size="sm" icon={UserPlus} onPress={handleLoadRoster} style={{ flexGrow: 1 }} /> : null}
                        <Button title="Reset squad" variant="ghost" size="sm" icon={RotateCcw} onPress={handleReset} style={{ flexGrow: 1 }} />
                    </Row>
                </Card>

                {/* Export & share */}
                <View style={{ gap: spacing.sm }}>
                    {copyError ? <AppText size="xs" tone="danger">{copyError}</AppText> : null}
                    <Button
                        title="Share Lineup Card on WhatsApp"
                        icon={MessageCircle}
                        size="lg"
                        block
                        upper={false}
                        onPress={shareWhatsApp}
                        style={{ backgroundColor: WHATSAPP_GREEN, borderColor: WHATSAPP_GREEN }}
                    />
                    <Button title="Share Lineup via Another App" icon={Share2} variant="secondary" block upper={false} onPress={shareOther} />
                    <Button
                        title={copied ? 'Lineup Copied to Clipboard!' : 'Copy Formatted Squad Text'}
                        icon={copied ? Check : Copy}
                        variant={copied ? 'outline' : 'secondary'}
                        block
                        upper={false}
                        onPress={copy}
                    />
                </View>
            </Screen>

            <PlayerEditSheet player={editingPlayer} onSave={squad.savePlayer} onClose={() => setEditingPlayerId(null)} />
        </>
    );
}

const styles = StyleSheet.create({
    kitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    kitOption: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    kitOptionActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
    kitSwatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
    rosterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 9, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
