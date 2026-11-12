import React, { useState } from 'react';
import { View } from 'react-native';
import { Users, Plus, Trash2, X } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, Row, AppText, Badge, Button, EmptyState, confirm } from '@/components/ui';
import { formatIsoDate } from '@/lib/dateUtils';
import { CHALLENGE_STATUS_TONE, statusLabel } from './matchdayUtils';
import { ContactButtons } from './ContactButtons';

/**
 * The signed-in captain's own challenges (open, matched and closed) with the manage actions:
 * close an open one, delete any, and contact the captain who accepted.
 */
export function MyChallengesList({ onPost }) {
    const { myChallenges, handleUpdateChallenge, handleDeleteChallenge } = useArena();
    const [busyId, setBusyId] = useState('');
    const list = myChallenges || [];

    const closeChallenge = async (c) => {
        setBusyId(c.id);
        await handleUpdateChallenge(c.id, { status: 'closed' });
        setBusyId('');
    };
    const deleteChallenge = async (c) => {
        const ok = await confirm('Delete challenge?', `Delete the challenge for ${c.teamName} on ${formatIsoDate(c.date)}?`, { confirmText: 'Delete', destructive: true });
        if (!ok) return;
        setBusyId(c.id);
        await handleDeleteChallenge(c.id);
        setBusyId('');
    };

    if (list.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="You have not posted any challenges yet."
                message="Post your squad's preferred date and slot to challenge other squads on the public Match Day board."
                action={<Button title="Post Match Challenge" icon={Plus} size="sm" onPress={onPost} />}
            />
        );
    }

    return (
        <View style={{ gap: 12 }}>
            {list.map(c => {
                const busy = busyId === c.id;
                const acceptedBy = c.matchedTeamName || c.matchedCaptainName;
                return (
                    <Card key={c.id}>
                        <Row wrap gap={8}>
                            <Badge tone={CHALLENGE_STATUS_TONE[c.status] || 'neutral'} label={statusLabel(c.status) || 'open'} />
                            <AppText size="xs" tone="muted" style={{ flex: 1 }}>{`${formatIsoDate(c.date)} · ${c.timeSlot || ''}`}</AppText>
                        </Row>
                        <AppText size="md" weight="800" style={{ marginTop: 6 }}>{c.teamName || 'Squad'}</AppText>
                        <AppText size="xs" tone="muted">{`${c.format || ''} · ${c.level || ''}`}</AppText>
                        {c.status === 'matched' && acceptedBy ? (
                            <View style={{ marginTop: 6, gap: 6 }}>
                                <AppText size="xs" tone="info">
                                    {`Accepted by ${acceptedBy}${c.matchedCaptainName && c.matchedTeamName ? ` (${c.matchedCaptainName})` : ''}${c.matchedPhone ? ` · ${c.matchedPhone}` : ''}`}
                                </AppText>
                                <ContactButtons phone={c.matchedPhone} message={`Hi ${c.matchedCaptainName || 'Captain'}, this is ${c.captainName || 'the captain'} of ${c.teamName}. You accepted our challenge at Crossbar Metro Arena.`} />
                            </View>
                        ) : null}
                        {c.notes ? <AppText size="xs" tone="muted" numberOfLines={2} style={{ marginTop: 4 }}>{c.notes}</AppText> : null}
                        <Row justify="flex-end" style={{ marginTop: 10 }}>
                            {c.status === 'open' ? <Button title="Close" icon={X} variant="secondary" size="sm" disabled={busy} onPress={() => closeChallenge(c)} /> : null}
                            <Button title="Delete" icon={Trash2} variant="danger" size="sm" loading={busy} onPress={() => deleteChallenge(c)} />
                        </Row>
                    </Card>
                );
            })}
        </View>
    );
}
