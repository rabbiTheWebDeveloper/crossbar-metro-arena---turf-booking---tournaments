import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';
import { GradientCard, Row, Badge, AppText, Heading, Mono } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';
import { initials, titleCase } from '@/lib/format';

const ROLE_TONES = { admin: 'warning', investor: 'purple', player: 'brand' };

/** Identity block: avatar initials, name, phone, e-mail and the account role. */
export function AccountCard({ user, children }) {
    const role = user?.role || 'visitor';
    return (
        <GradientCard style={{ gap: spacing.md }}>
            <Row gap={spacing.md}>
                <View style={styles.avatar}>
                    <AppText style={styles.avatarText}>{initials(user?.name)}</AppText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <Heading level={3} numberOfLines={1}>{user?.name || 'Player'}</Heading>
                    {user?.phone ? <Mono size="sm" tone="soft">{user.phone}</Mono> : null}
                    {user?.email ? <AppText size="xs" tone="muted" numberOfLines={1}>{user.email}</AppText> : null}
                </View>
                <Badge tone={ROLE_TONES[role] || 'neutral'} icon={Shield} label={titleCase(role)} />
            </Row>
            {children}
        </GradientCard>
    );
}

const styles = StyleSheet.create({
    avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fonts.displayBold, fontSize: 18, lineHeight: 24, color: colors.onBrand }
});
