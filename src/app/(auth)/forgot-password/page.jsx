import { buildMetadata } from '@/lib/seo';
import ForgotPasswordClient from './ForgotPasswordClient';

export const metadata = buildMetadata({
    title: 'Reset Password',
    description: 'Reset your Crossbar Metro Arena account password using an email verification code.',
    path: '/forgot-password',
    noIndex: true
});

export default function ForgotPasswordPage() {
    return <ForgotPasswordClient />;
}
