import { buildMetadata } from '@/lib/seo';
import LoginClient from './LoginClient';

// Auth pages are intentionally kept out of the index: they carry no search value and would only
// compete with the home page for brand queries.
export const metadata = buildMetadata({
    title: 'Log In',
    description: 'Log in to your Crossbar Metro Arena account to see your turf passes, manage your team and post match results.',
    path: '/login',
    noIndex: true
});

export default function LoginPage() {
    return <LoginClient />;
}
