# Crossbar Metro Arena - Turf Booking & Tournaments

Crossbar Metro Arena is a high-performance sports booking & tournament web platform for Dhaka's premier outdoor football turf, located next to Uttara Metro Center (MRT Line-6).

Built with **Next.js 15 (App Router)** utilizing **Group Routing `(group)`**, Tailwind CSS, and React 19.

---

## 📁 Next.js App Router Group Routing Architecture

The application is structured using Next.js App Router route groups (`(group)`) to provide clean separation of concerns, independent layouts, and clean URLs:

```
src/
├── app/
│   ├── (public)/                 # Route Group for fans, players & public visitors
│   │   ├── layout.tsx            # Public layout (Crossbar Navbar, Live Ticker, Footer)
│   │   ├── page.tsx              # Home / Interactive Arena Hub (Hero + Live Courts + Highlights)
│   │   ├── booking/              # Dedicated Court Slot Booking Engine
│   │   │   └── page.tsx          # Pitch Alpha 7v7, Pitch Bravo 5v5, slot matrix & checkout
│   │   ├── tournaments/          # Championships & Prize Cups Hub
│   │   │   └── page.tsx          # ৳60K+ tournament rosters, brackets, team registration
│   │   ├── matches/              # Matchday Center & Fixtures
│   │   │   └── page.tsx          # Real-time kickoffs, community squad challenge board
│   │   ├── squad-builder/        # Tactical Lineup & Squad Builder
│   │   │   └── page.tsx          # Interactive tactical pitch, formations, kit customizer
│   │   └── venue/                # Venue Location & Metro Connectivity
│   │       └── page.tsx          # Uttara Center MRT Line-6 guide, pitch specifications
│   │
│   ├── (user)/                   # Route Group for Player Account & Passes
│   │   ├── layout.tsx            # Player portal header & back navigation
│   │   └── passes/               # Digital Match Passes Wallet
│   │       └── page.tsx          # Gate entry QR passes, status, WhatsApp squad invites
│   │
│   ├── (admin)/                  # Route Group for Arena Operations & Staff
│   │   ├── layout.tsx            # Arena manager shell with live revenue ticker
│   │   └── admin/                # Arena Manager Portal
│   │       └── page.tsx          # Live revenue, slot manager, payment toggle, manual entry
│   │
│   ├── globals.css               # Global styles, Tailwind CSS v4, sports typography
│   ├── layout.tsx                # Root layout with fonts, metadata, ArenaProvider & GlobalModals
│   └── not-found.tsx             # Custom sports-themed 404 page ("Shot Hit The Crossbar")
│
├── components/                   # Modular UI components
│   ├── Navbar.tsx                # Sticky navbar with responsive drawer & active route badges
│   ├── Footer.tsx                # Arena footer with facilities, hotline & quick links
│   ├── BookingSection.tsx        # Slot matrix, date selector & court cards
│   ├── BookingModal.tsx          # Slot booking checkout & payment selection
│   ├── TournamentSection.tsx     # Tournament cards, prize pool & registration
│   ├── TournamentModal.tsx       # Tournament team entry modal with bKash/Nagad verification
│   ├── MatchTrackerSection.tsx   # Live fixtures & squad matchmaking challenges
│   ├── TurfWeatherWidget.tsx     # Live Dhaka/Uttara pitch playability & weather
│   ├── SquadBuilderModal.tsx     # Squad builder modal
│   ├── TicketPassModal.tsx       # Digital matchday QR pass modal
│   ├── ArenaManagerModal.tsx     # Quick admin popup modal
│   ├── MyPassesDrawer.tsx        # Slide-over match passes drawer
│   └── GlobalModals.tsx          # Centralized modal host
│
├── context/
│   └── ArenaContext.tsx          # Shared state for bookings, tournaments & reactive updates
├── data/
│   └── initialData.ts            # Default pitches, tournaments, and venue constants
├── utils/
│   └── storage.ts                # SSR-safe local storage & persistence utilities
└── types.ts                      # Shared TypeScript data models
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.17+ or v20+)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the arena platform.

### 3. Production Build & Static Validation
```bash
npm run build
npm start
```

---

## 🔎 SEO & Google Search setup

Everything on-page is already wired up (see `src/lib/seo.js`):

- `<title>` / description / canonical / Open Graph / Twitter cards on every public page via `buildMetadata()`
- 1200x630 social card generated at `/opengraph-image` (`src/app/opengraph-image.jsx`)
- JSON-LD graph: `Organization` + `WebSite` + `SportsActivityLocation`/`LocalBusiness` (root layout), plus per page `WebPage`, `BreadcrumbList`, `FAQPage` (about, booking), `Service`/`OfferCatalog` (booking), `SportsEvent` list (events), `Product` list (shop) and `ImageGallery` (gallery). Event, product and gallery schema is read from MongoDB and revalidated every 10 minutes.
- `/robots.txt`, `/sitemap.xml` (real `lastmod` from the database) and `/manifest.webmanifest`
- Admin, investor, player, API and auth routes are `noindex` (meta tag + `X-Robots-Tag` header)
- `/tournaments` → `/events` and `/signup` → `/register` are 308 permanent redirects

One-time launch checklist (cannot be done from code):

1. Set `NEXT_PUBLIC_BASE_URL=https://bookcrossbar.com` in production so canonicals, sitemap and JSON-LD use the live domain.
2. **Google Search Console** → add property `bookcrossbar.com` → choose *HTML tag* → paste the `content` value into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, redeploy, click *Verify*. Then submit `https://bookcrossbar.com/sitemap.xml` under *Sitemaps* and request indexing for `/`, `/booking`, `/events`.
3. **Bing Webmaster Tools** → same flow with `NEXT_PUBLIC_BING_SITE_VERIFICATION` (or import from Search Console).
4. **Google Business Profile** → create/claim "Crossbar Metro Arena", category *Soccer field* / *Sports complex*, address Uttara Metro Center, Sector 17, Dhaka 1230, phone +880 1796-337133, website `https://bookcrossbar.com`, hours 6:00 AM–12:00 AM daily. Add photos and ask players for reviews — this is the biggest ranking lever for "turf near me" searches.
5. Optional: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX` enables Google Analytics 4.
6. Validate with https://search.google.com/test/rich-results and https://validator.schema.org after deploy.
