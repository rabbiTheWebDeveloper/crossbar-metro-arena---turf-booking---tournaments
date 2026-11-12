import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Bell, Lock, LogOut } from 'lucide-react-native';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { Card, Row, Button, AppText, Label, Mono, SectionHeader } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatDateTime } from '@/lib/dateUtils';
import { titleCase } from '@/lib/format';
import { ProfileForm, PasswordForm } from './ProfileForms';

/** The notifications recorded for the signed-in number on this device (local log). */
export function NotificationLog() {
    const { smsLogs, currentUser, isVisitor } = useArena();
    const myNotifications = useMemo(() => {
        if (isVisitor) return [];
        const phone = cleanPhone(currentUser?.phone);
        if (!phone) return [];
        return (smsLogs || []).filter(l => cleanPhone(l?.recipientPhone) === phone);
    }, [smsLogs, currentUser, isVisitor]);

    return (
        <Card style={{ gap: spacing.sm }}>
            <Row gap={6}>
                <Bell size={15} color={colors.brand} />
                <Label tone="brand">Notification log</Label>
            </Row>
            <AppText size="xs" tone="dim">Confirmations recorded for your number on this device.</AppText>
            {myNotifications.length === 0 ? (
                <AppText size="sm" tone="muted" center style={{ paddingVertical: spacing.lg }}>No notifications recorded yet.</AppText>
            ) : myNotifications.slice(0, 10).map(log => (
                <View key={log.id} style={styles.log}>
                    <Row justify="space-between" gap={spacing.sm}>
                        <AppText size="xs" tone="muted" upper style={{ flex: 1 }} numberOfLines={1}>{titleCase(log.event || 'notification')}</AppText>
                        <Mono size="xs" tone="muted" weight="400">{formatDateTime(log.sentAt)}</Mono>
                    </Row>
                    <AppText size="sm" tone="soft">{log.message}</AppText>
                </View>
            ))}
        </Card>
    );
}

/** "Profile & Settings": profile details, password, the local notification log and logout. */
export function ProfileSection({ onLogout, loggingOut }) {
    return (
        <>
            <Card style={{ gap: spacing.md }}>
                <SectionHeader title="Player Profile" style={{ marginBottom: 0 }} />
                <ProfileForm showPosition />
            </Card>

            <Card style={{ gap: spacing.md }}>
                <Row gap={6}>
                    <Lock size={15} color={colors.brand} />
                    <Label tone="brand">Change Password</Label>
                </Row>
                <PasswordForm />
            </Card>

            <NotificationLog />

            <Button title={loggingOut ? 'Logging out…' : 'Logout'} icon={LogOut} variant="danger" block loading={loggingOut} onPress={onLogout} />
        </>
    );
}

const styles = StyleSheet.create({
    log: { gap: 4, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
