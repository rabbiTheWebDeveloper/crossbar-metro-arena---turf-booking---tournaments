import React from 'react';
import { PaymentResultView } from '@/components/PaymentResultView';

export const metadata = {
    title: 'Payment Rejected | Crossbar Metro Arena',
    description: 'Your payment transaction was rejected by the payment gateway.',
    robots: { index: false, follow: false }
};

export default function PaymentRejectedPage() {
    return <PaymentResultView variant="rejected"/>;
}
