import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Phone, Mail, Train, MessageSquare, Clock, MapPin, Globe, Camera, ChevronRight } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { Card, AppText, Label, Mono, Button, Row, Divider } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { useVenueContacts } from '@/features/venue/useVenueContacts';

function ContactLine({ icon: Icon, onPress, children }) {
    return (
        <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.line, pressed ? { opacity: 0.7 } : null]} accessibilityRole={onPress ? 'link' : undefined}>
            <Icon size={15} color={colors.brand} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>{children}</View>
            {onPress ? <ChevronRight size={15} color={colors.textDim} /> : null}
        </Pressable>
    );
}

/**
 * Closing block of Home (the website footer + floating WhatsApp button): who we are,
 * the turf hotline (call, WhatsApp, email, map), social links and the venue guide.
 *   go(href): navigate
 */
export function ArenaFooter({ go }) {
    const { pricing } = useArena();
    const { venue, telHref, phoneLabel, whatsappUrl, mapsUrl, mailHref, facebookUrl, instagramUrl, open } = useVenueContacts();
    const businessName = String(venue.businessName || 'Crossbar Metro Arena');
    const year = new Date().getFullYear();

    return (
        <Card>
            <View style={{ gap: spacing.md }}>
                <CrossbarLogo size="md" />
                <AppText size="sm" tone="muted">
                    {`${businessName} is a floodlit outdoor football turf beside Uttara Metro Center, Dhaka. 12 daily 90-minute slots, bookable up to ${pricing.bookingWindowDays || 60} days ahead with a ${formatMoney(pricing.advanceAmount || 0)} online advance.`}
                </AppText>
                <Row gap={6} align="flex-start">
                    <Train size={14} color={colors.brand} style={{ marginTop: 1 }} />
                    <AppText size="xs" weight="700" tone="brand" style={{ flex: 1 }}>{String(venue.metroStation || 'Uttara Center Metro Station (MRT Line-6)')}</AppText>
                </Row>

                <Divider style={{ marginVertical: 0 }} />

                <Label tone="white">Turf Hotline</Label>
                <View style={{ gap: spacing.xs }}>
                    {telHref ? (
                        <ContactLine icon={Phone} onPress={() => open(telHref, 'Could not start a call on this device.')}>
                            <Mono size="md">{phoneLabel}</Mono>
                        </ContactLine>
                    ) : null}
                    {whatsappUrl ? (
                        <ContactLine icon={MessageSquare} onPress={() => open(whatsappUrl, 'WhatsApp could not be opened on this device.')}>
                            <AppText size="sm" weight="700" tone="brand">WhatsApp booking chat</AppText>
                        </ContactLine>
                    ) : null}
                    {mailHref ? (
                        <ContactLine icon={Mail} onPress={() => open(mailHref, 'No email app is set up on this device.')}>
                            <AppText size="sm" tone="soft">{String(venue.email)}</AppText>
                        </ContactLine>
                    ) : null}
                    {venue.address ? (
                        <ContactLine icon={MapPin} onPress={() => open(mapsUrl, 'Could not open the map on this device.')}>
                            <AppText size="xs" tone="muted">{String(venue.address)}</AppText>
                        </ContactLine>
                    ) : null}
                    <ContactLine icon={Clock}>
                        <AppText size="xs" tone="muted">{String(venue.openingHours || 'Open daily')}</AppText>
                    </ContactLine>
                </View>

                <Row wrap gap={spacing.sm}>
                    {facebookUrl ? <Button title="Facebook" variant="secondary" size="sm" icon={Globe} onPress={() => open(facebookUrl)} /> : null}
                    {instagramUrl ? <Button title="Instagram" variant="secondary" size="sm" icon={Camera} onPress={() => open(instagramUrl)} /> : null}
                    <Button title="Venue & Metro Guide" variant="outline" size="sm" icon={MapPin} onPress={() => go('/venue')} />
                </Row>

                <Divider style={{ marginVertical: 0 }} />

                <AppText size="xs" tone="brand" center>Payments via bKash, Nagad & card (SSLCommerz)</AppText>
                <AppText size="xs" tone="dim" center>{`© ${year} ${businessName} (${venue.website || 'bookcrossbar.com'}). All rights reserved.`}</AppText>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    line: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 7 }
});
