# MyHealth — patient app (Expo)

The MyHealth patient app, built to the design in `../ui` (`ui/README.md` is the spec, `ui/screens/*.dc.html` the mockups).
Expo SDK 58, React Native 0.88, expo-router, TypeScript strict.

> **Demo data.** This project has no portal API client yet. Every screen reads through
> `src/data/api.ts`, whose functions are named after the `/api/v1/portal/*` endpoint they stand in
> for and currently return the in-memory data in `src/data/demo.ts`. Replace those bodies with real
> calls (and delete `demo.ts`) to go live. Nothing is stored on the device.

## Run

```bash
pnpm install
pnpm start          # then press w (web), i (iOS) or a (Android)
pnpm typecheck
pnpm test           # Vitest: formatting, range bar, trend chart and result-wording helpers
npx eslint .
```

Demo sign-in (dev builds only): the email is prefilled, any password of 8+ characters works, and
the code is shown under the code boxes. "Simulate a scan" on Activate fills the card details.

## Layout

| Path | What |
| --- | --- |
| `src/ui/theme.ts` | Design tokens: light/dark palettes, spacing, radii, elevation, Figtree type scale |
| `src/ui/ThemeProvider.tsx` | `useTheme()`: follows the system, with a System / Light / Dark override (Profile) |
| `src/ui/*` | Primitives: `Screen`, `PageTitle`, `Header`, `Section`, `Card`, `Button`, `IconButton`, `Chip`/`ChipGroup`, `SegmentedControl`, `Badge`, `ListRow`, `KeyValueRow`, `Switch`, `Checkbox`, `TextField`, `RangeBar`, `TrendChart`, `EmptyState`, `Notice`, `BottomActionBar`, `Avatar`, floating `TabBar` |
| `src/domain/results.ts` | Result-flag wording (colour + icon + words), grouping, exact allergy wording |
| `src/lib/format.ts` | Dates in the clinic time zone (from `GET /portal/me`), money |
| `src/lib/session.tsx` | Demo session (see the rules in its header before wiring real auth) |
| `src/data/` | `types.ts` (response shapes), `api.ts` (endpoint stand-ins), `demo.ts` (mock data), `useApi` |
| `src/app/` | Routes (below) |

## Screens

| Design # | Route | Status |
| --- | --- | --- |
| 01 Sign in + code | `/sign-in` | Built. Fingerprint button left out (D5). "Trust this phone" left out (web-only). |
| 02 Home | `/(tabs)/index` | Built |
| 03 Results | `/(tabs)/results` | Built, with the "Outside usual range" filter |
| 04 Result detail | `/results/[id]` | Built, with the trend chart (per-sample usual range) |
| 05 Book a visit | `/book` | Built |
| — Visits tab | `/(tabs)/visits` | Built (upcoming + past, links to Book) |
| 06 Medicines | `/(tabs)/medicines` | Built: prescriptions and allergies only |
| 07 Messages | `/(tabs)/messages`, `/messages/[id]` | Built; opening a message marks it read |
| 08 Profile | `/profile` | Built, with the theme picker and sign-out |
| 09 Bills | `/bills` | Built; "Pay online" only when `onlinePayment.available` |
| 10 Notifications | `/notifications` | Channel matrix and "Sent to" built |
| 11 Check-in QR | `/qr` | Built; QR drawn locally from the key (`qrcode-generator`) |
| 12 Scan card → activate | `/activate` | Built without a live camera (see below) |
| 13–14 Online consult, video | `/consult` | Placeholder only — needs D8. Keeps the 911 red-flag copy. |
| 15–17 Dark | all | Dark tokens applied everywhere |

### Needs API (left out, not faked)

- Medicine "Today" check-offs, the "Reminders on" pill, and the "Supply left" bar.
- Health-facts explainer per test and "Down 1.2 points since…" on result detail.
- Result search; result/invoice/receipt/e-prescription PDFs ("Share or download", "Invoice PDF"…).
- Compose a new message ("New message"); the API only lists and marks read.
- Change or cancel a booked visit.
- Edit contact details from the app.
- `src/data/types.ts` is modelled on the screens — check every field against `docs/architecture/portal-app.md`.

### Needs decision

- **D5** biometric unlock ("Use fingerprint").
- **D8** online consultation in the app vs. MyHealth in the browser (screens 13–14).
- **D9** device permissions: camera for the card scan (`expo-camera`), calendar for "Add to calendar", push for medicine reminders and "Send a test notification" (`expo-notifications`).
- Storage module for the theme override (expo-secure-store or AsyncStorage); it is in memory for now.

### Not in this build yet

Forms to sign (`/forms`), People I care for (`/people`) and the acting-for banner, Privacy and consents, and Security settings screens.
