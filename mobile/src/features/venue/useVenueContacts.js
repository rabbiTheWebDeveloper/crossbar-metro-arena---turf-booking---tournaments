import { useMemo } from 'react';
import { Linking } from 'react-native';
import { useArena } from '@/context/ArenaContext';
import { VENUE_INFO } from '@/data/initialData';
import { cleanPhone } from '@/lib/phone';

/** Digits for a wa.me link from a settings WhatsApp URL or phone number. */
export const whatsappDigits = (settings) => {
    const fromUrl = String(settings?.whatsappUrl || '').match(/wa\.me\/(\d+)/);
    if (fromUrl) return fromUrl[1];
    const p = cleanPhone(settings?.phone);
    return p ? `88${p}` : '';
};

/**
 * Venue contact details and link actions (call, WhatsApp, maps, mail, social).
 * Values come from the admin-editable `siteSettings`; a field the server did not send falls back
 * to the bundled VENUE_INFO. A field deliberately left empty stays empty (the action is hidden).
 *
 *   const { venue, telHref, whatsappUrl, mapsUrl, open } = useVenueContacts();
 *   open(whatsappUrl);
 */
export function useVenueContacts() {
    const { siteSettings, showNotice } = useArena();
    return useMemo(() => {
        const venue = { ...VENUE_INFO };
        Object.keys(siteSettings || {}).forEach((key) => {
            const value = siteSettings[key];
            if (value !== undefined && value !== null) venue[key] = value;
        });
        const phoneDigits = cleanPhone(venue.phone);
        const open = (url, failMessage) => {
            if (!url) return;
            Linking.openURL(url).catch(() => showNotice('error', failMessage || 'Could not open this link on your device.'));
        };
        return {
            venue,
            telHref: phoneDigits ? `tel:${phoneDigits}` : '',
            phoneLabel: String(venue.phoneFormatted || venue.phone || ''),
            whatsappUrl: String(venue.whatsappUrl || ''),
            waDigits: whatsappDigits(venue),
            mapsUrl: String(venue.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(venue.address || 'Crossbar Metro Arena, Uttara, Dhaka')}`),
            mailHref: venue.email ? `mailto:${venue.email}` : '',
            facebookUrl: String(venue.facebookUrl || ''),
            instagramUrl: String(venue.instagramUrl || ''),
            open
        };
    }, [siteSettings, showNotice]);
}
