import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Trophy, Shield, Users, DollarSign, CheckCircle2, Copy } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Button, Notice, Row, AppText, Heading, Mono, Label, Badge, KeyValue, Divider } from '@/components/ui';
import { colors, radius, spacing, tones, fonts } from '@/theme';
import { formatMoney } from '@/lib/format';
import { formatIsoDate, isIsoDate } from '@/lib/dateUtils';
import { cleanPhone } from '@/lib/phone';
import { PAYMENT_OPTIONS, MIN_PLAYERS, MAX_PLAYERS, parsePlayers, paymentLabel } from './tournamentUtils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROSTER_PLACEHOLDER = 'Player name (GK)\nPlayer name (CB - Captain)\nPlayer name (CM)\nPlayer name (LW)\nPlayer name (ST)';

/** Short reference shown to the captain (the API has no separate code: this is the tail of the registration id). */
export const registrationReference = (registration) => String(registration?.id || '').slice(-8).toUpperCase();

function SectionTitle({ icon: Icon, tone = colors.brand, children, right }) {
    return (
        <Row justify="space-between">
            <Row gap={6} style={{ flex: 1 }}>
                <Icon size={15} color={tone} />
                {children}
            </Row>
            {right}
        </Row>
    );
}

function InfoCell({ label, value, tone = 'default', mono }) {
    return (
        <View style={styles.infoCell}>
            <AppText size="xxs" tone="muted" upper>{label}</AppText>
            <AppText size="sm" weight="800" tone={tone} mono={mono} numberOfLines={2}>{value}</AppText>
        </View>
    );
}

/**
 * Tournament team registration: team & captain, squad roster (one player per line) and the
 * entry-fee payment details (bKash / Nagad / bank transaction id, or pay at the turf).
 *   onRegister(payload) must resolve to the handler result `{ ok, registration?, message?, error? }`.
 * After a successful submission the sheet switches to a confirmation with the registration reference.
 */
export function TournamentRegistrationSheet({ visible, tournament, onClose, onRegister }) {
    const { currentUser, isVisitor, siteSettings, showNotice } = useArena();
    const t = tournament || {};

    const [teamName, setTeamName] = useState('');
    const [captainName, setCaptainName] = useState('');
    const [captainPhone, setCaptainPhone] = useState('');
    const [captainEmail, setCaptainEmail] = useState('');
    const [jerseyColor, setJerseyColor] = useState('');
    const [playersText, setPlayersText] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bkash');
    const [transactionId, setTransactionId] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(null); // { registration, message }

    const userName = isVisitor ? '' : (currentUser?.name || '');
    const userPhone = isVisitor ? '' : (currentUser?.phone || '');

    // Fresh form each time the sheet opens (captain details come from the signed-in account)
    useEffect(() => {
        if (!visible) return;
        setTeamName(''); setCaptainName(userName); setCaptainPhone(userPhone); setCaptainEmail(''); setJerseyColor('');
        setPlayersText(''); setPaymentMethod('bkash'); setTransactionId(''); setError(''); setSuccess(null);
    }, [visible, t.id, userName, userPhone]);

    const playerList = parsePlayers(playersText);
    const max = Number(t.maxTeams) || 0;
    const spotsLeft = Math.max(0, max - (Number(t.registeredCount) || 0));
    const needsTrx = paymentMethod !== 'pay_at_turf';
    const entryFee = formatMoney(t.entryFee);
    const rosterOk = playerList.length >= MIN_PLAYERS && playerList.length <= MAX_PLAYERS;
    const deadline = isIsoDate(t.registrationDeadline) ? formatIsoDate(t.registrationDeadline) : String(t.registrationDeadline || 'Until full');

    const submit = async () => {
        if (isSubmitting) return;
        if (!teamName.trim()) { setError('Please provide your team name.'); return; }
        if (!captainName.trim()) { setError('Please provide the captain name.'); return; }
        const digits = cleanPhone(captainPhone);
        if (!/^01[3-9]\d{8}$/.test(digits)) { setError('Please provide a valid 11-digit Bangladeshi mobile number for the captain.'); return; }
        if (captainEmail.trim() && !EMAIL_RE.test(captainEmail.trim())) { setError('That email address does not look valid. Leave it blank if you prefer.'); return; }
        if (playerList.length < MIN_PLAYERS) { setError(`Please list at least ${MIN_PLAYERS} squad players (one per line).`); return; }
        if (playerList.length > MAX_PLAYERS) { setError(`A squad can have at most ${MAX_PLAYERS} players. You listed ${playerList.length}.`); return; }
        setError('');
        setIsSubmitting(true);
        const payload = {
            tournamentId: t.id,
            tournamentTitle: t.title,
            teamName: teamName.trim(),
            captainName: captainName.trim(),
            captainPhone: digits,
            captainEmail: captainEmail.trim(),
            jerseyColor: jerseyColor.trim(),
            playersList: playerList,
            paymentMethod,
            transactionId: transactionId.trim() || undefined
        };
        try {
            const result = await onRegister(payload);
            if (result && result.ok) setSuccess({ registration: result.registration || payload, message: result.message });
            else setError((result && result.error) || 'Registration could not be submitted. Please try again.');
        } catch {
            setError('Registration could not be submitted. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyReference = async (ref) => {
        try {
            await Clipboard.setStringAsync(ref);
            showNotice('success', 'Registration reference copied.');
        } catch {
            showNotice('error', 'Could not copy the reference.');
        }
    };

    const subtitle = [t.edition, t.dates, `Prize: ${formatMoney(t.prizePool)}`].filter(Boolean).join(' · ');

    if (success) {
        const reg = success.registration || {};
        const ref = registrationReference(reg);
        return (
            <Sheet visible={visible} onClose={onClose} title={t.title || 'Tournament Registration'} subtitle="Tournament Registration" icon={Trophy} footer={<Button title="Done" block onPress={onClose} />}>
                <View style={{ alignItems: 'center', gap: spacing.sm }}>
                    <View style={styles.successIcon}>
                        <CheckCircle2 size={30} color={colors.brand} />
                    </View>
                    <Heading level={2} center>Registration received</Heading>
                    <AppText size="sm" tone="soft" center>
                        {success.message || `Team ${reg.teamName || teamName.trim()} has been entered into ${reg.tournamentTitle || t.title}. The match committee will confirm your spot after checking the entry fee.`}
                    </AppText>
                </View>

                {ref ? (
                    <Pressable onPress={() => copyReference(ref)} style={styles.refBox} accessibilityRole="button" accessibilityLabel="Copy registration reference">
                        <View style={{ flex: 1 }}>
                            <Label tone="brand">Registration reference</Label>
                            <Mono size="xl" weight="900" style={{ letterSpacing: 2 }}>{ref}</Mono>
                        </View>
                        <Copy size={18} color={colors.brand} />
                    </Pressable>
                ) : null}

                <View style={styles.summary}>
                    <KeyValue label="Tournament" value={String(reg.tournamentTitle || t.title || '')} bold />
                    <KeyValue label="Team" value={String(reg.teamName || '')} bold />
                    <KeyValue label="Captain" value={`${reg.captainName || ''} · ${reg.captainPhone || ''}`} />
                    <KeyValue label="Squad" value={`${Number(reg.playerCount) || (reg.playersList || []).length} players`} />
                    <KeyValue label="Entry fee" value={formatMoney(reg.amount ?? t.entryFee)} mono bold />
                    <KeyValue label="Payment" value={paymentLabel(reg.paymentMethod)} />
                    {reg.transactionId ? <KeyValue label="Transaction ID" value={String(reg.transactionId)} mono /> : null}
                    <Divider style={{ marginVertical: 6 }} />
                    <KeyValue label="Status" value={<Badge tone={reg.status === 'confirmed' ? 'success' : 'warning'} label={reg.status === 'confirmed' ? 'Confirmed' : 'Pending verification'} />} />
                </View>

                <AppText size="xs" tone="dim" center>
                    {reg.paymentMethod === 'pay_at_turf'
                        ? 'Bring the entry fee to the arena desk before the deadline. Your spot stays pending until it is paid.'
                        : 'Your spot is confirmed once the desk verifies the payment.'}
                </AppText>
            </Sheet>
        );
    }

    return (
        <Sheet
            visible={visible}
            onClose={onClose}
            dismissable={!isSubmitting}
            full
            title={t.title || 'Tournament Registration'}
            subtitle={subtitle}
            icon={Trophy}
            footer={(
                <Row>
                    <Button title="Back" variant="secondary" onPress={onClose} disabled={isSubmitting} style={{ flex: 1 }} />
                    <Button title={isSubmitting ? 'Submitting...' : `Register Squad (${entryFee})`} loading={isSubmitting} onPress={submit} style={{ flex: 2.4 }} />
                </Row>
            )}
        >
            <View style={styles.infoGrid}>
                <InfoCell label="Format" value={String(t.format || '-')} />
                <InfoCell label="Entry Fee" value={entryFee} tone="warning" mono />
                <InfoCell label="Spots Left" value={max > 0 ? `${spotsLeft} open` : 'Open entry'} tone="brand" />
                <InfoCell label="Deadline" value={deadline} tone="soft" />
            </View>

            <SectionTitle icon={Shield}>
                <Label tone="soft">Team & Captain</Label>
            </SectionTitle>
            <Input label="Team name" required maxLength={60} placeholder="e.g. Uttara Thunderbolts FC" value={teamName} onChangeText={setTeamName} autoCapitalize="words" />
            <Input label="Captain / manager name" required maxLength={60} placeholder="Full name" value={captainName} onChangeText={setCaptainName} autoCapitalize="words" />
            <Input label="Captain WhatsApp / mobile" required type="phone" maxLength={16} placeholder="01XXXXXXXXX" value={captainPhone} onChangeText={setCaptainPhone} />
            <Input label="Captain email (optional)" type="email" placeholder="name@example.com" value={captainEmail} onChangeText={setCaptainEmail} />
            <Input label="Team kit / jersey colour" maxLength={40} placeholder="e.g. Green & Black" value={jerseyColor} onChangeText={setJerseyColor} />

            <SectionTitle icon={Users} right={<Mono size="xs" tone={rosterOk ? 'brand' : 'muted'} weight="600">{`${playerList.length} / ${MAX_PLAYERS} · min ${MIN_PLAYERS}`}</Mono>}>
                <Label tone="soft" style={{ flex: 1 }}>Squad Roster (one player per line) *</Label>
            </SectionTitle>
            <Input multiline placeholder={ROSTER_PLACEHOLDER} value={playersText} onChangeText={setPlayersText} autoCapitalize="words" inputStyle={styles.roster} />
            {playerList.length > 0 ? (
                <Row wrap gap={6}>
                    {playerList.map((p, i) => (
                        <View key={`${i}-${p}`} style={[styles.playerPill, i >= MAX_PLAYERS ? { borderColor: tones.danger.border, backgroundColor: tones.danger.bg } : null]}>
                            <AppText size="xs" tone="soft" numberOfLines={1}>{`${i + 1}. ${p}`}</AppText>
                        </View>
                    ))}
                </Row>
            ) : null}

            <SectionTitle icon={DollarSign} tone={colors.warning}>
                <Label tone="soft">{`Entry Fee (${entryFee})`}</Label>
            </SectionTitle>
            <View style={styles.payGrid} accessibilityRole="radiogroup" accessibilityLabel="Payment method">
                {PAYMENT_OPTIONS.map(opt => {
                    const active = paymentMethod === opt.value;
                    const accent = opt.color || colors.brand;
                    return (
                        <Pressable
                            key={opt.value}
                            onPress={() => setPaymentMethod(opt.value)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: active }}
                            style={[styles.payTile, active ? { borderColor: accent, backgroundColor: opt.color ? `${opt.color}33` : colors.brandSoft } : null]}
                        >
                            <AppText size="sm" weight="800" style={{ color: opt.color || colors.text }}>{opt.title}</AppText>
                            <AppText size="xxs" tone="muted">{opt.sub}</AppText>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.payInfo}>
                {needsTrx ? (
                    <AppText size="xs" tone="soft">
                        <AppText size="xs" tone="warning" weight="700">{'Arena payment number: '}</AppText>
                        <AppText size="xs" weight="800">{String(siteSettings?.phoneFormatted || siteSettings?.phone || '')}</AppText>
                        {'. Send the entry fee with your team name in the reference, then enter the transaction ID below. Your spot is confirmed once the desk verifies the payment.'}
                    </AppText>
                ) : (
                    <AppText size="xs" tone="soft">
                        <AppText size="xs" tone="brand" weight="700">{'Pay at the turf: '}</AppText>
                        {'bring the entry fee to the arena desk before the deadline. Your spot stays pending until it is paid.'}
                    </AppText>
                )}
                <Input
                    maxLength={60}
                    placeholder={needsTrx ? 'Transaction ID / TrxID' : 'Transaction ID (optional)'}
                    value={transactionId}
                    onChangeText={setTransactionId}
                    autoCapitalize="characters"
                    inputStyle={{ fontFamily: fonts.mono }}
                />
            </View>

            {error ? <Notice type="error" message={error} /> : null}
        </Sheet>
    );
}

const styles = StyleSheet.create({
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    infoCell: { flexBasis: '46%', flexGrow: 1, gap: 2 },
    roster: { minHeight: 120, fontFamily: fonts.mono, fontSize: 13 },
    playerPill: { maxWidth: '100%', paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    payGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    payTile: { flexBasis: '46%', flexGrow: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    payInfo: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    successIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand },
    refBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderBrand, backgroundColor: colors.brandSoft },
    summary: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
