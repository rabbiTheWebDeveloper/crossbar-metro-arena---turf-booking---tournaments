import React, { useState } from 'react';
import { Search, Phone, Hash } from 'lucide-react-native';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { Card, Input, Button, Notice, SectionHeader } from '@/components/ui';
import { fonts, spacing } from '@/theme';
import { PHONE_RE } from '@/features/auth/constants';

/**
 * "Find my booking": open a match pass with the booking code and the phone number the slot was
 * booked with (for guests, or bookings made under another number).
 */
export function FindBookingCard({ title = 'Find my booking', subtitle = 'Enter the booking code from your confirmation and the mobile number used for the booking.' }) {
    const { lookupBooking, setActiveTicketPass } = useArena();
    const [code, setCode] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [searching, setSearching] = useState(false);

    const submit = async () => {
        if (searching) return;
        setError('');
        const bookingCode = code.trim().toUpperCase();
        if (!bookingCode) { setError('Enter your booking code.'); return; }
        const digits = cleanPhone(phone);
        if (!PHONE_RE.test(digits)) { setError('Enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).'); return; }
        setSearching(true);
        const r = await lookupBooking(bookingCode, digits);
        setSearching(false);
        if (!r?.ok || !r.booking) { setError(r?.error || 'Booking not found. Check the code and try again.'); return; }
        if (r.booking.isPublicView) { setError('That mobile number does not match this booking. Use the number the slot was booked with.'); return; }
        setActiveTicketPass(r.booking);
    };

    return (
        <Card style={{ gap: spacing.md }}>
            <SectionHeader title={title} subtitle={subtitle} style={{ marginBottom: 0 }} />
            {error ? <Notice type="error" message={error} /> : null}
            <Input label="Booking code" icon={Hash} placeholder="e.g. CMA-AB12CD" value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={24} inputStyle={{ fontFamily: fonts.mono }} returnKeyType="next" />
            <Input label="Mobile Number" icon={Phone} type="phone" placeholder="01XXXXXXXXX" value={phone} onChangeText={setPhone} maxLength={16} inputStyle={{ fontFamily: fonts.mono }} returnKeyType="search" onSubmitEditing={submit} />
            <Button title={searching ? 'Searching…' : 'Open my pass'} icon={Search} block loading={searching} onPress={submit} />
        </Card>
    );
}
