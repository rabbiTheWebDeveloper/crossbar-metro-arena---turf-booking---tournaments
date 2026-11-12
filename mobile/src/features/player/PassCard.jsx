import React from 'react';
import { View } from 'react-native';
import { Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { Card, Row, Badge, AppText, Mono, Divider } from '@/components/ui';
import { colors } from '@/theme';
import { formatIsoDate } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';
import { passStatus } from './constants';

/** Tappable match pass summary (code, status, squad, kick-off, money). Opens the digital pass. */
export function PassCard({ booking: b, onPress }) {
    const status = passStatus(b?.paymentStatus);
    const paid = Number(b?.advanceAmount) || 0;
    const due = Number(b?.dueAmount) || 0;
    return (
        <Card onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open pass ${b?.bookingCode || ''}`} style={{ gap: 4 }}>
            <Row justify="space-between">
                <Mono size="sm" tone="brand" weight="900">{b?.bookingCode || ''}</Mono>
                <Badge tone={status.tone} label={status.label} />
            </Row>
            <Row justify="space-between">
                <View style={{ flex: 1 }}>
                    <AppText size="md" weight="800" numberOfLines={1}>{b?.teamName || 'My squad'}</AppText>
                    {b?.courtName ? <AppText size="xs" tone="muted" numberOfLines={1}>{b.courtName}</AppText> : null}
                </View>
                <ChevronRight size={18} color={colors.textDim} />
            </Row>
            <Divider style={{ marginVertical: 6 }} />
            <Row justify="space-between" wrap>
                <Row gap={5}>
                    <Calendar size={13} color={colors.brand} />
                    <AppText size="sm" tone="soft">{formatIsoDate(b?.date)}</AppText>
                </Row>
                <Row gap={5}>
                    <Clock size={13} color={colors.brandLight} />
                    <AppText size="sm" mono style={{ color: colors.brandLight }}>{b?.displayTime || ''}</AppText>
                </Row>
            </Row>
            <AppText size="xs" tone="muted" mono>
                {`Paid ${formatMoney(paid)} · Due `}<AppText size="xs" mono weight="800" tone={due > 0 ? 'warning' : 'brand'}>{formatMoney(due)}</AppText>
            </AppText>
        </Card>
    );
}
