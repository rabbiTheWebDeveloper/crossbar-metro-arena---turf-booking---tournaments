import { buildMetadata } from '@/lib/seo';
import LogoutClient from './LogoutClient';

export const metadata = buildMetadata({
    title: 'Signed Out',
    description: 'You have been signed out of Crossbar Metro Arena.',
    path: '/logout',
    noIndex: true
});

export default function LogoutPage() {
    return <LogoutClient />;
}
