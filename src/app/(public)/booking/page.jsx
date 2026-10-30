import { buildMetadata } from '../../../lib/seo';
import BookingClient from './BookingClient';

export const metadata = buildMetadata({ title: 'Book a Turf Slot', description: 'Pick a date and time, pay the advance online and get your match pass for Crossbar Metro Arena.', path: '/booking' });

export default function BookingPage() {
    return <BookingClient />;
}
