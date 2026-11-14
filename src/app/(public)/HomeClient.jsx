'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { addDaysIso } from '../../lib/dateUtils';
import { homeFontVariables } from '../../components/home/fonts';
import { scrollToId } from '../../components/home/ui';
import { useAvailability } from '../../components/home/slots';
import { HomeHeader } from '../../components/home/HomeHeader';
import { HeroBackdrop, HeroSection } from '../../components/home/HeroSection';
import { SlotPicker } from '../../components/home/SlotPicker';
import { PricingSection } from '../../components/home/PricingSection';
import { FacilitiesSection, StepsSection } from '../../components/home/ArenaSections';
import { GallerySection, MatchdaySection, ShopStrip } from '../../components/home/CommunitySections';
import { LocationSection, FaqSection, CtaBand, HomeFooter } from '../../components/home/InfoSections';

/**
 * Public home page ("Home — Desktop 1440" design).
 *
 * Section order: header · hero + find-a-slot · live slot picker and checkout · pricing ·
 * facilities · how booking works · gallery and tournaments · match day · shop · location ·
 * FAQ · call to action · footer. The shared Navbar and Footer step aside on this route
 * (see their `pathname === '/'` checks); everything they offered is in HomeHeader / HomeFooter.
 */
export default function ArenaHomePage() {
    const availability = useAvailability();
    const { today, todaySlots } = availability;

    // Dates and "time passed" depend on the visitor's clock, so they render after mount
    const [ready, setReady] = useState(false);
    useEffect(() => { setReady(true); }, []);

    const [date, setDate] = useState(today);
    const [period, setPeriod] = useState('all');

    /** Jump to the slot picker, optionally on another date and/or part of the day. */
    const goBook = useCallback((nextDate, nextPeriod) => {
        if (nextDate) setDate(nextDate);
        if (nextPeriod) setPeriod(nextPeriod);
        scrollToId('book');
    }, []);

    const freeToday = todaySlots.filter(s => s.status === 'available').length;
    const eveningFree = todaySlots.filter(s => s.status === 'available' && s.period === 'evening').length;

    return (
        <div className={`home-v2 relative isolate ${homeFontVariables}`}>
            <HeroBackdrop />
            <HomeHeader />

            <HeroSection availability={availability} ready={ready} onCheck={goBook} onViewPricing={() => scrollToId('pricing')} />
            <SlotPicker availability={availability} ready={ready} date={date} onDateChange={setDate} period={period} onPeriodChange={setPeriod} />
            <PricingSection onBook={(p) => goBook(undefined, p)} />
            <FacilitiesSection />
            <StepsSection />
            <GallerySection />
            <MatchdaySection />
            <ShopStrip />
            <LocationSection />
            <FaqSection />
            <CtaBand freeToday={freeToday} eveningFree={eveningFree} ready={ready} tomorrow={addDaysIso(today, 1)} onBook={(d) => goBook(d, 'all')} />

            <HomeFooter />
        </div>
    );
}
