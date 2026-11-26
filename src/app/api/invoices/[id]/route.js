import { NextResponse } from 'next/server';
import { requirePermission, requireSuperAdminDelete, isObjectId, cleanPhone } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/models/invoice-model';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { INVOICE_SCHEMA, validateInvoiceItems } from '@/lib/schemas';

const INVOICE_PERMS = ['bookings', 'finance', 'investors', 'shop_orders', 'registrations'];

async function findInvoice(idOrNo) {
    if (isObjectId(idOrNo)) return Invoice.findById(idOrNo);
    return Invoice.findOne({ invoiceNumber: String(idOrNo || '').trim().toUpperCase() });
}

/** PATCH /api/invoices/:id — update custom invoice details, record payment, or mark paid/cancelled. */
export async function PATCH(request, { params }) {
    try {
        const { denied } = await requirePermission(request, INVOICE_PERMS);
        if (denied) return denied;
        const { id } = await params;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const { data, error: schemaErr } = validate(body, INVOICE_SCHEMA, { partial: true });
        if (schemaErr) return badRequest(schemaErr);

        await connectToDatabase();
        const doc = await findInvoice(id);
        if (!doc) {
            return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
        }

        if (body.items !== undefined) {
            const itemsCheck = validateInvoiceItems(body.items);
            if (itemsCheck.error) return badRequest(itemsCheck.error);
            doc.items = itemsCheck.value;
            doc.subtotal = itemsCheck.subtotal;
        }

        if (data.category !== undefined) doc.category = data.category;
        if (data.recipientRole !== undefined) doc.recipientRole = data.recipientRole;
        if (data.recipientName !== undefined) doc.recipientName = data.recipientName;
        if (data.recipientPhone !== undefined) {
            doc.recipientPhone = data.recipientPhone ? (cleanPhone(data.recipientPhone) || String(data.recipientPhone).trim()) : '';
        }
        if (data.recipientEmail !== undefined) doc.recipientEmail = data.recipientEmail;
        if (data.recipientSubtitle !== undefined) doc.recipientSubtitle = data.recipientSubtitle;
        if (data.issueDate !== undefined) doc.issueDate = data.issueDate;
        if (data.dueDate !== undefined) doc.dueDate = data.dueDate;
        if (data.discount !== undefined) doc.discount = Math.max(0, Number(data.discount) || 0);
        if (data.tax !== undefined) doc.tax = Math.max(0, Number(data.tax) || 0);
        if (data.paymentMethod !== undefined) doc.paymentMethod = data.paymentMethod;
        if (data.transactionRef !== undefined) doc.transactionRef = data.transactionRef;
        if (data.notes !== undefined) doc.notes = data.notes;

        const subtotal = Number(doc.subtotal) || 0;
        const discount = Math.min(subtotal, Math.max(0, Number(doc.discount) || 0));
        const tax = Math.max(0, Number(doc.tax) || 0);
        const totalAmount = Math.max(0, subtotal - discount + tax);
        doc.discount = discount;
        doc.totalAmount = totalAmount;

        if (body.markPaid === true) {
            doc.paidAmount = totalAmount;
        } else if (data.paidAmount !== undefined) {
            doc.paidAmount = Math.min(totalAmount, Math.max(0, Number(data.paidAmount) || 0));
        } else {
            doc.paidAmount = Math.min(totalAmount, Math.max(0, Number(doc.paidAmount) || 0));
        }

        if (data.status === 'cancelled') {
            doc.status = 'cancelled';
            doc.dueAmount = 0;
        } else {
            const isPayout = doc.category === 'investor_payout' || doc.recipientRole === 'investor';
            doc.dueAmount = Math.max(0, totalAmount - doc.paidAmount);
            if (doc.paidAmount >= totalAmount && totalAmount > 0) doc.status = isPayout ? 'disbursed' : 'paid';
            else if (doc.paidAmount > 0) doc.status = 'partial';
            else doc.status = totalAmount === 0 ? (isPayout ? 'disbursed' : 'paid') : 'unpaid';
        }

        await doc.save();
        return NextResponse.json({
            success: true,
            message: `Invoice ${doc.invoiceNumber} updated.`,
            invoice: doc.toJSON()
        });
    } catch (err) {
        return errorResponse(err, 'PATCH /api/invoices/[id]');
    }
}

/** DELETE /api/invoices/:id — permanently delete a custom invoice (Super Admin ONLY). */
export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireSuperAdminDelete(request);
        if (denied) return denied;
        const { id } = await params;

        await connectToDatabase();
        const doc = await findInvoice(id);
        if (!doc) {
            return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
        }

        const invNo = doc.invoiceNumber;
        await Invoice.deleteOne({ _id: doc._id });

        return NextResponse.json({
            success: true,
            message: `Invoice ${invNo} deleted.`
        });
    } catch (err) {
        return errorResponse(err, 'DELETE /api/invoices/[id]');
    }
}
