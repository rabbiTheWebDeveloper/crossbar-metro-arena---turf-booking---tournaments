/** Phone helpers shared by server routes and client code (no server-only imports). */

/** Normalise a Bangladeshi mobile number to the 11-digit "01XXXXXXXXX" form. */
export function cleanPhone(raw) {
    let p = String(raw || '').replace(/[^0-9]/g, '');
    if (p.startsWith('8801')) p = p.substring(2);
    return p;
}

export const isValidBdPhone = (raw) => /^01[3-9]\d{8}$/.test(cleanPhone(raw));
