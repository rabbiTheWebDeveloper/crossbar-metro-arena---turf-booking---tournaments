import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { errorResponse } from '@/lib/validate';
import { listPayments, getPaymentOverview } from '@/queries/payment-queries';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models/booking-model';
import { Payment } from '@/models/payment-model';

/**
 * GET /api/payments  (admin / staff with bookings or finance permission)
 * Returns paginated Payment records (EPS, SSLCommerz, and counter payments) + summary totals.
 * Supports `?sync=1` to backfill older paid bookings into the Payment ledger if not yet recorded.
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, ['bookings', 'finance']);
        if (denied) return denied;

        const sp = new URL(request.url).searchParams;
        if (sp.get('sync') === '1') {
            await connectToDatabase();
            const paidBookings = await Booking.find({
                advanceAmount: { $gt: 0 },
                paymentStatus: { $in: ['paid_advance', 'paid_full', 'needs_refund'] }
            }).sort({ createdAt: -1 }).limit(300).lean();

            const existingBookingIds = new Set(
                (await Payment.find({ status: 'success' }).select('bookingId').lean()).map((p) => String(p.bookingId))
            );

            const toInsert = [];
            for (const b of paidBookings) {
                const bid = String(b._id);
                if (existingBookingIds.has(bid)) continue;
                const gw = b.paymentGateway || (b.gatewayValId ? (b.epsTransactionId ? 'eps' : 'sslcommerz') : 'counter');
                toInsert.push({
                    bookingId: bid,
                    bookingCode: b.bookingCode || '',
                    merchantTransactionId: b.gatewayTranId || `BACKFILL-${b.bookingCode || bid}`,
                    gatewayTransactionId: b.epsTransactionId || b.gatewayValId || b.transactionId || '',
                    gateway: gw,
                    status: 'success',
                    amount: Number(b.advanceAmount) || 0,
                    currency: 'BDT',
                    paymentMethod: b.paymentMethod || 'cash',
                    financialEntity: b.gatewayCardType || b.paymentMethod || '',
                    customerName: b.captainName || '',
                    customerPhone: b.captainPhone || '',
                    teamName: b.teamName || '',
                    slotDate: b.date || '',
                    slotNumber: Number(b.slotNumber) || 0,
                    slotDisplay: b.displayTime || '',
                    verifiedAt: b.paidAt || b.createdAt || new Date(),
                    notes: 'Synced from booking record'
                });
            }
            if (toInsert.length > 0) {
                await Payment.insertMany(toInsert, { ordered: false }).catch(() => {});
            }
        }

        const [list, overview] = await Promise.all([
            listPayments({
                q: sp.get('q') || '',
                status: sp.get('status') || '',
                gateway: sp.get('gateway') || '',
                from: sp.get('from') || '',
                to: sp.get('to') || '',
                page: sp.get('page'),
                limit: sp.get('limit')
            }),
            getPaymentOverview()
        ]);

        return NextResponse.json({
            success: true,
            ...list,
            overview
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/payments');
    }
}
