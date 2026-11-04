/**
 * Server layout for the player portal. The parent (player)/layout.jsx is a client component and cannot
 * export metadata, so the noindex directive for /player/* lives here.
 */
export const metadata = {
    title: 'Player Portal',
    description: 'Your Crossbar Metro Arena passes, team and match results.',
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
};

export default function PlayerSegmentLayout({ children }) {
    return children;
}
