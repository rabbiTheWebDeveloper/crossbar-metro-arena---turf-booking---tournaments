/**
 * Server layout for the admin portal. The parent (admin)/layout.jsx is a client component and cannot
 * export metadata, so the noindex directive for /admin/* lives here.
 */
export const metadata = {
    title: 'Arena Desk',
    description: 'Private operations console for Crossbar Metro Arena staff.',
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
};

export default function AdminSegmentLayout({ children }) {
    return children;
}
