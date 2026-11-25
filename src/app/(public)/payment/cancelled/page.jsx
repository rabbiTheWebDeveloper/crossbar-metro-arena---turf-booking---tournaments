import React from 'react';
import { PaymentResultView } from '@/components/PaymentResultView';

export const metadata = {
    title: 'Payment Cancelled | Crossbar Metro Arena',
    description: 'You cancelled the payment at the gateway. Your slot hold was released.',
    robots: { index: false, follow: false }
};

export default function PaymentCancelledPage() {
    return <PaymentResultView variant="cancelled"/>;
}
