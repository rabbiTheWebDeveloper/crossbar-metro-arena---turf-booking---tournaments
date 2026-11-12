import React from 'react';
import { View } from 'react-native';
import { Calendar, CheckCircle2 } from 'lucide-react-native';
import { Card, Row, AppText, Heading, Mono, Badge, Divider } from '@/components/ui';
import { colors } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';

/** One confirmed upcoming fixture. Only the team name and kick-off time are public. */
export function FixtureCard({ booking, today }) {
    const b = booking || {};
    return (
        <Card>
            <Row justify="space-between">
                <Badge tone="brand" label={`Slot #${b.slotNumber ?? '-'}`} />
                <Row gap={5}>
                    <Calendar size={13} color={colors.brand} />
                    <AppText size="xs" tone="muted">{b.date === today ? 'Today' : formatIsoDate(b.date)}</AppText>
                </Row>
            </Row>
            <Row justify="space-between" align="flex-end" style={{ marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                    <Heading level={3} numberOfLines={1}>{b.teamName || 'Reserved'}</Heading>
                </View>
                <Mono size="xs" tone="brand">{b.displayTime || ''}</Mono>
            </Row>
            <Divider style={{ marginVertical: 10 }} />
            <Row justify="flex-end" gap={5}>
                <CheckCircle2 size={13} color={colors.brand} />
                <AppText size="xs" tone="brand" weight="700">Confirmed</AppText>
            </Row>
        </Card>
    );
}
