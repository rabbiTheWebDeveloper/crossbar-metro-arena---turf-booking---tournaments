import React from 'react';
import { PaymentResultView } from '@/components/PaymentResultView';

export const metadata = {
    title: 'Payment Failed | Crossbar Metro Arena',
    description: 'Your payment could not be completed. Retry your booking or contact the arena desk.',
    robots: { index: false, follow: false }
};

export default function PaymentFailedPage() {
    return <PaymentResultView variant="failed"/>;
}
