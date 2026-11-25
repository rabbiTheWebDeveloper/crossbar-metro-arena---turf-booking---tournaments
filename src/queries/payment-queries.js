import { connectToDatabase } from '@/lib/mongodb';
import { Payment } from '@/models/payment-model';
import { escapeRegex } from '@/lib/apiAuth';

function serialize(doc) {
    if (!doc) return null;
    const obj = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc, id: String(doc._id) };
    delete obj.__v;
    return obj;
}

export async function createPaymentRecord(payload) {
    await connectToDatabase();
    const doc = await Payment.create(payload);
    return serialize(doc);
}

export async function findPaymentByMerchantTranId(merchantTransactionId) {
    if (!merchantTransactionId) return null;
    await connectToDatabase();
    return Payment.findOne({ merchantTransactionId: String(merchantTransactionId).trim() });
}

export async function updatePaymentByMerchantTranId(merchantTransactionId, patch) {
    if (!merchantTransactionId) return null;
    await connectToDatabase();
    const doc = await Payment.findOneAndUpdate(
        { merchantTransactionId: String(merchantTransactionId).trim() },
        { $set: patch },
        { new: true }
    );
    return serialize(doc);
}

export async function listPayments({ q = '', status = '', gateway = '', from = '', to = '', page = 1, limit = 50 } = {}) {
    await connectToDatabase();
    const query = {};
    if (status && ['initiated', 'success', 'failed', 'cancelled', 'refunded'].includes(status)) {
        query.status = status;
    }
    if (gateway === 'online') {
        query.gateway = { $in: ['eps', 'sslcommerz'] };
    } else if (gateway && ['eps', 'sslcommerz', 'counter'].includes(gateway)) {
        query.gateway = gateway;
    }
    if (from || to) {
        query.slotDate = {};
        if (from) query.slotDate.$gte = from;
        if (to) query.slotDate.$lte = to;
    }
    const search = String(q || '').trim().slice(0, 60);
    if (search) {
        const re = { $regex: escapeRegex(search), $options: 'i' };
        query.$or = [
            { bookingCode: re },
            { merchantTransactionId: re },
            { gatewayTransactionId: re },
            { customerName: re },
            { customerPhone: re },
            { teamName: re },
            { financialEntity: re }
        ];
    }

    const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 200);
    const safePage = Math.max(1, Number(page) || 1);

    const [docs, total] = await Promise.all([
        Payment.find(query)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),
        Payment.countDocuments(query)
    ]);

    return {
        payments: docs.map(serialize),
        total,
        page: safePage,
        pages: Math.max(1, Math.ceil(total / safeLimit)),
        limit: safeLimit
    };
}

export async function getPaymentOverview() {
    await connectToDatabase();
    const rows = await Payment.aggregate([
        {
            $group: {
                _id: { status: '$status', gateway: '$gateway' },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    const overview = {
        totalTransactions: 0,
        totalCollected: 0,
        epsCollected: 0,
        sslcommerzCollected: 0,
        counterCollected: 0,
        successCount: 0,
        initiatedCount: 0,
        failedCount: 0,
        cancelledCount: 0
    };

    for (const row of rows) {
        const { status, gateway } = row._id || {};
        overview.totalTransactions += row.count;
        if (status === 'success') {
            overview.successCount += row.count;
            overview.totalCollected += row.totalAmount;
            if (gateway === 'eps') overview.epsCollected += row.totalAmount;
            else if (gateway === 'sslcommerz') overview.sslcommerzCollected += row.totalAmount;
            else if (gateway === 'counter') overview.counterCollected += row.totalAmount;
        } else if (status === 'initiated') {
            overview.initiatedCount += row.count;
        } else if (status === 'failed') {
            overview.failedCount += row.count;
        } else if (status === 'cancelled') {
            overview.cancelledCount += row.count;
        }
    }

    return overview;
}
