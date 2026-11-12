import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { useArena } from '@/context/ArenaContext';
import { AppText, Heading, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { openLink, telUrl } from './links';

/** Brand block on top of the login / register screens: logo, eyebrow pill, title and intro. */
export function AuthHeader({ icon: Icon, eyebrow, title, description }) {
    return (
        <View style={styles.header}>
            <CrossbarLogo size="lg" />
            <View style={styles.pill}>
                {Icon ? <Icon size={12} color={colors.brand} strokeWidth={2.4} /> : null}
                <AppText size="xs" tone="brand" weight="800" mono style={{ letterSpacing: 0.8 }}>{eyebrow}</AppText>
            </View>
            <Heading level={2} center>{title}</Heading>
            <AppText size="sm" tone="muted" center style={{ maxWidth: 340 }}>{description}</AppText>
        </View>
    );
}

/** Small print under the auth forms (secure sign-in note, payment methods, helpline). */
export function AuthFooter() {
    const { siteSettings, showNotice } = useArena();
    const phone = siteSettings?.phone || '';
    return (
        <View style={styles.footer}>
            <Row gap={6} justify="center">
                <ShieldCheck size={14} color={colors.brand} />
                <AppText size="xs" tone="muted">Secure sign-in · Crossbar Metro Arena, Dhaka</AppText>
            </Row>
            <AppText size="xs" tone="dim" center>Payments via bKash, Nagad & card (SSLCommerz)</AppText>
            {phone ? (
                <Pressable hitSlop={8} onPress={() => openLink(telUrl(phone), () => showNotice('error', 'Could not open the phone dialer on this device.'))}>
                    <AppText size="xs" tone="muted" center>
                        Helpline: <AppText size="xs" tone="brand" weight="800" mono>{siteSettings?.phoneFormatted || phone}</AppText>
                    </AppText>
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    header: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, marginTop: spacing.sm },
    footer: { alignItems: 'center', gap: 4, paddingTop: spacing.sm }
});
