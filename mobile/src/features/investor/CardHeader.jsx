import React from 'react';
import { View } from 'react-native';
import { AppText, Row } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** Title line of a finance card: uppercase title, optional subtitle and a right-side slot. */
export function CardHeader({ title, subtitle, icon: Icon, right, divider, style }) {
    return (
        <Row
            justify="space-between"
            align="flex-start"
            gap={spacing.md}
            style={[divider ? { paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border } : null, style]}
        >
            <Row gap={6} align="flex-start" style={{ flex: 1 }}>
                {Icon ? <Icon size={14} color={colors.brand} style={{ marginTop: 2 }} /> : null}
                <View style={{ flex: 1 }}>
                    <AppText size="sm" weight="800" upper>{title}</AppText>
                    {subtitle ? <AppText size="xs" tone="muted">{subtitle}</AppText> : null}
                </View>
            </Row>
            {right}
        </Row>
    );
}
