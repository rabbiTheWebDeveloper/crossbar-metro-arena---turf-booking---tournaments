import { buildMetadata, webPageSchema, faqSchema, bookingServiceSchema } from '../../../lib/seo';
import { JsonLd } from '../../../components/JsonLd';
import { BOOKING_FAQ } from '../../../data/faq';
import { fetchSiteSettings } from '../../../lib/seoData';
import BookingClient from './BookingClient';

// Slot prices in the Service schema follow the admin rate card; refresh every 10 minutes.
export const revalidate = 600;

const title = 'Book a Football Turf Slot Online';
const description = 'Book a 90-minute floodlit football turf slot in Uttara, Dhaka. Pick any date up to 60 days ahead, pay a BDT 500 advance or the full amount with bKash, Nagad or card, and get an instant digital match pass.';

export const metadata = buildMetadata({
    title,
    description,
    path: '/booking',
    keywords: ['book turf slot dhaka', 'turf booking uttara online', 'bkash turf booking', 'football ground booking dhaka']
});

export default async function BookingPage() {
    const settings = await fetchSiteSettings();
    return (<>
      <JsonLd id="booking" data={[
            webPageSchema({ path: '/booking', title, description, type: 'CheckoutPage', breadcrumbs: [{ name: 'Book a Slot', path: '/booking' }] }),
            bookingServiceSchema(settings?.slotPrices, settings?.advanceAmount || 500),
            faqSchema(BOOKING_FAQ)
        ]}/>
      <BookingClient />
    </>);
}
