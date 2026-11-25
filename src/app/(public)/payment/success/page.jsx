import React from 'react';
import { PaymentResultView } from '@/components/PaymentResultView';

export const metadata = {
    title: 'Thank You — Payment Successful | Crossbar Metro Arena',
    description: 'Your turf slot booking payment has been verified and confirmed.',
    robots: { index: false, follow: false }
};

export default function PaymentSuccessPage() {
    return <PaymentResultView variant="success"/>;
}
