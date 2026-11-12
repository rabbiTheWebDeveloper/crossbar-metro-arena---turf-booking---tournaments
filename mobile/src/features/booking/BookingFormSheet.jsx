import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Phone, User, Users, Timer, Check, ArrowRight } from 'lucide-react-native';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { BOOKING_ADDONS } from '@/data/initialData';
import { Sheet, Input, Select, Button, Notice, Row, AppText, Label, Mono, Divider, KeyValue } from '@/components/ui';
import { colors, radius, spacing, tones } from '@/theme';
import { formatIsoDate, BD_PHONE_REGEX } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';
import { PRIMARY_COURT, MATCH_TYPES, advanceSetting, holdMinutesSetting, formatTimer } from './slots';

const NOTES_MAX = 300;

/** Selectable payment option card with a radio marker. */
function PaymentOption({ selected, title, amount, description, onPress }) {
    return (
        <Pressable onPress={onPress} style={[styles.option, selected ? styles.optionSelected : { opacity: 0.8 }]} accessibilityRole="radio" accessibilityState={{ selected }}>
            <Row justify="space-between">
                <AppText size="sm" weight="800" upper style={{ flex: 1 }}>{title}</AppText>
                <View style={[styles.radio, selected ? { borderColor: colors.brand, backgroundColor: colors.brand } : null]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                </View>
            </Row>
            <Mono size="xl" tone="brand" weight="900">{amount}</Mono>
            {description}
        </Pressable>
    );
}

/**
 * Step 1 of the public online booking: squad details, add-ons and the payment option.
 * It hands a contract-shaped draft to the /payment screen, which starts the server-priced
 * payment. No prices are ever sent to the server from here.
 *
 * Mount it only while a slot is selected (state is initialised from the slot on mount):
 *   {slot ? <BookingFormSheet key={slot.id} slot={slot} selectedDate={date} onClose={...} /> : null}
 */
export function BookingFormSheet({ slot, selectedDate, onClose }) {
    const router = useRouter();
    const { handlePlaceSlotHold, handleReleaseSlotHold, currentUser, isVisitor, pricing, teams, setPendingBookingData } = useArena();
    const court = PRIMARY_COURT;

    const captainTeams = useMemo(() => {
        if (!currentUser || currentUser.role !== 'player') return [];
        const myPhone = cleanPhone(currentUser.phone);
        return (teams || []).filter(t => (t.captainPhone && cleanPhone(t.captainPhone) === myPhone) || t.captainId === currentUser.id || t.captainName === currentUser.name);
    }, [currentUser, teams]);

    const [captainName, setCaptainName] = useState(!isVisitor ? (currentUser?.name || '') : '');
    const [captainPhone, setCaptainPhone] = useState(!isVisitor ? (currentUser?.phone || '') : '');
    const [teamName, setTeamName] = useState(captainTeams[0]?.name || '');
    const [matchType, setMatchType] = useState('friendly');
    const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
    const [paymentChoice, setPaymentChoice] = useState('advance_500');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Local (cosmetic) hold countdown; the real hold is created server-side when payment starts
    const holdMinutes = holdMinutesSetting(pricing);
    const [secondsRemaining, setSecondsRemaining] = useState(holdMinutes * 60);

    // Place the local hold once per slot/date (not on every team-name keystroke)
    useEffect(() => {
        handlePlaceSlotHold(court.id, selectedDate, slot.slotNumber, 'Holding player');
        const deadline = Date.now() + holdMinutes * 60 * 1000;
        const countdown = setInterval(() => {
            const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
            setSecondsRemaining(left);
            if (left <= 0) {
                clearInterval(countdown);
                handleReleaseSlotHold(court.id, selectedDate, slot.slotNumber);
            }
        }, 1000);
        return () => clearInterval(countdown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [court.id, selectedDate, slot.slotNumber]);

    // Price preview (same rules the server applies; the server recomputes before payment)
    const advance = advanceSetting(pricing);
    const courtPrice = Number(slot.price) || 0;
    const selectedAddOns = BOOKING_ADDONS.filter(a => selectedAddOnIds.includes(a.id));
    const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
    const totalPrice = courtPrice + addOnsTotal;
    const advanceOnly = Math.min(advance, totalPrice);
    const advanceAmount = paymentChoice === 'advance_500' ? advanceOnly : totalPrice;
    const dueAmount = Math.max(0, totalPrice - advanceAmount);
    const expired = secondsRemaining <= 0;
    const timerTone = secondsRemaining < 120 ? tones.danger : tones.brand;

    const toggleAddOn = (addon) => {
        setSelectedAddOnIds(prev => (prev.includes(addon.id) ? prev.filter(id => id !== addon.id) : [...prev, addon.id]));
    };

    const handleClose = () => {
        handleReleaseSlotHold(court.id, selectedDate, slot.slotNumber);
        onClose();
    };

    const handleSubmit = () => {
        if (isSubmitting) return;
        if (expired) {
            setError(`Your ${holdMinutes}-minute hold has expired. Please close this window and select the slot again.`);
            return;
        }
        if (!captainName.trim()) { setError('Please provide the captain or squad representative name.'); return; }
        const phone = cleanPhone(captainPhone);
        if (!BD_PHONE_REGEX.test(phone)) { setError('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01711223344).'); return; }
        if (!teamName.trim()) { setError('Please specify your squad or team name.'); return; }
        setError('');
        setIsSubmitting(true);

        const pendingBooking = {
            date: selectedDate,
            slotNumber: slot.slotNumber,
            captainName: captainName.trim(),
            captainPhone: phone,
            teamName: teamName.trim(),
            playerCount: 14,
            matchType,
            addOns: selectedAddOnIds,
            paymentType: paymentChoice,
            notes: notes.trim()
        };
        // Keep the local hold (now under the squad's name): the payment screen releases it if the customer backs out.
        handlePlaceSlotHold(court.id, selectedDate, slot.slotNumber, pendingBooking.teamName);
        setPendingBookingData(pendingBooking);
        onClose();
        // Navigate once the draft is committed to the store, so /payment always finds it
        setTimeout(() => router.push('/payment'), 0);
    };

    return (
        <Sheet
            visible
            onClose={handleClose}
            title={slot.displayTime}
            subtitle={`Slot #${slot.slotNumber} · ${String(slot.period || '').toUpperCase()} · ${court.name}`}
            full
            footer={(
                <Button
                    title={expired ? 'Hold expired' : `Continue to payment (${formatMoney(advanceAmount)})`}
                    iconRight={ArrowRight}
                    size="lg"
                    block
                    disabled={isSubmitting || expired}
                    onPress={handleSubmit}
                />
            )}
        >
            <Row justify="space-between">
                <AppText size="sm" tone="soft" style={{ flex: 1 }}>
                    {'Match date: '}
                    <AppText size="sm" weight="800">{formatIsoDate(selectedDate)}</AppText>
                </AppText>
                <View style={[styles.timer, { backgroundColor: timerTone.bg, borderColor: timerTone.border }]} accessibilityLabel="Time left to complete your details">
                    <Timer size={13} color={timerTone.fg} />
                    <Mono size="sm" tone={timerTone.fg}>{formatTimer(secondsRemaining)}</Mono>
                </View>
            </Row>

            {error ? <Notice type="error" message={error} /> : null}

            {/* 1. Captain & team */}
            <Label tone="brand">1. Squad & Captain Information</Label>
            <Input label="Captain / Booker Name" required icon={User} placeholder="e.g. Siam Chowdhury" value={captainName} onChangeText={setCaptainName} autoCapitalize="words" maxLength={60} />
            <Input label="Bangladeshi Mobile" required icon={Phone} type="phone" placeholder="01XXXXXXXXX" value={captainPhone} onChangeText={setCaptainPhone} maxLength={16} hint="Used to look up your booking and ticket pass." />
            <View style={{ gap: 6 }}>
                <Input label="Squad / Team Name" required icon={Users} placeholder="e.g. Uttara Metro FC" value={teamName} onChangeText={setTeamName} autoCapitalize="words" maxLength={60} />
                {captainTeams.length > 0 ? (
                    <Row wrap gap={spacing.sm}>
                        <AppText size="xs" tone="muted">Quick select:</AppText>
                        {captainTeams.map(t => (
                            <Pressable key={t.id} onPress={() => setTeamName(t.name)} hitSlop={6}>
                                <AppText size="xs" tone="brand" weight="800">{t.name}</AppText>
                            </Pressable>
                        ))}
                    </Row>
                ) : null}
            </View>
            <Select label="Match Category" value={matchType} onChange={setMatchType} options={MATCH_TYPES} />

            <Divider style={{ marginVertical: 4 }} />

            {/* 2. Add-ons */}
            <Label tone="brand">2. Optional Turf Equipment Add-Ons</Label>
            {BOOKING_ADDONS.map((addon) => {
                const selected = selectedAddOnIds.includes(addon.id);
                return (
                    <Pressable key={addon.id} onPress={() => toggleAddOn(addon)} style={[styles.option, styles.addon, selected ? styles.optionSelected : null]} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}>
                        <View style={{ flex: 1 }}>
                            <AppText size="sm" weight="800">{addon.name}</AppText>
                            <AppText size="xs" tone="muted">{addon.description}</AppText>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Mono size="sm" tone="brand">{`+${formatMoney(addon.price)}`}</Mono>
                            <View style={[styles.check, selected ? { backgroundColor: colors.brand, borderColor: colors.brand } : null]}>
                                {selected ? <Check size={12} color={colors.onBrand} strokeWidth={3.2} /> : null}
                            </View>
                        </View>
                    </Pressable>
                );
            })}

            <Divider style={{ marginVertical: 4 }} />

            {/* 3. Payment option */}
            <Label tone="brand">3. Payment Option (bKash / Nagad / Cards via SSLCommerz)</Label>
            <PaymentOption
                selected={paymentChoice === 'advance_500'}
                title={`Pay ${formatMoney(advance)} advance`}
                amount={formatMoney(advanceOnly)}
                onPress={() => setPaymentChoice('advance_500')}
                description={(
                    <AppText size="xs" tone="soft">
                        {'Pay the remaining '}
                        <Mono size="xs" tone="white">{formatMoney(Math.max(0, totalPrice - advanceOnly))}</Mono>
                        {' in cash / bKash at the arena desk on arrival.'}
                    </AppText>
                )}
            />
            <PaymentOption
                selected={paymentChoice === 'full_payment'}
                title="100% full payment"
                amount={formatMoney(totalPrice)}
                onPress={() => setPaymentChoice('full_payment')}
                description={<AppText size="xs" tone="soft">Clear everything online. Nothing due on match day.</AppText>}
            />

            {/* Price breakdown */}
            <View style={styles.breakdown}>
                <KeyValue label={`Slot price (${slot.displayTime})`} value={formatMoney(courtPrice)} mono />
                {selectedAddOns.map(a => <KeyValue key={a.id} label={`+ ${a.name}`} value={formatMoney(a.price)} mono tone="muted" />)}
                <Divider style={{ marginVertical: 4 }} />
                <KeyValue label="Total" value={formatMoney(totalPrice)} mono bold />
                <KeyValue label="Pay online now" value={formatMoney(advanceAmount)} mono bold tone="brand" />
                <KeyValue label="Due at the arena" value={formatMoney(dueAmount)} mono tone="muted" />
                <AppText size="xs" tone="dim" style={{ marginTop: 4 }}>The final amount is confirmed by the arena server on the next step before you are sent to SSLCommerz.</AppText>
            </View>

            {/* Notes */}
            <Input
                label="Notes for the arena desk (optional)"
                multiline
                value={notes}
                onChangeText={(text) => setNotes(String(text).slice(0, NOTES_MAX))}
                maxLength={NOTES_MAX}
                placeholder="e.g. We need 2 extra bibs sets, arriving 10 min early"
            />

            {/* Cancellation policy */}
            <View style={styles.breakdown}>
                <Row gap={6}>
                    <Shield size={14} color={colors.brand} />
                    <AppText size="sm" weight="800">Arena Cancellation Policy</AppText>
                </Row>
                <AppText size="xs" tone="muted">
                    {'Cancellations are allowed up to '}
                    <AppText size="xs" weight="800" tone="soft">{`${Number(pricing.cancellationHours) || 24} hours`}</AppText>
                    {' before kickoff from your Player Portal; the advance goes to the refund queue. Later than that, call the arena hotline.'}
                </AppText>
            </View>
        </Sheet>
    );
}

const styles = StyleSheet.create({
    timer: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1 },
    option: { gap: 4, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    optionSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
    addon: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onBrand },
    check: { width: 18, height: 18, borderRadius: 6, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    breakdown: { gap: 2, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
