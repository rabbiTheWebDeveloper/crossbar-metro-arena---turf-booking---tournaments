import React from 'react';
import { PaymentResultView } from '@/components/PaymentResultView';

export const metadata = {
    title: 'Thank You — Booking Confirmed | Crossbar Metro Arena',
    description: 'Thank you for booking at Crossbar Metro Arena.',
    robots: { index: false, follow: false }
};

export default function ThankYouPage() {
    return <PaymentResultView variant="success"/>;
}
