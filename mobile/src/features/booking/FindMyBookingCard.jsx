import React, { useState } from 'react';
import { Search, Ticket } from 'lucide-react-native';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { Card, Input, Button, Notice, Row, Label, AppText } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { BD_PHONE_REGEX } from '@/lib/dateUtils';

/** Booking code + phone -> opens the ticket pass when the phone matches the captain's. */
export function FindMyBookingCard() {
    const { lookupBooking, setActiveTicketPass, showNotice } = useArena();
    const [code, setCode] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        const c = code.trim().toUpperCase();
        const p = cleanPhone(phone);
        if (!c) { setError('Enter your booking code (e.g. CMA-XXXXXX).'); return; }
        if (!BD_PHONE_REGEX.test(p)) { setError('Enter the 11-digit mobile number used for the booking.'); return; }
        setError('');
        setIsSubmitting(true);
        const r = await lookupBooking(c, p);
        setIsSubmitting(false);
        if (!r.ok) { setError(r.error || 'Booking not found.'); return; }
        const b = r.booking;
        if (!b || b.isPublicView || !b.captainName) {
            setError('No booking matches that code and phone number. Check both and try again.');
            return;
        }
        setActiveTicketPass(b);
        showNotice('success', `Booking ${b.bookingCode} found`);
    };

    return (
        <Card>
            <Row gap={6} style={{ marginBottom: 4 }}>
                <Search size={15} color={colors.brand} />
                <Label tone="brand">Find my booking</Label>
            </Row>
            <AppText size="xs" tone="muted" style={{ marginBottom: 12 }}>Enter the booking code and the mobile number used for the booking to open your ticket pass.</AppText>
            <Input
                label="Booking code"
                value={code}
                onChangeText={setCode}
                placeholder="CMA-XXXXXX"
                autoCapitalize="characters"
                maxLength={24}
                inputStyle={{ fontFamily: fonts.mono }}
                style={{ marginBottom: 12 }}
            />
            <Input
                label="Mobile number used"
                type="phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="01XXXXXXXXX"
                maxLength={16}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={{ marginBottom: 12 }}
            />
            {error ? <Notice type="error" message={error} style={{ marginBottom: 12 }} /> : null}
            <Button title="Open ticket pass" icon={Ticket} loading={isSubmitting} onPress={handleSubmit} block />
        </Card>
    );
}
