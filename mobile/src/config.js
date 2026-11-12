/**
 * App-wide configuration.
 * The mobile app is a client of the Crossbar Metro Arena web platform (Next.js API routes).
 * Override the server at build time with EXPO_PUBLIC_API_URL (e.g. a staging site).
 */
export const API_BASE_URL = String(process.env.EXPO_PUBLIC_API_URL || 'https://www.bookcrossbar.com').replace(/\/+$/, '');

/** Hosts the payment gateway redirects back to after SSLCommerz finishes (web /booking page). */
export const SITE_HOSTS = ['bookcrossbar.com', 'www.bookcrossbar.com'];

/** 1-click demo role buttons (admin / investor / player). Only for demo or staging builds. */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export const APP_VERSION = '1.0.0';
