/** The public origin used for payment gateway redirects. Never taken from a request body. */
export function publicBaseUrl(requestUrl) {
    const env = (process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_URL || '').trim().replace(/\/+$/, '');
    if (env && /^https?:\/\//.test(env)) return env;
    if (requestUrl) {
        const u = new URL(requestUrl);
        return `${u.protocol}//${u.host}`;
    }
    return 'http://localhost:3000';
}
