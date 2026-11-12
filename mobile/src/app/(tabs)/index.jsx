import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { MessageSquare, Ticket, User } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { CrossbarLogo } from '@/components/CrossbarLogo';
import { Screen, IconButton, Notice, Row } from '@/components/ui';
import { colors } from '@/theme';
import { buildDaySlots, useDhakaClock } from '@/features/booking/slots';
import { useVenueContacts } from '@/features/venue/useVenueContacts';
import { HomeHero } from '@/features/home/HomeHero';
import { TodaySlotsStrip } from '@/features/home/TodaySlotsStrip';
import { WeatherWidget } from '@/features/home/WeatherWidget';
import { QuickLinks } from '@/features/home/QuickLinks';
import { ResultsPreview } from '@/features/home/ResultsPreview';
import { TournamentsPreview } from '@/features/home/TournamentsPreview';
import { ShopPreview } from '@/features/home/ShopPreview';
import { GalleryPreview } from '@/features/home/GalleryPreview';
import { MatchdayPreview } from '@/features/home/MatchdayPreview';
import { ArenaFooter } from '@/features/home/ArenaFooter';
import { HandoverGuideSheet } from '@/features/home/HandoverGuideSheet';

// Screens that live in the bottom tab bar are switched to, everything else is pushed
const TAB_ROUTES = ['/', '/results', '/booking', '/shop', '/me'];

/** Home: hero, live pitch status, weather, shortcuts and previews of every section. */
export default function HomeScreen() {
    const router = useRouter();
    const { bookings, slotHolds, pricing, loadError, isVisitor } = useArena();
    const { whatsappUrl, open } = useVenueContacts();
    const { today, nowMinutes } = useDhakaClock();
    const [guideOpen, setGuideOpen] = useState(false);

    const go = useCallback((href) => {
        if (TAB_ROUTES.includes(href)) router.navigate(href);
        else router.push(href);
    }, [router]);
    const goBooking = useCallback(() => go('/booking'), [go]);

    // Today's 12 slots with their live status
    const todaySlots = useMemo(
        () => buildDaySlots({ date: today, bookings, slotHolds, pricing, today, nowMinutes }),
        [today, bookings, slotHolds, pricing, nowMinutes]
    );

    return (
        <>
            <Screen
                tab
                left={<CrossbarLogo size="sm" />}
                right={(
                    <Row gap={8}>
                        {whatsappUrl ? (
                            <IconButton
                                icon={MessageSquare}
                                tone={colors.onBrand}
                                bg={colors.brand}
                                border={colors.brand}
                                onPress={() => open(whatsappUrl, 'WhatsApp could not be opened on this device.')}
                                accessibilityLabel="Chat with the arena on WhatsApp"
                            />
                        ) : null}
                        <IconButton icon={Ticket} onPress={() => go('/passes')} accessibilityLabel="My passes" />
                        <IconButton icon={User} onPress={() => go('/me')} accessibilityLabel={isVisitor ? 'Log in' : 'My account'} />
                    </Row>
                )}
            >
                {loadError ? <Notice type="error" message={loadError} /> : null}

                <HomeHero
                    today={today}
                    onBook={goBooking}
                    onSquad={() => go('/squad-builder')}
                    onTournaments={() => go('/events')}
                    onResults={() => go('/results')}
                    onMatches={() => go('/matches')}
                />

                <TodaySlotsStrip slots={todaySlots} today={today} onBook={goBooking} />

                <WeatherWidget onBookSlotClick={goBooking} />

                <QuickLinks go={go} onOpenGuide={() => setGuideOpen(true)} />

                <ResultsPreview onSeeAll={() => go('/results')} />

                <TournamentsPreview today={today} onSeeAll={() => go('/events')} />

                <ShopPreview onSeeAll={() => go('/shop')} />

                <GalleryPreview onSeeAll={() => go('/gallery')} />

                <MatchdayPreview today={today} onSeeAll={() => go('/matches')} onBook={goBooking} />

                <ArenaFooter go={go} />
            </Screen>

            <HandoverGuideSheet visible={guideOpen} onClose={() => setGuideOpen(false)} />
        </>
    );
}
