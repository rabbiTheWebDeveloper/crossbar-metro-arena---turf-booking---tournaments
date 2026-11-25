/**
 * Investor SMS templates + placeholder rendering (pure, shared by client & tests).
 * Uses "Tk" instead of "৳" so messages stay GSM-7 (160 chars per SMS instead of 70).
 */

export const INVESTOR_SMS_TEMPLATES = [
    {
        id: 'dividend',
        label: 'Monthly Dividend',
        text: 'Dear {name}, Crossbar Metro Arena {month} update: your {sharePct}% share is {shareAmount}. Paid {paidAmount}, balance {owedAmount}.'
    },
    {
        id: 'payout_sent',
        label: 'Payout Sent',
        text: 'Dear {name}, your Crossbar Metro Arena dividend payout of {paidAmount} for {month} has been sent. Thank you for partnering with us.'
    },
    {
        id: 'portal',
        label: 'Portal Access',
        text: 'Dear {name}, view your Crossbar Metro Arena partner dashboard, payouts and reports anytime at {portalUrl}/investor (login mobile: {phone}).'
    },
    {
        id: 'meeting',
        label: 'Partners Meeting',
        text: 'Dear {name}, a Crossbar Metro Arena partners meeting is coming up. Date and venue will be shared shortly. - Management'
    },
    {
        id: 'custom',
        label: 'Custom',
        text: ''
    }
];

export const INVESTOR_SMS_PLACEHOLDERS = [
    'name', 'firstName', 'phone', 'sharePct', 'capital', 'month', 'shareAmount', 'paidAmount', 'owedAmount', 'portalUrl'
];

export const tk = (n) => `Tk ${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/**
 * Replace {placeholders} with values for one investor. Unknown placeholders are left untouched.
 * ctx: { monthLabel, share: { shareAmount, paidAmount, balance }, portalUrl }
 */
export function renderInvestorSms(template, investor, ctx = {}) {
    const name = String(investor?.name || 'Partner').trim() || 'Partner';
    const share = ctx.share || {};
    const values = {
        name,
        firstName: name.split(/\s+/)[0],
        phone: investor?.phone || '',
        sharePct: String(Number(investor?.sharePercentage) || 0),
        capital: tk(investor?.capitalInvested),
        month: ctx.monthLabel || '',
        shareAmount: tk(share.shareAmount),
        paidAmount: tk(share.paidAmount),
        owedAmount: tk(share.balance),
        portalUrl: String(ctx.portalUrl || '').replace(/\/+$/, '')
    };
    return String(template || '').replace(/\{(\w+)\}/g, (match, key) => (
        Object.hasOwn(values, key) ? values[key] : match
    ));
}
