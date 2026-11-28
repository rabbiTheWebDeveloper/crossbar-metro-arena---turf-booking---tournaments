import { NextResponse } from 'next/server';
import { requireAuth, requirePermission, cleanPhone } from '@/lib/apiAuth';
import { actorId, actorLabel } from '@/lib/audit';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/models/invoice-model';
import { Investor } from '@/models/investor-model';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { INVOICE_SCHEMA, validateInvoiceItems } from '@/lib/schemas';

const INVOICE_PERMS = ['bookings', 'finance', 'investors', 'shop_orders', 'registrations'];

function deriveInvoiceStatus({ category, recipientRole, totalAmount, paidAmount, requestedStatus }) {
    if (requestedStatus === 'cancelled') return 'cancelled';
    const isPayout = category === 'investor_payout' || recipientRole === 'investor' || requestedStatus === 'disbursed';
    if (paidAmount >= totalAmount && totalAmount > 0) return isPayout ? 'disbursed' : 'paid';
    if (paidAmount > 0) return 'partial';
    if (totalAmount === 0) return isPayout ? 'disbursed' : 'paid';
    return 'unpaid';
}

/**
 * GET /api/invoices
 *   - `?mine=1`: returns custom invoices belonging to the signed-in customer (`player`) or equity partner (`investor`).
 *   - default: returns all custom invoices for admin / authorized staff.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const mine = searchParams.get('mine') === '1';

        if (mine) {
            const { user, denied } = await requireAuth(request);
            if (denied) return denied;
            await connectToDatabase();

            const uid = String(user.userId || user.id || '');
            const phone = cleanPhone(user.phone);
            const orClauses = [];
            if (uid) orClauses.push({ userId: uid });
            if (phone) orClauses.push({ recipientPhone: phone });

            if (user.role === 'investor') {
                let inv = uid ? await Investor.findOne({ userId: uid }).select('_id').lean() : null;
                if (!inv && phone) {
                    const all = await Investor.find().select('_id phone').lean();
                    inv = all.find(i => cleanPhone(i.phone) === phone) || null;
                }
                if (inv?._id) orClauses.push({ investorId: String(inv._id) });
            }

            if (orClauses.length === 0) {
                return NextResponse.json({ success: true, count: 0, invoices: [] });
            }

            const docs = await Invoice.find({ $or: orClauses }).sort({ issueDate: -1, createdAt: -1 }).limit(200);
            return NextResponse.json({
                success: true,
                count: docs.length,
                invoices: docs.map(d => d.toJSON())
            });
        }

        const { denied } = await requirePermission(request, INVOICE_PERMS);
        if (denied) return denied;

        await connectToDatabase();
        const category = searchParams.get('category');
        const query = category && category !== 'all' ? { category } : {};
        const docs = await Invoice.find(query).sort({ issueDate: -1, createdAt: -1 }).limit(500);
        return NextResponse.json({
            success: true,
            count: docs.length,
            invoices: docs.map(d => d.toJSON())
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/invoices');
    }
}

/** POST /api/invoices — create an official custom invoice or payout voucher in MongoDB. */
export async function POST(request) {
    try {
        const { user, denied } = await requirePermission(request, INVOICE_PERMS);
        if (denied) return denied;

        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error: schemaErr } = validate(body, INVOICE_SCHEMA);
        if (schemaErr) return badRequest(schemaErr);

        const itemsCheck = validateInvoiceItems(body.items);
        if (itemsCheck.error) return badRequest(itemsCheck.error);

        const subtotal = itemsCheck.subtotal;
        const discount = Math.min(subtotal, Math.max(0, Number(data.discount) || 0));
        const tax = Math.max(0, Number(data.tax) || 0);
        const totalAmount = Math.max(0, subtotal - discount + tax);
        const paidAmount = Math.min(totalAmount, Math.max(0, Number(data.paidAmount) || 0));
        const dueAmount = data.status === 'cancelled' ? 0 : Math.max(0, totalAmount - paidAmount);
        const status = deriveInvoiceStatus({
            category: data.category,
            recipientRole: data.recipientRole,
            totalAmount,
            paidAmount,
            requestedStatus: data.status
        });

        const phoneClean = data.recipientPhone ? cleanPhone(data.recipientPhone) || String(data.recipientPhone).trim() : '';
        const prefix = data.category === 'investor_payout' || data.recipientRole === 'investor' ? 'CMA-PAY' : 'CMA-INV';

        await connectToDatabase();
        let created = null;
        for (let attempt = 0; attempt < 4 && !created; attempt++) {
            try {
                created = await Invoice.create({
                    invoiceNumber: Invoice.generateInvoiceNumber(prefix),
                    category: data.category || 'custom',
                    recipientRole: data.recipientRole || 'customer',
                    recipientName: data.recipientName,
                    recipientPhone: phoneClean,
                    recipientEmail: data.recipientEmail || '',
                    recipientSubtitle: data.recipientSubtitle || '',
                    userId: data.userId || actorId(user),
                    investorId: data.investorId || '',
                    issueDate: data.issueDate || new Date().toISOString().slice(0, 10),
                    dueDate: data.dueDate || '',
                    items: itemsCheck.value,
                    subtotal,
                    discount,
                    tax,
                    totalAmount,
                    paidAmount,
                    dueAmount,
                    status,
                    paymentMethod: paidAmount > 0 ? (data.paymentMethod || 'cash') : 'unpaid',
                    transactionRef: data.transactionRef || '',
                    notes: data.notes || '',
                    createdBy: actorLabel(user, 'Admin Desk'),
                    updatedBy: actorLabel(user, 'Admin Desk'),
                    createdById: actorId(user),
                    updatedById: actorId(user)
                });
            } catch (err) {
                if (err?.code !== 11000 || attempt === 3) throw err;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Invoice ${created.invoiceNumber} created.`,
            invoice: created.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/invoices');
    }
}
