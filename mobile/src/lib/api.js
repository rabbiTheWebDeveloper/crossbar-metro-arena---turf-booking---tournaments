/**
 * HTTP client for the Crossbar Metro Arena API (the Next.js route handlers of the web platform).
 *
 * Authentication
 * --------------
 * The server signs a JWT on login/register and delivers it in the `cma_auth_token` cookie. Every
 * protected route also accepts the same token as `Authorization: Bearer <token>`, which is what the
 * app uses: the token is read from the login response's Set-Cookie header and kept in the device
 * keystore (expo-secure-store). The platform cookie jar keeps working as a fallback.
 */
import * as SecureStore from 'expo-secure-store';
import { Networking } from 'react-native';
import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'cma_auth_token';
const REQUEST_TIMEOUT_MS = 25000;

let memoryToken = null;
let tokenLoaded = false;

export async function loadToken() {
    if (tokenLoaded) return memoryToken;
    try { memoryToken = (await SecureStore.getItemAsync(TOKEN_KEY)) || null; } catch { memoryToken = null; }
    tokenLoaded = true;
    return memoryToken;
}

export async function saveToken(token) {
    memoryToken = token || null;
    tokenLoaded = true;
    try {
        if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
        else await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch { /* keystore unavailable: the token still lives in memory for this session */ }
}

/** Forget the session on this device (token + any cookies the platform stored). */
export async function clearSession() {
    await saveToken(null);
    try {
        if (Networking && typeof Networking.clearCookies === 'function') Networking.clearCookies(() => { });
    } catch { /* not supported on this platform */ }
}

export const getToken = () => memoryToken;

/** Pull the JWT out of a Set-Cookie header (several cookies may be joined into one string). */
export function extractTokenFromSetCookie(header) {
    if (!header) return null;
    const m = /(?:^|[,;\s])cma_auth_token=([^;,\s]*)/.exec(String(header));
    if (!m) return null;
    const value = decodeURIComponent(m[1] || '');
    return value || '';
}

function captureToken(res) {
    try {
        const header = res.headers.get('set-cookie');
        const token = extractTokenFromSetCookie(header);
        if (token === null) return;
        // An empty value means the server cleared the cookie (logout / disabled account)
        saveToken(token || null);
    } catch { /* header not readable */ }
}

/** Absolute URL for an API path or site-relative asset ("/brand/x.png"). */
export function absoluteUrl(path) {
    const p = String(path || '');
    if (!p) return '';
    if (/^(https?:\/\/|data:|file:|content:)/i.test(p)) return p;
    if (p.startsWith('//')) return `https:${p}`;
    return `${API_BASE_URL}${p.startsWith('/') ? '' : '/'}${p}`;
}

/**
 * JSON fetch helper: never throws, always resolves to { ok, status, data, error }.
 * `options.body` may be a plain object (it is JSON-encoded).
 */
export async function api(path, options = {}) {
    await loadToken();
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT_MS) : null;
    try {
        const headers = { Accept: 'application/json', 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (memoryToken) headers.Authorization = `Bearer ${memoryToken}`;
        const res = await fetch(absoluteUrl(path), {
            method: options.method || 'GET',
            headers,
            body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
            signal: controller ? controller.signal : undefined
        });
        captureToken(res);
        let data = {};
        try { data = await res.json(); } catch { data = {}; }
        if (data === null || typeof data !== 'object') data = {};
        return { ok: res.ok, status: res.status, data, error: res.ok ? null : (data.error || `Request failed (${res.status})`) };
    } catch (e) {
        const timedOut = e && e.name === 'AbortError';
        return {
            ok: false, status: 0, data: {},
            error: timedOut ? 'The arena server took too long to respond. Please try again.' : 'Network error. Please check your connection and try again.'
        };
    } finally {
        if (timer) clearTimeout(timer);
    }
}

/** Server responses are either a bare array or `{ [key]: [...] }`. */
export const unwrap = (data, key) => {
    if (!data) return null;
    if (Array.isArray(data)) return data;
    if (key && Array.isArray(data[key])) return data[key];
    return null;
};

/** Insert or replace an item in a list by id. */
export const upsert = (list, item, key = 'id') => {
    if (!item) return list;
    const exists = list.some(x => x[key] === item[key]);
    return exists ? list.map(x => (x[key] === item[key] ? item : x)) : [item, ...list];
};
