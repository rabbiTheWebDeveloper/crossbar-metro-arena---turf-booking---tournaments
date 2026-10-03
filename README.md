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
