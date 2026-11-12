import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Share, Linking, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { CheckCircle2, AlertCircle, Share2, MapPin, Calendar, Clock, Users, Shield, Copy, Check, Ticket, MessageCircle, Phone, ChevronDown, ChevronUp, ListChecks } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { Sheet, AppText, Label, Mono, Badge, Button, Row, Divider } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { formatMoney } from '@/lib/format';
import { formatIsoDate, isIsoDate } from '@/lib/dateUtils';
import { useVenueContacts } from '@/features/venue/useVenueContacts';

const HEADER = {
    paid_full: { label: 'Slot Booking Confirmed', tone: 'success', icon: CheckCircle2 },
    paid_advance: { label: 'Slot Booking Confirmed', tone: 'success', icon: CheckCircle2 },
    confirmed_unpaid: { label: 'Confirmed · Pay at Arena', tone: 'warning', icon: CheckCircle2 },
    pending_payment: { label: 'Payment in Progress', tone: 'info', icon: AlertCircle },
    needs_refund: { label: 'Refund Pending', tone: 'purple', icon: AlertCircle },
    cancelled: { label: 'Booking Cancelled', tone: 'danger', icon: AlertCircle }
};
const PAY_LABEL = {
    paid_full: { label: 'Paid in Full', tone: 'success' },
    paid_advance: { label: 'Advance Paid', tone: 'success' },
    confirmed_unpaid: { label: 'Pay at Arena Desk', tone: 'warning' },
    pending_payment: { label: 'Payment in Progress', tone: 'info' },
    needs_refund: { label: 'Refund Pending', tone: 'purple' },
    cancelled: { label: 'Cancelled', tone: 'danger' }
};
const statusText = (status) => String(status).replace(/_/g, ' ');
const addOnLabel = (a) => String(typeof a === 'string' ? a : (a?.name || a?.id || ''));

function InfoTile({ icon: Icon, label, value, valueTone = 'default', extra }) {
    return (
        <View style={styles.tile}>
            <Row gap={5}>
                <Icon size={12} color={colors.brand} />
                <AppText size="xs" tone="muted">{label}</AppText>
            </Row>
            <AppText size="sm" weight="700" tone={valueTone} numberOfLines={2}>{value}</AppText>
            {extra ? <Mono size="xs" tone="muted" weight="600" numberOfLines={1}>{extra}</Mono> : null}
        </View>
    );
}

/**
 * Global digital match pass. Mounted once in the root layout; shows the booking stored in
 * `activeTicketPass` (set it with `setActiveTicketPass(booking)` from anywhere).
 */
export function TicketPassModal() {
    const { activeTicketPass, setActiveTicketPass, pricing } = useArena();
    const { venue, phoneLabel, telHref, mapsUrl, open } = useVenueContacts();
    const [copied, setCopied] = useState(''); // '' | 'code' | 'text'
    const [copyError, setCopyError] = useState('');
    const [guideOpen, setGuideOpen] = useState(false);
    const copyTimer = useRef(null);

    // Keep the last pass while the sheet slides out, so its content does not blank mid-animation
    const lastPass = useRef(null);
    if (activeTicketPass) lastPass.current = activeTicketPass;
    const b = activeTicketPass || lastPass.current || {};
    const passKey = activeTicketPass ? String(activeTicketPass.id || activeTicketPass.bookingCode || '') : '';

    useEffect(() => {
        setCopied('');
        setCopyError('');
        setGuideOpen(false);
    }, [passKey]);
    useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

    const status = b.paymentStatus || 'confirmed_unpaid';
    const header = HEADER[status] || { label: statusText(status), tone: 'neutral', icon: CheckCircle2 };
    const pay = PAY_LABEL[status] || { label: statusText(status), tone: 'neutral' };
    const total = Number(b.totalPrice ?? 0) || 0;
    const paid = Number(b.advanceAmount ?? 0) || 0;
    const due = Number(b.dueAmount ?? Math.max(0, total - paid)) || 0;
    const addOns = Array.isArray(b.addOns) ? b.addOns.map(addOnLabel).filter(Boolean) : [];
    const venueName = String(venue.businessName || 'Crossbar Metro Arena');
    const venueAddress = String(venue.address || 'Uttara, Dhaka');
    const dateLabel = isIsoDate(b.date) ? formatIsoDate(b.date) : String(b.date || '—');
    const isCancelled = status === 'cancelled';

    const shareText = `⚽ MATCH DAY PASS - ${venueName.toUpperCase()} 🏟️\n\n` +
        `Squad: ${b.teamName || '-'}\n` +
        `Court: ${b.courtName || venueName}\n` +
        `Date: ${b.date || '-'}\n` +
        `Kickoff Time: ${b.displayTime || '-'}\n` +
        `Booking Ref: ${b.bookingCode || '-'}\n` +
        `Paid: ${formatMoney(paid)} · Due at arena: ${formatMoney(due)}\n` +
        `Venue: ${venueAddress}\n\n` +
        `Be on the turf 15 minutes before kickoff for warm-up!`;

    const close = () => setActiveTicketPass(null);

    const copy = async (kind, text) => {
        setCopyError('');
        try {
            await Clipboard.setStringAsync(String(text));
            setCopied(kind);
            if (copyTimer.current) clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(''), 2500);
        } catch {
            setCopyError('Could not copy automatically. Use the share button instead.');
        }
    };
    const handleShare = () => {
        Share.share({ message: shareText }).catch(() => { /* share sheet dismissed or unavailable */ });
    };
    const handleShareWhatsApp = () => {
        // WhatsApp when it can be opened, otherwise the system share sheet
        Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`).catch(handleShare);
    };

    const HeaderIcon = header.icon;
    const guide = [
        `Show this pass on arrival at the ${venueName} reception.`,
        'Be on the turf 15 minutes before kickoff for warm-up!',
        due > 0
            ? `Pay the remaining ${formatMoney(due)} in cash / bKash at the arena desk on arrival.`
            : 'Nothing due on match day.',
        'Turf shoes (TF) or rubber molded studs (AG) required. Metal studs strictly forbidden on 50mm shock-pad turf.',
        `Cancellations are allowed up to ${Number(pricing?.cancellationHours) || 24} hours before kickoff from your Player Portal; the advance goes to the refund queue. Later than that, call the arena hotline.`
    ];

    return (
        <Sheet
            visible={!!activeTicketPass}
            onClose={close}
            title="Official Match Pass"
            subtitle={`Show this pass on arrival at the ${venueName} reception`}
            icon={Ticket}
            footer={(
                <>
                    <Button title="Share Pass with Squad" icon={MessageCircle} onPress={handleShareWhatsApp} block />
                    <Row>
                        <Button title="Share" variant="secondary" icon={Share2} onPress={handleShare} style={{ flex: 1 }} />
                        <Button
                            title={copied === 'text' ? 'Copied!' : 'Copy Text'}
                            variant={copied === 'text' ? 'outline' : 'secondary'}
                            icon={copied === 'text' ? Check : Copy}
                            onPress={() => copy('text', shareText)}
                            style={{ flex: 1 }}
                        />
                    </Row>
                </>
            )}
        >
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <CrossbarLogo size="responsive" />
                <Badge tone={header.tone} icon={HeaderIcon} label={header.label} style={{ alignSelf: 'center' }} />
            </View>

            <View style={styles.codeBox}>
                <Pressable onPress={() => (b.bookingCode ? copy('code', b.bookingCode) : null)} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel="Copy booking code">
                    <Label>Match Booking Code</Label>
                    <Row gap={spacing.sm}>
                        <Mono size="xxl" tone="brand" weight="900" numberOfLines={1} adjustsFontSizeToFit style={{ flexShrink: 1 }}>{String(b.bookingCode || '—')}</Mono>
                        {b.bookingCode ? (copied === 'code' ? <Check size={16} color={colors.brand} /> : <Copy size={15} color={colors.textMuted} />) : null}
                    </Row>
                    {b.bookingCode ? <AppText size="xxs" tone={copied === 'code' ? 'brand' : 'dim'}>{copied === 'code' ? 'Code copied' : 'Tap to copy the code'}</AppText> : null}
                </Pressable>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Label>Squad / Team</Label>
                    <AppText size="lg" weight="800" numberOfLines={2} style={{ textAlign: 'right' }}>{String(b.teamName || '—')}</AppText>
                </View>
            </View>

            <View style={styles.grid}>
                <InfoTile icon={Calendar} label="Match Date" value={dateLabel} />
                <InfoTile icon={Clock} label="Kickoff Slot" value={String(b.displayTime || '—')} valueTone="brand" />
                <InfoTile icon={Shield} label="Pitch Assigned" value={String(b.courtName || venueName)} />
                <InfoTile icon={Users} label="Captain / Contact" value={String(b.captainName || '—')} extra={b.captainPhone ? String(b.captainPhone) : ''} />
            </View>

            {addOns.length > 0 ? (
                <View style={[styles.box, { borderColor: colors.borderBrand }]}>
                    <AppText size="xs" tone="soft" weight="600">Equipment & Extras Included:</AppText>
                    <Row wrap gap={6}>
                        {addOns.map((name, i) => <Badge key={`${name}-${i}`} tone="brand" label={name} />)}
                    </Row>
                </View>
            ) : null}

            <View style={styles.box}>
                <Row justify="space-between">
                    <AppText size="sm" tone="muted" style={{ flexShrink: 1 }}>
                        {'Total Slot Fee: '}
                        <Mono size="md" tone="white">{formatMoney(total)}</Mono>
                    </AppText>
                    <Badge tone={pay.tone} label={pay.label} />
                </Row>
                <Divider style={{ marginVertical: 4 }} />
                <Row justify="space-between">
                    <AppText size="xs" tone="muted">
                        {'Paid: '}
                        <Mono size="xs" tone="brand">{formatMoney(paid)}</Mono>
                    </AppText>
                    <AppText size="xs" tone="muted">
                        {'Due at arena: '}
                        <Mono size="xs" tone={due > 0 ? 'warning' : 'brand'}>{formatMoney(due)}</Mono>
                    </AppText>
                </Row>
            </View>

            <View style={styles.box}>
                <Pressable onPress={() => open(mapsUrl)} style={styles.venueRow} accessibilityRole="link" accessibilityLabel="Open the arena in maps">
                    <MapPin size={16} color={colors.brand} style={{ marginTop: 2 }} />
                    <AppText size="xs" tone="muted" style={{ flex: 1 }}>
                        <AppText size="xs" weight="800" tone="soft">{`${venueName}: `}</AppText>
                        {venueAddress}
                    </AppText>
                </Pressable>
                {phoneLabel ? (
                    <Pressable onPress={() => open(telHref)} style={styles.venueRow} accessibilityRole="link" accessibilityLabel="Call the arena hotline">
                        <Phone size={15} color={colors.brand} style={{ marginTop: 1 }} />
                        <AppText size="xs" tone="muted" style={{ flex: 1 }}>{`Hotline: ${phoneLabel}`}</AppText>
                    </Pressable>
                ) : null}
            </View>

            {!isCancelled ? (
                <View style={styles.box}>
                    <Pressable onPress={() => setGuideOpen(v => !v)} style={styles.guideHead} accessibilityRole="button" accessibilityState={{ expanded: guideOpen }}>
                        <ListChecks size={15} color={colors.brand} />
                        <AppText size="sm" weight="800" style={{ flex: 1 }}>Match day guide</AppText>
                        {guideOpen ? <ChevronUp size={16} color={colors.textDim} /> : <ChevronDown size={16} color={colors.textDim} />}
                    </Pressable>
                    {guideOpen ? guide.map((line, i) => (
                        <Row key={line} align="flex-start" gap={spacing.sm}>
                            <Mono size="xs" tone="brand">{`${i + 1}.`}</Mono>
                            <AppText size="xs" tone="soft" style={{ flex: 1 }}>{line}</AppText>
                        </Row>
                    )) : null}
                </View>
            ) : null}

            {copyError ? <AppText size="xs" tone="danger">{copyError}</AppText> : null}
        </Sheet>
    );
}

const styles = StyleSheet.create({
    codeBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.glass },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { flexBasis: '47%', flexGrow: 1, gap: 3, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    box: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    venueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    guideHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }
});
