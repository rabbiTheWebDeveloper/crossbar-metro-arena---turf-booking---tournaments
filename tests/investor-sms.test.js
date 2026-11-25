import { describe, it, expect } from 'vitest';
import { renderInvestorSms, INVESTOR_SMS_TEMPLATES, tk } from '@/lib/investorSms';
import { estimateSmsParts } from '@/lib/smsUtils';

describe('investor SMS templates', () => {
    const inv = { name: 'Rahim Uddin', phone: '01711223344', sharePercentage: 12.5, capitalInvested: 500000 };
    const ctx = {
        monthLabel: 'November 2026',
        share: { shareAmount: 45250.4, paidAmount: 20000, balance: 25250.4 },
        portalUrl: 'https://bookcrossbar.com/'
    };

    it('fills every placeholder with the partner values', () => {
        const out = renderInvestorSms('{firstName}|{name}|{phone}|{sharePct}|{capital}|{month}|{shareAmount}|{paidAmount}|{owedAmount}|{portalUrl}', inv, ctx);
        expect(out).toBe('Rahim|Rahim Uddin|01711223344|12.5|Tk 5,00,000|November 2026|Tk 45,250|Tk 20,000|Tk 25,250|https://bookcrossbar.com');
    });

    it('leaves unknown placeholders untouched and handles missing share data', () => {
        expect(renderInvestorSms('Hi {name} {unknown}', inv)).toBe('Hi Rahim Uddin {unknown}');
        expect(renderInvestorSms('{owedAmount}', inv)).toBe('Tk 0');
        expect(tk(undefined)).toBe('Tk 0');
    });

    it('keeps built-in templates GSM-7 so they cost one or two SMS, never Unicode', () => {
        for (const tpl of INVESTOR_SMS_TEMPLATES.filter(t => t.text)) {
            const parts = estimateSmsParts(renderInvestorSms(tpl.text, inv, ctx));
            expect(parts.encoding).toBe('GSM-7');
            expect(parts.parts).toBeLessThanOrEqual(2);
        }
    });
});
