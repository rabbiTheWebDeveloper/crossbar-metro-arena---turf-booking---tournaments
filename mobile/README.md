# Crossbar Metro Arena — Mobile App (React Native / Expo)

Native Android/iOS client for the Crossbar Metro Arena platform. It talks to the same REST API as
the website (`https://www.bookcrossbar.com/api/*`, the Next.js route handlers in `../src/app/api`),
so bookings, payments, tournaments, shop orders and the admin / investor portals share one database.

- Expo SDK 58 · React Native 0.88 · React 19 · Expo Router (file-based navigation)
- JavaScript (`.jsx`), no TypeScript — same conventions as the web project
- Android package: `com.bookcrossbar.app`

## Features

| Area | Screens |
| --- | --- |
| Public | Home, Book a Slot (12-slot matrix, add-ons, SSLCommerz checkout), Match Day (results, standings), Matches & challenges, Events / tournaments + team registration, Shop + cart + pickup reservation, Gallery, Squad builder, Venue, About / FAQ |
| Account | Login, Register, Player dashboard (bookings, passes, teams, results, challenges, orders, profile) |
| Admin (Arena Desk) | Today, Schedule, All bookings, Fixed weekly slots, Financial report, Investors, Slot pricing, Refunds, Shop orders, Products, Registrations, Players, Events, Match results, Gallery, walk-in booking, JSON backup |
| Investor | Overview, Bookings, Expenses, Payouts |

## Project structure

```
mobile/
├── app.json                  Expo config (name, icons, splash, plugins)
├── scripts/build-apk.ps1     One-command signed release APK build (Windows)
├── scripts/check-icons.js    Verifies every lucide icon import exists
├── __tests__/                Jest smoke tests: every screen, every role, against a mock API
└── src/
    ├── app/                  ROUTES (Expo Router). One file = one screen.
    │   ├── _layout.jsx       Root stack, providers, role guards, toast, global pass modal
    │   ├── (tabs)/           Bottom tabs: index (Home), results, booking, shop, me
    │   ├── events, matches, gallery, squad-builder, venue, about, cart, passes
    │   ├── login, register, payment (SSLCommerz WebView)
    │   ├── admin/            Arena Desk (admins only)
    │   └── investor/         Partner portal (investors + admins), its own tab bar
    ├── features/             Screen-specific components, grouped by area
    │   └── home/ booking/ events/ matchday/ shop/ gallery/ squad/ player/ admin/ investor/
    ├── components/           Shared components (CrossbarLogo, PageHero, TicketPassModal)
    │   └── ui/               UI kit: Screen, Sheet, Button, Input, Select, DateField, Card, Badge…
    ├── context/              ArenaContext (all data + actions), InvestorContext
    ├── lib/                  api (fetch + auth token), dateUtils, format, phone, storage
    ├── data/                 Static data: venue info, slot definitions, add-ons, FAQ, finance labels
    ├── theme/                Colours, spacing, radii, fonts
    └── config.js             API base URL and build flags
```

## Conventions

**Data & actions.** Screens never call `fetch` directly. Everything comes from `useArena()`
(`src/context/ArenaContext.jsx`), which mirrors the website's `ArenaContext`: the same state
(`bookings`, `pricing`, `tournaments`, `teams`, …) and the same `handle*` actions. Differences from
the web context:

| Website | App |
| --- | --- |
| `setShowAuthModal(true)` | `promptLogin('login' \| 'signup')` (navigates to `/login` or `/register`) |
| `setShowCartDrawer(true)` | `router.push('/cart')` |
| `setShowPassesDrawer(true)` | `router.push('/passes')` |
| `setShowSSLCommerzModal(true)` | `setPendingBookingData(draft)` then `router.push('/payment')` |
| ticket pass modal | `setActiveTicketPass(booking)` (modal is mounted once in the root layout) |
| `window.alert` / toasts | `showNotice('success' \| 'error' \| 'info', message)` |
| `window.confirm` | `await confirm(title, message, { confirmText, destructive })` from the UI kit |

**UI.** Import from `@/components/ui`. Colours, spacing and radii come from `@/theme` — no hard-coded
palette. Website modals and drawers become `<Sheet>`; tables become cards or rows.

**Text.** Every string must be inside `<AppText>`, `<Heading>`, `<Label>` or `<Mono>`. A bare string
(or a `0` / `''` leaking out of `cond && <X/>`) crashes React Native — use `cond ? <X/> : null`.
ESLint enforces this (`react-native/no-raw-text`).

**Dates & numbers.** Use `@/lib/dateUtils` and `@/lib/format` (`formatMoney`, `formatNumber`,
`formatIsoDate`, `todayDhakaIso`, …). Do not use `Intl`, `toLocaleString` or `toLocaleDateString`:
their output differs between Android devices. Dates are `YYYY-MM-DD` strings in Dhaka time.

**Navigation.** `const router = useRouter()` from `expo-router`, then `router.push('/events')`,
`router.navigate('/booking')` (tabs) or `router.back()`. Always pass complete hrefs.

**Icons.** `lucide-react-native` (same names as the website's `lucide-react`), with `size`, `color`,
`strokeWidth` props.

**Images.** `Image` from `expo-image` with an explicit size; wrap server paths with `absoluteUrl()`
from `@/lib/api`.

## Running in development

```bash
cd mobile
npm install
npx expo start            # needs a development build or an emulator (native modules are used)
npm run lint
npm run check:icons
npm test
```

Point the app at another server (for example a staging site) with an env var at build time:

```bash
EXPO_PUBLIC_API_URL=https://staging.example.com npx expo start
```

`EXPO_PUBLIC_DEMO_MODE=true` shows the one-tap demo role buttons on the login screen.

## Building the release APK (Windows)

```bash
cd mobile
npm run build:apk
```

The script (`scripts/build-apk.ps1`):

1. creates a release signing key on first run in `mobile/credentials/` (git-ignored);
2. mirrors the project to `C:\cma` — React Native's C++ build breaks on Windows when paths exceed
   260 characters, and this repository lives in a long folder;
3. runs `npm ci`, `expo prebuild` and `gradlew assembleRelease` for `armeabi-v7a` + `arm64-v8a`;
4. copies the result to `mobile/release/CrossbarMetroArena-v<version>.apk`.

Requirements: Node 20+, JDK 17, Android SDK (platform 36/37, build-tools 36, NDK 27.1, CMake 3.22).
The first build compiles React Native's C++ code and can take close to an hour on a small machine;
later builds reuse it and take a few minutes.

If the build stops with `ninja: error: mkdir(...): No such file or directory`, a path is still too
long: pass a shorter folder (`-BuildDir C:\c`) or a lower `-CmakeObjectPathMax`.

> **Back up `mobile/credentials/`.** Android only installs an update over an existing app when it
> is signed with the same key. For Google Play, upload an `.aab` instead (`gradlew bundleRelease`).

Before every new release, bump `version` and `android.versionCode` in `app.json`.

## Tests

`npm test` boots the real app (routes, context, UI kit) inside Jest against an in-memory copy of
the API (`__tests__/helpers/mockServer.js`; public data is a capture of the live site) and:

- `smoke.test.js` — opens every screen as visitor, player, investor and admin, checks the role
  guards, and checks that the data it was given is on screen;
- `interactions.test.js` — on every screen, types into every field and taps every control
  (sheets, tabs, buttons), failing on any exception or React error. Slow; run one role with
  `npx jest interactions -t admin`.

These run in Node, not on a phone: they catch crashes and wiring mistakes, not layout problems.

## Authentication

The API signs a JWT at login and sends it in the `cma_auth_token` cookie; every protected route
also accepts `Authorization: Bearer <token>`. The app reads the token from the login response and
stores it in the Android Keystore / iOS Keychain (`expo-secure-store`). See `src/lib/api.js`.

## Online payment

`/payment` asks the server for an SSLCommerz session (`POST /api/payment/sslcommerz/init`; the server
prices the booking and holds the slot), opens the hosted gateway page in a WebView and watches for
the redirect back to `/booking?payment=…`. The booking is confirmed server-side by the gateway
callback / IPN — the app only reads the result.
