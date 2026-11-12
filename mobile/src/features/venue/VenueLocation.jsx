import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MapPin, Phone, Mail, Globe, Train, Car, Shield, Sparkles, CheckCircle2, MessageSquare, CloudSun, Layers } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Card, GradientCard, AppText, Heading, Label, Mono, Badge, Button, Input, Notice, Row } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { WeatherWidget } from '@/features/home/WeatherWidget';
import { useVenueContacts } from './useVenueContacts';

/** One contact line (icon, caption, value); tappable when `onPress` is given. */
function ContactRow({ icon: Icon, label, onPress, children }) {
    return (
        <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.contactRow, pressed ? { opacity: 0.8 } : null]}>
            <Icon size={18} color={colors.brand} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 2 }}>
                <Label>{label}</Label>
                {children}
            </View>
        </Pressable>
    );
}

/**
 * How to reach the arena: metro banner, matchday weather, amenities, official contacts and the
 * "fast message" form that hands a pre-filled text to WhatsApp (nothing is stored or sent from here).
 *   onBookSlotClick: opens the booking tab     hideHeading: skip the section title
 */
export function VenueLocation({ onBookSlotClick, hideHeading = false }) {
    const { showNotice } = useArena();
    const { venue, telHref, phoneLabel, whatsappUrl, waDigits, mapsUrl, mailHref, facebookUrl, instagramUrl, open } = useVenueContacts();
    const [inquiryName, setInquiryName] = useState('');
    const [inquiryPhone, setInquiryPhone] = useState('');
    const [inquiryMsg, setInquiryMsg] = useState('');
    const [inquiryError, setInquiryError] = useState('');

    const handleSendInquiry = () => {
        if (!inquiryName.trim() || !inquiryPhone.trim()) { setInquiryError('Please enter your name and your phone / WhatsApp number.'); return; }
        setInquiryError('');
        if (!waDigits) { showNotice('error', 'WhatsApp contact is not configured yet. Please call the arena instead.'); return; }
        const text = `Hi Crossbar Metro Arena, this is ${inquiryName.trim()} (${inquiryPhone.trim()}).\n${inquiryMsg.trim() || 'I would like to ask about booking a slot.'}`;
        open(`https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`, 'WhatsApp could not be opened on this device. Please call the arena instead.');
        showNotice('info', 'WhatsApp opened with your message. Tap send to deliver it to the arena desk.');
    };

    const amenities = [
        { title: 'Direct Metro Rail Connectivity', desc: String(venue.metroDetails || 'Beside Uttara Center Metro Station (MRT Line-6).'), icon: Train, badge: 'Metro' },
        { title: 'High-Mast LED Floodlights', desc: 'Even, glare-free illumination for evening and night matches.', icon: Sparkles, badge: 'Night play' },
        { title: 'Shock-Pad Artificial Turf', desc: '50mm monofilament artificial grass with shock-pad cushioning and fast drainage.', icon: Layers, badge: 'Pro turf' },
        { title: 'Changing Room', desc: 'A changing room for both squads to get kitted up before kickoff.', icon: Shield, badge: 'Players' },
        { title: 'Vehicle Parking', desc: 'On-site parking for cars and motorbikes next to the arena entrance.', icon: Car, badge: 'Parking' },
        { title: 'Online Booking & Payments', desc: 'Pick a slot online and pay the advance with bKash, Nagad or card. No double booking.', icon: CheckCircle2, badge: 'Instant' }
    ];

    return (
        <View style={{ gap: spacing.lg }}>
            {!hideHeading ? (
                <View style={{ gap: spacing.sm }}>
                    <Badge tone="brand" icon={MapPin} label="Prime Uttara Location" />
                    <Heading level={2} upper>How to Reach & Venue Amenities</Heading>
                    <AppText size="sm" tone="muted">{`${venue.address}. The easiest football turf in Dhaka to reach by Metro Rail.`}</AppText>
                </View>
            ) : null}

            <GradientCard>
                <View style={{ gap: spacing.md }}>
                    <Badge tone="brand" icon={Train} label="Dhaka Metro Rail (MRT Line-6)" />
                    <Heading level={2} upper>Beat the Dhaka traffic. Ride the Metro straight to the turf.</Heading>
                    <AppText size="sm" tone="soft">
                        {'Take the Metro to '}
                        <AppText size="sm" weight="800" tone="brand">{String(venue.metroStation || 'Uttara Center Station')}</AppText>
                        {`. ${venue.metroDetails || 'The arena is a short walk from the station exit.'}`}
                    </AppText>
                    <Button title="Open in Google Maps" icon={MapPin} onPress={() => open(mapsUrl, 'Could not open the map on this device.')} block />
                    {facebookUrl ? <Button title="Follow on Facebook" variant="info" onPress={() => open(facebookUrl)} block /> : null}
                </View>
            </GradientCard>

            <View style={{ gap: spacing.sm }}>
                <Row justify="space-between">
                    <Row gap={6}>
                        <CloudSun size={16} color={colors.brand} />
                        <Label tone="soft">Matchday Weather · Uttara</Label>
                    </Row>
                    <Mono size="xs" tone="dim" weight="600">Source: Open-Meteo</Mono>
                </Row>
                <WeatherWidget onBookSlotClick={onBookSlotClick} />
            </View>

            <View style={{ gap: spacing.sm }}>
                {amenities.map((item) => {
                    const Icon = item.icon;
                    return (
                        <View key={item.title} style={styles.amenity}>
                            <View style={styles.amenityIcon}>
                                <Icon size={19} color={colors.brand} />
                            </View>
                            <View style={{ flex: 1, gap: 3 }}>
                                <Row justify="space-between" align="flex-start">
                                    <AppText size="md" weight="800" style={{ flex: 1 }}>{item.title}</AppText>
                                    <Badge label={item.badge} />
                                </Row>
                                <AppText size="xs" tone="muted">{item.desc}</AppText>
                            </View>
                        </View>
                    );
                })}
            </View>

            <Card>
                <View style={{ gap: spacing.md }}>
                    <View style={{ gap: 2 }}>
                        <Label tone="brand">Official Contacts</Label>
                        <Heading level={2} upper>{String(venue.businessName || 'Crossbar Metro Arena')}</Heading>
                        <AppText size="xs" tone="muted">For slot bookings, corporate leagues, sponsorship and private turf rentals.</AppText>
                    </View>

                    <ContactRow icon={MapPin} label="Location & Address" onPress={() => open(mapsUrl, 'Could not open the map on this device.')}>
                        <AppText size="sm" weight="600">{String(venue.address || '')}</AppText>
                        {venue.metroDetails ? <AppText size="xs" tone="brand" weight="600">{String(venue.metroDetails)}</AppText> : null}
                    </ContactRow>
                    {telHref ? (
                        <ContactRow icon={Phone} label="Hotline & Bookings" onPress={() => open(telHref, 'Could not start a call on this device.')}>
                            <AppText size="lg" weight="800">{phoneLabel}</AppText>
                            <AppText size="xs" tone="muted">Call or WhatsApp during opening hours</AppText>
                        </ContactRow>
                    ) : null}
                    {mailHref ? (
                        <ContactRow icon={Mail} label="Email Enquiries" onPress={() => open(mailHref, 'No email app is set up on this device.')}>
                            <AppText size="sm" weight="600">{String(venue.email)}</AppText>
                        </ContactRow>
                    ) : null}
                    <ContactRow icon={Globe} label="Web & Social">
                        <Row wrap gap={spacing.md}>
                            <Mono size="sm" tone="brand" weight="600">{String(venue.website || 'bookcrossbar.com')}</Mono>
                            {facebookUrl ? (
                                <Pressable onPress={() => open(facebookUrl)} hitSlop={8}>
                                    <AppText size="sm" tone="info" weight="700">Facebook</AppText>
                                </Pressable>
                            ) : null}
                            {instagramUrl ? (
                                <Pressable onPress={() => open(instagramUrl)} hitSlop={8}>
                                    <AppText size="sm" tone="purple" weight="700">Instagram</AppText>
                                </Pressable>
                            ) : null}
                        </Row>
                    </ContactRow>

                    {whatsappUrl ? <Button title="WhatsApp the arena" icon={MessageSquare} onPress={() => open(whatsappUrl, 'WhatsApp could not be opened on this device.')} block /> : null}
                    {telHref ? <Button title="Call Hotline" variant="secondary" icon={Phone} onPress={() => open(telHref, 'Could not start a call on this device.')} block /> : null}
                </View>
            </Card>

            <Card>
                <View style={{ gap: spacing.md }}>
                    <View style={{ gap: 2 }}>
                        <Label tone="brand">Fast Message</Label>
                        <Heading level={2} upper>Need a custom slot or tournament?</Heading>
                        <AppText size="xs" tone="muted">Fill this in and we will open WhatsApp with your message ready to send to the arena desk.</AppText>
                    </View>
                    <Input label="Your Name" required placeholder="Your name" value={inquiryName} onChangeText={setInquiryName} maxLength={60} autoCapitalize="words" />
                    <Input label="Your Phone / WhatsApp" required type="phone" placeholder="01XXXXXXXXX" value={inquiryPhone} onChangeText={setInquiryPhone} maxLength={16} />
                    <Input
                        label="Inquiry / Booking Requirements"
                        multiline
                        maxLength={500}
                        placeholder="e.g. Want to book two consecutive slots on Friday night for a corporate match with a referee"
                        value={inquiryMsg}
                        onChangeText={setInquiryMsg}
                    />
                    {inquiryError ? <Notice type="error" message={inquiryError} /> : null}
                    <Button title="Open in WhatsApp" icon={MessageSquare} onPress={handleSendInquiry} block />
                    <View style={styles.hours}>
                        <AppText size="xs" tone="muted" style={{ flex: 1 }}>{`Opening hours: ${venue.openingHours || 'see booking calendar'}`}</AppText>
                        {onBookSlotClick ? (
                            <Pressable onPress={onBookSlotClick} hitSlop={8}>
                                <AppText size="xs" tone="brand" weight="700">Book a slot →</AppText>
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    amenity: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    amenityIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' },
    hours: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }
});
