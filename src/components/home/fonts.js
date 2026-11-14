import { Big_Shoulders, Manrope, DM_Mono } from 'next/font/google';

/**
 * Typefaces of the home page design: a condensed display face for headings and figures,
 * Manrope for body copy and DM Mono for labels, prices and times. Self-hosted by next/font;
 * globals.css maps them to the `font-bigs`, `font-body2` and `font-code` utilities.
 */
export const homeDisplay = Big_Shoulders({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap', variable: '--font-home-display', adjustFontFallback: false });
export const homeBody = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-home-body' });
export const homeMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--font-home-mono' });

export const homeFontVariables = `${homeDisplay.variable} ${homeBody.variable} ${homeMono.variable}`;
