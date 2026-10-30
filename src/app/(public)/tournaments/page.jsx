import { redirect } from 'next/navigation';

/** Tournaments live on /events; keep the old URL working. */
export default function TournamentsPage() {
    redirect('/events');
}
