import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Zap, Clock, Shield, Calendar, Search } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Screen, IconButton, Segmented, AppText, Notice } from '@/components/ui';
import { spacing } from '@/theme';
import { addDaysIso, isWeekendDate, weekendDaysLabel, formatIsoDate } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/format';
import { BOOKING_FAQ } from '@/data/faq';
import { PageIntro } from '@/features/venue/PageIntro';
import { FaqList } from '@/features/venue/FaqList';
import { WeatherWidget } from '@/features/home/WeatherWidget';
import { buildDaySlots, useDhakaClock, bookingWindowDays, advanceSetting } from '@/features/booking/slots';
import { RefreshIndicator } from '@/features/booking/RefreshIndicator';
import { BookingDatePicker } from '@/features/booking/BookingDatePicker';
import { SlotCard } from '@/features/booking/SlotCard';
import { BookingFormSheet } from '@/features/booking/BookingFormSheet';
import { FindMyBookingCard } from '@/features/booking/FindMyBookingCard';
import { BookingRules } from '@/features/booking/BookingRules';
import { PaymentReturnBanner } from '@/features/booking/PaymentReturnBanner';

const PERIOD_TABS = [
    { value: 'all', label: 'All 12 Slots' },
    { value: 'morning', label: 'Morning (Slots 1-4)' },
    { value: 'afternoon', label: 'Afternoon (Slots 5-8)' },
    { value: 'evening', label: 'Night Prime (Slots 9-12)' }
];

const firstParam = (value) => String((Array.isArray(value) ? value[0] : value) || '');

/** Book a Slot: date picker, the live 12-slot grid, booking lookup, weather, rules and FAQ. */
export default function BookingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { bookings, pricing, slotHolds, currentUser, refreshBookings, showNotice, loadError } = useArena();

    // Booking window (Dhaka calendar)
    const { today, nowMinutes } = useDhakaClock();
    const windowDays = bookingWindowDays(pricing);
    const maxDate = useMemo(() => addDaysIso(today, windowDays), [today, windowDays]);
    const advance = formatMoney(advanceSetting(pricing));
    const weekendLabel = weekendDaysLabel(pricing.weekendDays);

    const [pickedDate, setPickedDate] = useState(today);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [slotForBooking, setSlotForBooking] = useState(null);
    const [gatewayResult, setGatewayResult] = useState(null);
    const scrollRef = useRef(null);
    const findBookingY = useRef(0);

    // Keep the selection inside the window when the day rolls over while the app stays open
    const selectedDate = pickedDate < today ? today : (pickedDate > maxDate ? maxDate : pickedDate);
    const isWeekendSelected = isWeekendDate(selectedDate, pricing.weekendDays);

    const selectDate = useCallback((iso) => {
        if (!iso || iso < today || iso > maxDate) return;
        setPickedDate(iso);
    }, [today, maxDate]);

    // A gateway result delivered as route params: capture it once, then clean the params
    const paymentParam = firstParam(params.payment);
    const bookingCodeParam = firstParam(params.bookingCode);
    const tranIdParam = firstParam(params.tranId);
    const reasonParam = firstParam(params.reason);
    useEffect(() => {
        if (!paymentParam) return;
        setGatewayResult({ payment: paymentParam, bookingCode: bookingCodeParam, tranId: tranIdParam, reason: reasonParam });
        router.setParams({ payment: undefined, bookingCode: undefined, tranId: undefined, reason: undefined });
    }, [paymentParam, bookingCodeParam, tranIdParam, reasonParam, router]);

    // The 12 slots for the chosen day
    const slots = useMemo(
        () => buildDaySlots({ date: selectedDate, bookings, slotHolds, pricing, today, nowMinutes }),
        [selectedDate, bookings, slotHolds, pricing, today, nowMinutes]
    );
    const filteredSlots = useMemo(() => (selectedPeriod === 'all' ? slots : slots.filter(s => s.period === selectedPeriod)), [slots, selectedPeriod]);
    const availableCount = slots.filter(s => s.status === 'available').length;
    const rateLabel = isWeekendSelected ? `Weekend rate (${weekendLabel})` : 'Weekday rate';

    const handleSlotClick = (slot) => {
        if (slot.status !== 'available') return;
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'investor')) {
            showNotice('info', `${currentUser.role === 'admin' ? 'Admins' : 'Investors'} cannot book online from this account. Admins add bookings from the Schedule tab instead.`);
            return;
        }
        setSlotForBooking(slot);
    };

    const scrollToFindBooking = () => {
        if (scrollRef.current) scrollRef.current.scrollTo({ y: Math.max(0, findBookingY.current - spacing.md), animated: true });
    };

    return (
        <>
            <Screen
                tab
                title="Book a Slot"
                subtitle="12 slots daily · 90 minutes each"
                scrollRef={scrollRef}
                right={<IconButton icon={Search} onPress={scrollToFindBooking} accessibilityLabel="Find my booking" />}
            >
                {loadError ? <Notice type="error" message={loadError} /> : null}

                <PageIntro
                    eyebrow="Official Crossbar Booking Engine"
                    eyebrowIcon={Zap}
                    title="Reserve Your"
                    highlight="90-Min Turf Slot"
                    description={`12 slots daily, 90 minutes each, from 6 AM to 12 AM. Pick any date up to ${windowDays} days ahead. Pay online with bKash, Nagad, or card via SSLCommerz (${advance} advance or full).`}
                    stats={[
                        { label: 'Schedule', value: '12 Slots / Day', icon: Clock },
                        { label: 'Match Time', value: '90 Mins', icon: Zap },
                        { label: 'Advance Window', value: `Up to ${windowDays} Days`, icon: Calendar },
                        { label: 'Payment Gateway', value: 'SSLCommerz', icon: Shield }
                    ]}
                />

                {gatewayResult ? (
                    <PaymentReturnBanner
                        key={`${gatewayResult.payment}|${gatewayResult.bookingCode}|${gatewayResult.tranId}`}
                        result={gatewayResult}
                        onDismiss={() => setGatewayResult(null)}
                    />
                ) : null}

                <RefreshIndicator onRefresh={refreshBookings} />

                <BookingDatePicker
                    selectedDate={selectedDate}
                    onSelect={selectDate}
                    today={today}
                    maxDate={maxDate}
                    windowDays={windowDays}
                    weekendDays={pricing.weekendDays}
                    bookings={bookings}
                />

                <View style={{ gap: spacing.sm }}>
                    <Segmented scroll size="sm" value={selectedPeriod} onChange={setSelectedPeriod} options={PERIOD_TABS} />
                    <AppText size="xs" tone="soft">
                        {'Selected: '}
                        <AppText size="xs" weight="800">{formatIsoDate(selectedDate)}</AppText>
                        {' · '}
                        <AppText size="xs" weight="800" tone="brand">{`${availableCount} Free Slots`}</AppText>
                    </AppText>
                </View>

                <View style={{ gap: spacing.md }}>
                    {filteredSlots.map(slot => <SlotCard key={slot.id} slot={slot} rateLabel={rateLabel} onBook={handleSlotClick} />)}
                </View>

                <View onLayout={(e) => { findBookingY.current = e.nativeEvent.layout.y; }}>
                    <FindMyBookingCard />
                </View>

                <WeatherWidget />

                <BookingRules pricing={pricing} />

                <FaqList
                    items={BOOKING_FAQ}
                    eyebrow="Booking FAQ"
                    title="Booking questions, answered"
                    ctaLabel="Full price table"
                    onCta={() => router.push('/about')}
                />
            </Screen>

            {slotForBooking ? (
                <BookingFormSheet
                    key={slotForBooking.id}
                    slot={slotForBooking}
                    selectedDate={selectedDate}
                    onClose={() => setSlotForBooking(null)}
                />
            ) : null}
        </>
    );
}
