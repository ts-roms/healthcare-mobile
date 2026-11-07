# MyHealth — patient app (Expo)

The MyHealth patient app, built to the design in `../ui` (`ui/README.md` is the spec, `ui/screens/*.dc.html` the mockups),
against the Healthcare Platform's MyHealth API (`/api/v1/portal/*`). Expo SDK 58, React Native 0.88, expo-router, TypeScript strict.

## Set up

```bash
pnpm install
cp .env.example .env.local   # then edit it
pnpm start                   # scan the QR code with Expo Go
```

`.env.local` (inlined into the app — never a secret):

| Variable | Meaning |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | The API, e.g. `http://192.168.1.10:3333/api/v1`. From a phone use the computer's LAN address, not `localhost`, and allow the port through the firewall. |
| `EXPO_PUBLIC_ORGANIZATION_CODE` | The organization this build serves (`organization.code`; the local demo seed uses `SEED_ORG_CODE`). |
| `EXPO_PUBLIC_PORTAL_BASE_URL` | Optional. MyHealth on the web; online consultations open there (D8). |

Restart Metro (`pnpm start --clear`) after changing it. The web build only works from an origin listed in the API's `CORS_ORIGINS`.

## Checks

```bash
pnpm typecheck
pnpm test        # unit tests: session rules, result wording, formatting, range bar, trend chart
npx eslint .
```

Against a running API (the demo seed's MyHealth account; reads, plus one preference flipped and restored):

```bash
MYHEALTH_IT_API=http://localhost:3333/api/v1 MYHEALTH_IT_ORG=<org> MYHEALTH_IT_EMAIL=<email> MYHEALTH_IT_PASSWORD=<password> pnpm vitest run src/data/api.int.test.ts
```

## How it talks to the API

- `src/lib/session.ts` — copied from `myhealth-mobile` (its unit tests too): access token in memory, refresh token in
  `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`), single-flight refresh, sign-out only when the API refuses the session,
  `X-Acting-For` only on routes that allow it. `src/lib/session-provider.tsx` is the React side (`useSession`, `useMe`).
- `src/data/api.ts` — one function per endpoint; `src/data/types.ts` mirrors the web portal's response types (D12).
- `src/domain/portal-results.ts` — copy of `@healthcare/domain/portal-results`: result wording identical to MyHealth on the web.
  `src/domain/wording.ts` mirrors the web's prescription, bill, notice, booking and notification wording.
- Nothing about the patient is stored on the device apart from the refresh token (D10). Times use the clinic's zone from
  `GET /portal/me`; visits use their facility's zone.

## Screens

| Route | API |
| --- | --- |
| `/sign-in` | `POST /portal/auth/login`, `/auth/mfa/verify` (authenticator or recovery code) |
| `/activate` | `POST /portal/auth/activate` (typed details; card scanning needs a camera — D9) |
| Home | `/portal/me`, `/appointments`, `/results`, `/prescriptions`, `/teleconsults`, `/messages` |
| Results, `/results/[testId]` | `/portal/results`, `/portal/results/trend` (chart + history with each value's range) |
| Visits | `/portal/appointments`, `POST /portal/appointments/:id/cancel` |
| `/book` | `/portal/booking/options`, `/booking/slots`, `POST /portal/appointments` |
| Medicines | `/portal/prescriptions` |
| Messages, `/messages/[id]`, `/messages/thread/[id]`, `/messages/new` | `/portal/messages` (+ read), `/portal/message-threads` (list, open, start, reply) |
| `/profile`, `/bills` | `/portal/me`; `/portal/billing`, `/billing/account`, `/billing/online-payment` |
| `/notifications` | `/portal/push` (this phone: on, test, off; devices), `GET/PUT /portal/communication-preferences` |
| `/qr` | `/portal/qr` (drawn on the phone from the key) |
| `/consult` | `/portal/teleconsults`; continues in MyHealth on the web (D8) |

## Push notifications (D6)

Ported from `myhealth-mobile` (`src/lib/push.ts`, `native-push.ts`, unit-tested): the app registers its Expo push token through
`POST /portal/push/mobile-devices`; tapping a notice opens the matching screen (`src/lib/push-route.ts`); signing out unregisters the
phone first. To receive them you need all of:

1. **A development or store build** — Expo Go cannot receive remote push (the screen says so). `npx eas-cli@latest build --profile development`.
2. **An Expo project id** — `npx eas-cli@latest init`, or `EAS_PROJECT_ID` (read by `app.config.ts`).
3. **Push turned on at the API** — `EXPO_PUSH_ENABLED=true` on the API and the notification worker (off in the local setup, so the
   screen says the clinic hasn't turned them on).
4. For Android store builds, the organization's Firebase credentials uploaded to the Expo project.

The project is ready for this: `eas.json` has `development` (dev client, installable APK), `preview` and `production` profiles;
`app.json` names the app `ph.healthcare.myhealth` on Android and iOS; `expo-dev-client` is installed; and the local API's `.env` has
`EXPO_PUSH_ENABLED=true` (restart the API and the notification worker after changing it). What is left needs your Expo account:

```bash
npx eas-cli@latest login                                   # once, with your Expo account
npx eas-cli@latest init                                    # links this folder to an Expo project (writes the project id)
npx eas-cli@latest credentials                             # Android → set up push (FCM V1) with the Firebase service account key
npx eas-cli@latest build --profile development --platform android
```

Install the APK it links to on the phone, then `pnpm start` (it opens the development build instead of Expo Go). In the app:
Profile → Notifications → turn on "This phone", then "Send a test". An iPhone build needs an Apple Developer account
(`--platform ios`, then register the device with `eas device:create`).

### Left out (no API, or waiting on a decision)

- Medicine check-offs, reminders, "Supply left", and an allergy card (no patient allergy endpoint).
- Result search; PDFs (result reports, invoices, receipts — endpoints exist, not built in the app); reschedule; paying online; attachments.
- Forms, People/acting-for,
  Privacy, email and two-step verification settings (on the web).
- D5 biometric unlock, D8 telemedicine in the app, D9 camera/calendar.
