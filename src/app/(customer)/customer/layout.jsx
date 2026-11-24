/**
 * Server layout for the customer panel. The parent (customer)/layout.jsx is a client component and cannot
 * export metadata, so the noindex directive for /customer/* lives here.
 */
export const metadata = {
    title: 'Customer Panel',
    description: 'Your Crossbar Metro Arena bookings, passes, team, match results and preferences.',
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
};

export default function CustomerSegmentLayout({ children }) {
    return children;
}
