import { buildMetadata } from '@/lib/seo';
import RegisterClient from './RegisterClient';

export const metadata = buildMetadata({
    title: 'Create a Player Account',
    description: 'Create a free Crossbar Metro Arena player account with your mobile number to book floodlit turf slots, manage your squad and post match results.',
    path: '/register',
    noIndex: true
});

export default function RegisterPage() {
    return <RegisterClient />;
}
