/**
 * Visible FAQ content. The same arrays feed the FAQPage JSON-LD on the About and Booking pages,
 * so every answer here must stay on the page (Google only honours FAQ markup that users can see).
 */
export const BOOKING_FAQ = [
    {
        q: 'How do I book a football turf slot at Crossbar Metro Arena?',
        a: 'Open the Book a Slot page, pick a date up to 60 days ahead, choose one of the 12 daily 90-minute slots and pay online. You can pay a small advance (currently BDT 500) or the full amount with bKash, Nagad or any Visa/Mastercard through EPS. Your digital match pass is issued instantly.'
    },
    {
        q: 'How much does a 90-minute turf slot cost in Uttara?',
        a: 'During the grand-opening launch offer, weekday slots (Sunday to Thursday) cost BDT 2,500 to BDT 5,500 and weekend slots (Friday and Saturday) cost BDT 3,000 to BDT 6,500 per 90 minutes, up to BDT 2,000 below the regular price. The full 12-slot rate card, with regular and offer prices, is published on the About page and inside the booking engine.'
    },
    {
        q: 'Can I cancel or reschedule my turf booking?',
        a: 'Yes. Cancellations or date changes requested at least 24 hours before kickoff are handled by the arena desk, and advances can be moved to a new slot or refunded according to the posted refund policy. Call or WhatsApp the hotline with your booking code.'
    },
    {
        q: 'Do I need an account to book a slot?',
        a: 'No. Visitors can book as a guest with a Bangladeshi mobile number. Creating a free player account lets you see all your passes, manage your team and post match results from one dashboard.'
    },
    {
        q: 'What footwear is allowed on the turf?',
        a: 'Turf shoes (TF) or rubber moulded studs (AG) are required on the 50 mm shock-pad artificial grass. Metal or screw-in studs are not allowed.'
    }
];

export const ABOUT_FAQ = [
    {
        q: 'Where is Crossbar Metro Arena located?',
        a: 'Crossbar Metro Arena is at Uttara Metro Center, Sector 17, Dhaka 1230, directly beside Uttara Center Metro Station on MRT Line-6. It is a two-minute walk from the station exit and has free guarded parking for cars and bikes.'
    },
    {
        q: 'What are the opening hours of the turf?',
        a: 'The arena is open every day from 6:30 AM to 12:30 AM. The day is divided into 12 fixed 90-minute slots, starting at 6:30 AM and ending at 12:30 AM, so there is always a clear kickoff and finish time.'
    },
    {
        q: 'What size is the pitch and what format can we play?',
        a: 'The main turf measures 120 ft x 75 ft, a FIFA-standard small-sided pitch built for 7v7 football, and it comfortably hosts 5v5 to 8v8 matches with 10 to 16 players. The surface is 50 mm monofilament shock-pad artificial grass with cool infill.'
    },
    {
        q: 'Is the turf floodlit for night matches?',
        a: 'Yes. Pro 400-lux high-mast LED floodlights light the entire pitch, so evening and late-night slots play like a stadium with no shadows. An electronic scoreboard and match clock are included with every slot.'
    },
    ...BOOKING_FAQ.slice(0, 2),
    {
        q: 'Can we host a tournament or corporate football event?',
        a: 'Yes. Crossbar Metro Arena runs 7v7 and 5v5 knockout and league tournaments with cash prize pools, and the pitch can be block-booked for corporate cups, school leagues and community events. See the Events page for open registrations or contact the arena desk for a custom package.'
    },
    {
        q: 'What facilities are available for players?',
        a: 'Covered player dugouts, changing rooms and restrooms with daily sanitation, a warm-up deck, an in-house shop for match balls, shin guards, grip socks and hydration, plus free guarded parking and the metro skyline view.'
    }
];
