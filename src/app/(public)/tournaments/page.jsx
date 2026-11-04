import { permanentRedirect } from 'next/navigation';

/** Tournaments live on /events; keep the old URL working with a 308 so search engines transfer ranking signals. */
export default function TournamentsPage() {
    permanentRedirect('/events');
}
