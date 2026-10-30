import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { confirmGatewayPayment } from '@/lib/paymentConfirm';

/**
 * SSLCommerz IPN (server-to-server). Same confirmation logic as the browser callback;
 * whichever arrives first confirms the booking, the other is a no-op.
 */
export async function POST(request) {
    try {
        const formData = await request.formData();
        const tranId = String(formData.get('tran_id') || '');
        const valId = String(formData.get('val_id') || '');
        if (!tranId || !valId) {
            return NextResponse.json({ message: 'Missing tran_id or val_id' }, { status: 400 });
        }
        await connectToDatabase();
        const result = await confirmGatewayPayment({ tranId, valId, source: 'ipn' });
        if (result.ok) return NextResponse.json({ success: true, message: `IPN ${result.code}`, bookingCode: result.booking.bookingCode });
        if (result.code === 'not_found') return NextResponse.json({ message: 'Unknown transaction' }, { status: 404 });
        return NextResponse.json({ message: result.message || 'Transaction not valid' }, { status: 400 });
    } catch (err) {
        console.error('SSLCommerz IPN Error:', err);
        return NextResponse.json({ error: 'IPN processing failed' }, { status: 500 });
    }
}
