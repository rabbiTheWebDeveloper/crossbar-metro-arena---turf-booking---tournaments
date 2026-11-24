/**
 * Browser-side calls for the admin Customers page. Every function resolves to { ok, status, data, error }
 * and never throws, so the page can show the server's message as it is.
 */
async function call(url, { method = 'GET', body } = {}) {
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data, error: res.ok ? null : (data.error || `Request failed (${res.status})`) };
    } catch {
        return { ok: false, status: 0, data: {}, error: 'Network error. Please check your connection and try again.' };
    }
}

/** { q, source, account: 'with' | 'without', page, limit } */
export function listCustomers(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
    return call(`/api/customers?${qs.toString()}`);
}

export const getCustomer = (id) => call(`/api/customers/${encodeURIComponent(id)}`);
export const createCustomer = (body) => call('/api/customers', { method: 'POST', body });
export const updateCustomer = (id, body) => call(`/api/customers/${encodeURIComponent(id)}`, { method: 'PATCH', body });
export const deleteCustomer = (id) => call(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const syncCustomers = () => call('/api/customers/sync', { method: 'POST' });
