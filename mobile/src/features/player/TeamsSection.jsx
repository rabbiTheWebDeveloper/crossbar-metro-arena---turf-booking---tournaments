import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, Row, Button, IconButton, Chip, AppText, Heading, Label, Mono, SectionHeader, EmptyState, Divider, confirm } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { TeamFormSheet } from './TeamFormSheet';
import { AddPlayerCard } from './AddPlayerCard';
import { DEFAULT_TEAM_COLOR, readableOn } from './constants';

function TeamStat({ label, value, highlight }) {
    return (
        <View style={styles.stat}>
            <Mono size="lg" weight="900" tone={highlight ? 'brand' : 'default'}>{String(value ?? 0)}</Mono>
            <AppText size="xxs" tone="muted" upper>{label}</AppText>
        </View>
    );
}

/**
 * "My Teams": register squads, edit their details and manage the roster.
 *   createOpen / onOpenCreate / onCloseCreate: the "register squad" sheet is controlled by the
 *   dashboard so other sections ("Find an Opponent") can open it too.
 */
export function TeamsSection({ createOpen, onOpenCreate, onCloseCreate }) {
    const { myTeams, handleRemovePlayerFromTeam } = useArena();
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [editTeam, setEditTeam] = useState(null);
    const [removingPlayerId, setRemovingPlayerId] = useState('');

    useEffect(() => {
        if (!myTeams.some(t => t.id === selectedTeamId)) setSelectedTeamId(myTeams[0]?.id || '');
    }, [myTeams, selectedTeamId]);

    const selectedTeam = myTeams.find(t => t.id === selectedTeamId) || myTeams[0] || null;
    const hasTeam = myTeams.length > 0;
    const roster = selectedTeam?.players || [];
    const teamColor = selectedTeam?.homeColor || DEFAULT_TEAM_COLOR;

    const openEdit = () => {
        setEditTeam(selectedTeam);
        setEditOpen(true);
    };

    const onRemovePlayer = async (p) => {
        if (!selectedTeam || !p?.id || removingPlayerId) return;
        const ok = await confirm('Remove player?', `Remove ${p.name} from ${selectedTeam.name}?`, { confirmText: 'Remove', destructive: true });
        if (!ok) return;
        setRemovingPlayerId(p.id);
        await handleRemovePlayerFromTeam(selectedTeam.id, p.id); // error (if any) is shown by the context
        setRemovingPlayerId('');
    };

    return (
        <>
            <View style={{ gap: spacing.sm }}>
                <SectionHeader
                    title="My Teams & Squad Rosters"
                    subtitle="Create a team, add players with jersey numbers and positions, and track squad stats. You can captain up to 3 teams."
                    style={{ marginBottom: 0 }}
                />
                <Button title="Create New Team" icon={Plus} size="sm" onPress={onOpenCreate} style={{ alignSelf: 'flex-start' }} />
            </View>

            {!hasTeam ? (
                <Card>
                    <EmptyState
                        icon={Users}
                        title="Create your first team"
                        message="Register a squad to post match results and challenge other teams."
                        action={<Button title="Create Team" icon={Plus} size="sm" onPress={onOpenCreate} style={{ marginTop: spacing.sm }} />}
                    />
                </Card>
            ) : null}

            {myTeams.length > 1 ? (
                <Row wrap gap={8}>
                    <AppText size="xs" tone="muted">Team:</AppText>
                    {myTeams.map(t => (
                        <Chip key={t.id} label={t.name} selected={selectedTeam?.id === t.id} onPress={() => setSelectedTeamId(t.id)} />
                    ))}
                </Row>
            ) : null}

            {selectedTeam ? (
                <>
                    <Card style={{ gap: spacing.md }}>
                        <Row gap={spacing.md}>
                            <View style={[styles.crest, { backgroundColor: teamColor }]}>
                                <AppText size="xs" weight="900" style={{ color: readableOn(teamColor) }} numberOfLines={1}>{selectedTeam.shortCode || ''}</AppText>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Heading level={3} numberOfLines={2}>{selectedTeam.name}</Heading>
                                <AppText size="xs" tone="muted">
                                    Captain: <AppText size="xs" tone="soft" weight="800">{selectedTeam.captainName || ''}</AppText>{` · Area: ${selectedTeam.area || 'Dhaka'}`}
                                </AppText>
                            </View>
                            <Button title="Edit" icon={Pencil} variant="secondary" size="sm" onPress={openEdit} />
                        </Row>
                        <Row gap={spacing.sm}>
                            <TeamStat label="Played" value={selectedTeam.stats?.played} />
                            <TeamStat label="Won" value={selectedTeam.stats?.won} highlight />
                            <TeamStat label="Points" value={selectedTeam.stats?.points} highlight />
                        </Row>
                    </Card>

                    <Card style={{ gap: spacing.sm }}>
                        <Label tone="brand">{`Squad Roster (${roster.length} players)`}</Label>
                        {roster.length === 0 ? (
                            <AppText size="sm" tone="muted">No players yet. Add your first player below.</AppText>
                        ) : roster.map((p, i) => (
                            <View key={p.id || `${p.name}-${i}`}>
                                {i > 0 ? <Divider style={{ marginVertical: 0, marginBottom: spacing.sm }} /> : null}
                                <Row gap={spacing.md}>
                                    <View style={styles.jersey}>
                                        <Mono size="xs" tone="brand">{`#${p.number ?? ''}`}</Mono>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppText size="sm" weight="800" numberOfLines={1}>{p.name}</AppText>
                                        <AppText size="xs" tone="muted">{`${p.position || ''} · ${p.role || 'Player'}`}</AppText>
                                    </View>
                                    <Mono size="xs" tone="brand">{`${p.goals || 0} G`}</Mono>
                                    <IconButton
                                        icon={Trash2}
                                        size={32}
                                        iconSize={15}
                                        tone={colors.textMuted}
                                        bg="transparent"
                                        border="transparent"
                                        disabled={removingPlayerId === p.id}
                                        onPress={() => onRemovePlayer(p)}
                                        accessibilityLabel={`Remove ${p.name} from squad`}
                                    />
                                </Row>
                            </View>
                        ))}
                    </Card>

                    <AddPlayerCard key={selectedTeam.id} team={selectedTeam} />
                </>
            ) : null}

            <TeamFormSheet visible={createOpen} onClose={onCloseCreate} onSaved={(team) => { if (team?.id) setSelectedTeamId(team.id); }} />
            <TeamFormSheet visible={editOpen} onClose={() => setEditOpen(false)} team={editTeam} />
        </>
    );
}

const styles = StyleSheet.create({
    crest: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
    stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
    jersey: { minWidth: 34, height: 30, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }
});
