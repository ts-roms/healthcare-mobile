/**
 * Portal API client. Each function is named after the endpoint it stands in for.
 *
 * DEMO: the bodies read and write the in-memory store in `demo.ts`. To go live, replace each
 * body with a call to `/api/v1/portal/...` through the session's authorised fetch, keeping the
 * signature. No response is ever persisted to the device (decision D10).
 */
import { createDemoStore, DEMO_LOGIN, DEMO_TIME_ZONE } from './demo';
import type {
  Appointment,
  Billing,
  BookingDay,
  BookingDoctor,
  BookingService,
  BookingSlot,
  ChannelPrefs,
  CheckInQr,
  CommunicationPreferences,
  LabResult,
  Me,
  Message,
  PrefCategory,
  Prescription,
  ResultTrend,
  Teleconsult,
} from './types';

let store = createDemoStore();

/** Called on sign-out so nothing from the previous session stays in memory. */
export function resetDemoStore() {
  store = createDemoStore();
}

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

// ── Auth ─────────────────────────────────────────────────────────────

/** POST /portal/auth/login */
export async function login(identifier: string, password: string): Promise<{ mfaRequired: true; destination: string }> {
  await wait(500);
  if (identifier.trim().toLowerCase() !== DEMO_LOGIN.email || password.length < 8) {
    throw new ApiError('That email or password doesn’t match our records.', 'invalid_credentials');
  }
  return { mfaRequired: true, destination: store.me.contact.mobileMasked };
}

/** POST /portal/auth/mfa/verify */
export async function verifyMfa(code: string): Promise<{ ok: true }> {
  await wait(400);
  if (code !== DEMO_LOGIN.code) throw new ApiError('That code isn’t right. Check the latest text and try again.', 'invalid_code');
  return { ok: true };
}

/** POST /portal/auth/mfa/resend */
export async function resendMfa(): Promise<void> {
  await wait(300);
}

/** POST /portal/auth/activation-card → /portal/auth/activate */
export async function activate(input: { patientNumber: string; firstName: string; birthDate: string; code: string; password: string }): Promise<{ ok: true }> {
  await wait(600);
  if (!/^\d{6}$/.test(input.code)) throw new ApiError('Enter the 6-digit code the clinic sent you.', 'invalid_code');
  if (input.password.length < 10) throw new ApiError('Use at least 10 characters for your password.', 'weak_password');
  if (!/^\d{2}\s*\/\s*\d{2}\s*\/\s*\d{4}$/.test(input.birthDate)) throw new ApiError('Enter your birth date as MM / DD / YYYY.', 'invalid_birth_date');
  return { ok: true };
}

/** DEMO only: what the clinic card's QR would resolve to. */
export async function readActivationCard(): Promise<{ patientNumber: string; firstName: string; clinic: string }> {
  await wait(200);
  return { patientNumber: store.me.patient.number, firstName: store.me.patient.firstName, clinic: store.me.clinic.name };
}

// ── Account ──────────────────────────────────────────────────────────

/** GET /portal/me */
export async function getMe(): Promise<Me> {
  await wait();
  return clone(store.me);
}

/** GET /portal/qr */
export async function getCheckInQr(): Promise<CheckInQr> {
  await wait();
  return clone(store.qr);
}

/** GET /portal/communication-preferences */
export async function getPreferences(): Promise<CommunicationPreferences> {
  await wait();
  return clone(store.preferences);
}

/** PUT /portal/communication-preferences */
export async function updatePreference(category: PrefCategory, channel: keyof ChannelPrefs, value: boolean): Promise<CommunicationPreferences> {
  await wait(150);
  const c = store.preferences.categories.find((x) => x.id === category);
  if (c) c.channels[channel] = value;
  return clone(store.preferences);
}

// ── Care ─────────────────────────────────────────────────────────────

/** GET /portal/appointments */
export async function getAppointments(): Promise<Appointment[]> {
  await wait();
  return clone(store.appointments).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** GET /portal/teleconsults */
export async function getTeleconsults(): Promise<Teleconsult[]> {
  await wait();
  return clone(store.teleconsults);
}

/** GET /portal/results */
export async function getResults(): Promise<LabResult[]> {
  await wait();
  return clone(store.results);
}

/** GET /portal/results/:id */
export async function getResult(id: string): Promise<LabResult> {
  await wait();
  const r = store.results.find((x) => x.id === id);
  if (!r) throw new ApiError('This result isn’t available.', 'not_found');
  return clone(r);
}

/** GET /portal/results/trend?testId= */
export async function getResultTrend(testId: string): Promise<ResultTrend> {
  await wait();
  const t = store.trends[testId];
  if (!t) throw new ApiError('No history for this test yet.', 'not_found');
  return clone(t);
}

/** GET /portal/prescriptions */
export async function getPrescriptions(): Promise<Prescription[]> {
  await wait();
  return clone(store.prescriptions);
}

// ── Messages ─────────────────────────────────────────────────────────

/** GET /portal/messages */
export async function getMessages(): Promise<Message[]> {
  await wait();
  return clone(store.messages).sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

/** GET /portal/messages/unread-count */
export async function getUnreadCount(): Promise<number> {
  await wait(100);
  return store.messages.filter((m) => !m.read).length;
}

/** POST /portal/messages/:id/read */
export async function markMessageRead(id: string): Promise<void> {
  await wait(100);
  const m = store.messages.find((x) => x.id === id);
  if (m) m.read = true;
}

// ── Billing ──────────────────────────────────────────────────────────

/** GET /portal/billing */
export async function getBilling(): Promise<Billing> {
  await wait();
  return clone(store.billing);
}

// ── Booking ──────────────────────────────────────────────────────────

/** GET /portal/booking/services */
export async function getBookingServices(): Promise<BookingService[]> {
  await wait();
  return clone(store.services);
}

/** GET /portal/booking/doctors?serviceId= */
export async function getBookingDoctors(_serviceId: string): Promise<BookingDoctor[]> {
  await wait(150);
  return clone(store.doctors);
}

function ymd(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DEMO_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** GET /portal/booking/days?doctorId= — the next six clinic days (Mon–Sat). */
export async function getBookingDays(doctorId: string): Promise<BookingDay[]> {
  await wait(150);
  const days: BookingDay[] = [];
  const cursor = new Date(Date.now() + 86_400_000);
  while (days.length < 6) {
    const date = ymd(cursor);
    const dow = new Date(`${date}T12:00:00+08:00`).getUTCDay();
    if (dow !== 0) {
      const seed = Number(date.slice(-2)) + doctorId.length;
      days.push({ date, available: seed % 4 !== 1 });
    }
    cursor.setTime(cursor.getTime() + 86_400_000);
  }
  return days;
}

/** GET /portal/booking/slots?doctorId=&date= */
export async function getBookingSlots(doctorId: string, date: string): Promise<BookingSlot[]> {
  await wait(150);
  const seed = Number(date.slice(-2)) + doctorId.length;
  return Array.from({ length: 9 }, (_, i) => {
    const minutes = 8 * 60 + i * 20;
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    const startsAt = `${date}T${hh}:${mm}:00+08:00`;
    const taken = store.appointments.some((a) => a.startsAt === startsAt) || (i + seed) % 3 === 1;
    return { startsAt, available: !taken };
  });
}

/** POST /portal/appointments */
export async function bookAppointment(input: { serviceId: string; doctorId: string; startsAt: string }): Promise<Appointment> {
  await wait(600);
  const service = store.services.find((s) => s.id === input.serviceId);
  const doctor = store.doctors.find((d) => d.id === input.doctorId);
  if (!service || !doctor) throw new ApiError('That time is no longer available. Pick another.', 'slot_unavailable');
  const appt: Appointment = {
    id: `apt_${Date.now()}`,
    startsAt: input.startsAt,
    doctorName: doctor.name,
    specialty: doctor.specialty,
    location: store.me.clinic.branch,
    service: service.name,
    mode: service.mode,
    status: 'booked',
  };
  store.appointments.push(appt);
  return clone(appt);
}
