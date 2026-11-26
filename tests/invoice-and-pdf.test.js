import { describe, it, expect } from 'vitest';
import { validate } from '@/lib/validate';
import { INVOICE_SCHEMA, validateInvoiceItems } from '@/lib/schemas';
import {
    buildBookingInvoice,
    buildTokenInvoice,
    buildPaymentInvoice,
    buildPayoutInvoice,
    buildInvestorStatementInvoice,
    buildShopOrderInvoice,
    buildCustomInvoice,
    extractTokenSlipFields
} from '@/lib/invoice';
import { generateInvoicePdfBytes, buildInvoiceFilename } from '@/lib/invoicePdf';

describe('invoice normalizers, schemas, and vector PDF generator', () => {
    it('builds a turf booking invoice with court fee, equipment add-ons, advance paid, and balance due', () => {
        const inv = buildBookingInvoice({
            id: '674500000000000000000001',
            bookingCode: 'CMA-7K9P2M',
            date: '2026-12-05',
            slotNumber: 10,
            displayTime: '08:00 PM – 09:30 PM',
            captainName: 'Siam Rahman',
            captainPhone: '01711223344',
            teamName: 'Uttara Strikers',
            playerCount: 14,
            courtPrice: 5500,
            addOns: [
                { id: 'referee', name: 'Certified Match Referee', price: 500, description: 'Official 90m referee' },
                { id: 'water', name: 'Chilled Water Pack', price: 400 }
            ],
            totalPrice: 6400,
            advanceAmount: 500,
            dueAmount: 5900,
            paymentMethod: 'bkash',
            paymentStatus: 'paid_advance',
            epsTransactionId: 'EPS-TXN-8899'
        });

        expect(inv.invoiceNumber).toBe('INV-CMA-7K9P2M');
        expect(inv.statusBadge).toBe('ADVANCE PAID');
        expect(inv.items).toHaveLength(3);
        expect(inv.totalAmount).toBe(6400);
        expect(inv.paidAmount).toBe(500);
        expect(inv.dueAmount).toBe(5900);
        expect(inv.transactionRef).toBe('EPS-TXN-8899');
    });

    it('builds an investor dividend payout voucher and consolidated payout statement', () => {
        const investor = {
            id: '674500000000000000000010',
            name: 'Rahim Ahmed',
            phone: '01819556677',
            email: 'rahim@example.com',
            sharePercentage: 25,
            capitalInvested: 2500000,
            payoutDetails: { method: 'bank_transfer', bankName: 'City Bank', accountNumber: '1234567890' }
        };
        const payout = {
            id: '674500000000000000000099',
            investorId: investor.id,
            investorName: investor.name,
            month: '2026-11',
            amount: 45000,
            datePaid: '2026-11-30',
            paymentMethod: 'bank_transfer',
            transactionNote: 'BEFTN-7712',
            recordedBy: 'Super Admin'
        };

        const voucher = buildPayoutInvoice(payout, investor, { totalRevenue: 320000, totalExpenses: 140000, netProfit: 180000 });
        expect(voucher.docTypeLabel).toBe('INVESTOR PAYOUT VOUCHER');
        expect(voucher.statusBadge).toBe('DISBURSED / PAID');
        expect(voucher.totalAmount).toBe(45000);
        expect(voucher.paidAmount).toBe(45000);
        expect(voucher.dueAmount).toBe(0);

        const statement = buildInvestorStatementInvoice({ investor, payouts: [payout] });
        expect(statement.docTypeLabel).toBe('DIVIDEND PAYOUT STATEMENT');
        expect(statement.totalAmount).toBe(45000);
        expect(statement.items).toHaveLength(1);
    });

    it('validates custom INVOICE_SCHEMA and line items, and builds custom & shop invoices', () => {
        const schemaCheck = validate({
            category: 'sponsorship',
            recipientRole: 'organization',
            recipientName: '  Metro Beverages Ltd  ',
            recipientPhone: '+8801711223344',
            discount: 500,
            tax: 0,
            paidAmount: 9500,
            paymentMethod: 'bank_transfer'
        }, INVOICE_SCHEMA);
        expect(schemaCheck.error).toBeUndefined();

        const itemsCheck = validateInvoiceItems([
            { description: '  Perimeter Banner Sponsorship  ', quantity: 2, unitPrice: 5000 }
        ]);
        expect(itemsCheck.error).toBeUndefined();
        expect(itemsCheck.subtotal).toBe(10000);

        const customInv = buildCustomInvoice({
            id: '674500000000000000000055',
            invoiceNumber: 'CMA-INV-202611-XY23Z',
            ...schemaCheck.data,
            items: itemsCheck.value,
            subtotal: 10000,
            totalAmount: 9500,
            dueAmount: 0,
            status: 'paid'
        });
        expect(customInv.invoiceNumber).toBe('CMA-INV-202611-XY23Z');
        expect(customInv.statusBadge).toBe('PAID IN FULL');

        const shopInv = buildShopOrderInvoice({
            reservationCode: 'SHOP-1024',
            customerName: 'Nabil',
            customerPhone: '01911223344',
            status: 'collected',
            items: [{ name: 'Pro Grip Socks', size: 'L', quantity: 2, price: 350 }],
            totalAmount: 700
        });
        expect(shopInv.totalAmount).toBe(700);
        expect(shopInv.paidAmount).toBe(700);
    });

    it('generates a valid multi-page-capable PDF 1.4 binary with clean ASCII/WinAnsi encoding', () => {
        const manyItems = Array.from({ length: 22 }, (_, i) => ({
            description: `Slot Booking Session #${i + 1}`,
            meta: 'Crossbar Metro Arena — 90 Minute Turf Hire',
            quantity: 1,
            unitPrice: 4000,
            amount: 4000
        }));

        const inv = buildCustomInvoice({
            invoiceNumber: 'CMA-INV-202611-MULTI',
            category: 'booking',
            recipientName: 'Corporate League Dhaka',
            recipientPhone: '01711223344',
            items: manyItems,
            subtotal: 88000,
            totalAmount: 88000,
            paidAmount: 50000,
            dueAmount: 38000,
            status: 'partial'
        });

        const bytes = generateInvoicePdfBytes(inv);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.byteLength).toBeGreaterThan(2500);

        const text = new TextDecoder('utf-8').decode(bytes);
        expect(text.startsWith('%PDF-1.4\n')).toBe(true);
        expect(text.endsWith('%%EOF')).toBe(true);
        expect(text).toContain('/Type /Catalog');
        expect(text).toContain('/Count 2'); // 22 items paginate cleanly onto 2 A4 pages
        expect(text).toContain('BDT 88,000');
        expect(buildInvoiceFilename(inv)).toBe('CMA-INV-202611-MULTI.pdf');
    });

    it('builds and renders the 2nd serrated Token / Payment Invoice (including FAILED EPS slips)', () => {
        const failedPayment = buildPaymentInvoice({
            bookingCode: 'CMA-TAH3MD',
            customerName: 'Rabbi',
            teamName: '1',
            customerPhone: '01726278251',
            createdAt: '2026-11-25T10:00:00Z',
            slotDate: '2026-11-26',
            slotDisplay: '08:00 AM – 09:30 AM',
            financialEntity: 'OKWallet',
            gateway: 'eps',
            sandbox: false,
            status: 'failed',
            amount: 1000,
            merchantTransactionId: '66904d9b-f2ad-4b67-a323-a2b16aeb2746',
            notes: 'EPS checkout initiated (live)'
        });

        expect(failedPayment.defaultFormat).toBe('token');
        expect(failedPayment.invoiceNumber).toBe('RCPT-CMA-TAH3MD');
        expect(failedPayment.statusBadge).toBe('FAILED');
        expect(failedPayment.statusTone).toBe('rose');
        expect(failedPayment.totalAmount).toBe(1000);
        expect(failedPayment.paidAmount).toBe(0);
        expect(failedPayment.dueAmount).toBe(1000);

        const tf = extractTokenSlipFields(failedPayment);
        expect(tf.bannerTitle).toBe('TOKEN / PAYMENT INVOICE');
        expect(tf.partyName).toBe('Rabbi');
        expect(tf.squadValue).toBe('1');
        expect(tf.method).toBe('OKWallet');
        expect(tf.dateRowValue).toBe('2026-11-26');
        expect(tf.paidLabel).toBe('Amount Verified');
        expect(tf.dueLabel).toBe('Unsettled Amount');

        const tokenPdf = generateInvoicePdfBytes(failedPayment, { format: 'token' });
        const pdfText = new TextDecoder('utf-8').decode(tokenPdf);
        expect(pdfText.startsWith('%PDF-1.4\n')).toBe(true);
        expect(pdfText).toContain('/F4'); // Helvetica-Oblique italic font
        expect(pdfText).toContain('TOKEN / PAYMENT INVOICE');
        expect(pdfText).toContain('RCPT-CMA-TAH3MD');
        expect(pdfText).toContain('FAILED');
        expect(pdfText).toContain('BDT 1,000');
        expect(pdfText).toContain('Computer-generated receipt');

        const bookingToken = buildTokenInvoice({
            bookingCode: 'CMA-99AA11',
            date: '2026-12-10',
            slotNumber: 8,
            displayTime: '05:00 PM - 06:30 PM',
            captainName: 'Tanvir',
            captainPhone: '01700000000',
            teamName: 'Sector 17 FC',
            courtPrice: 4000,
            totalPrice: 4000,
            advanceAmount: 1000,
            dueAmount: 3000,
            paymentMethod: 'bkash',
            paymentStatus: 'paid_advance'
        });
        expect(bookingToken.defaultFormat).toBe('token');
        expect(bookingToken.invoiceNumber).toBe('RCPT-CMA-99AA11');
        expect(bookingToken.statusBadge).toBe('ADVANCE PAID');
        expect(buildInvoiceFilename(bookingToken, { format: 'token' })).toBe('RCPT-CMA-99AA11-TOKEN.pdf');
    });
});
