import { buildMetadata } from '@/lib/seo';
import RegisterClient from './RegisterClient';

export const metadata = buildMetadata({
    title: 'Create a Customer Account',
    description: 'Create a free Crossbar Metro Arena customer account with your mobile number or email to book floodlit turf slots, manage your passes and join tournaments.',
    path: '/register',
    noIndex: true
});

export default function RegisterPage() {
    return <RegisterClient />;
}
