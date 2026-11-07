/**
 * Shapes of the `/api/v1/portal/*` responses this app reads.
 *
 * NOTE: these are modelled on the screens in design/README.md, not copied from the portal
 * API contract (docs/architecture/portal-app.md is not in this repository). Confirm each
 * field against the real contract before wiring `src/data/api.ts` to the network.
 */

export type ResultFlag = 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low' | 'abnormal';

export type Me = {
  patient: {
    id: string;
    number: string;
    firstName: string;
    fullName: string;
    initials: string;
  };
  clinic: { name: string; organization: string; branch: string; timeZone: string };
  contact: { mobileMasked: string; emailMasked: string; emailVerified: boolean };
  security: { mfaEnabled: boolean; passkeys: number };
  /** `reviewed` is true only after a clinician recorded an allergy review. */
  allergies: { reviewed: boolean; items: string[] };
};

export type Appointment = {
  id: string;
  startsAt: string;
  doctorName: string;
  specialty: string;
  location: string;
  service: string;
  mode: 'in_person' | 'online';
  status: 'booked' | 'completed' | 'cancelled';
  instructions?: string;
};

export type Teleconsult = {
  id: string;
  startsAt: string;
  doctorName: string;
  questionsPending: number;
};

export type LabResult = {
  id: string;
  testId: string;
  name: string;
  /** Display value exactly as released ("7.9", "Normal"). */
  value: string;
  numericValue: number | null;
  unit: string;
  /** Usual-range text as released ("4.0–5.6", "below 100"). */
  rangeText: string;
  low: number | null;
  high: number | null;
  flag: ResultFlag;
  collectedAt: string;
  orderNo: string;
  releasedBy: string;
  isNew: boolean;
};

export type TrendPoint = { collectedAt: string; value: number; low: number | null; high: number | null };

export type ResultTrend = { testId: string; name: string; unit: string; points: TrendPoint[] };

export type Prescription = {
  id: string;
  number: string;
  drug: string;
  form: string;
  purpose: string;
  directions: string;
  note?: string;
  prescriber: string;
  prescribedAt: string;
  quantity: string;
  status: 'active' | 'completed';
};

export type Message = {
  id: string;
  kind: 'notice' | 'message';
  from: string;
  initials: string;
  sentAt: string;
  subject: string;
  body: string;
  read: boolean;
  /** Colour family for the sender avatar. */
  sender: 'clinic' | 'doctor' | 'billing' | 'staff';
};

export type Invoice = {
  id: string;
  number: string;
  title: string;
  issuedAt: string;
  status: 'due' | 'paid';
  lines: { label: string; amount: number }[];
  adjustments: { label: string; amount: number }[];
  total: number;
  balance: number;
  payment?: { method: string; receiptNo: string; amount: number };
};

export type Billing = {
  balance: number;
  credit: number;
  /** True only when the clinic has configured an online payment provider. */
  onlinePayment: { available: boolean; methods: string };
  invoices: Invoice[];
};

export type ChannelPrefs = { push: boolean; sms: boolean; email: boolean };
export type PrefCategory = 'care' | 'appointments' | 'optional';

export type CommunicationPreferences = {
  categories: { id: PrefCategory; label: string; hint: string; channels: ChannelPrefs }[];
  destinations: { device: string | null; sms: string; email: string };
};

export type CheckInQr = { key: string; issuedAt: string; status: 'active' | 'revoked' };

export type BookingService = { id: string; name: string; durationMin: number; mode: 'in_person' | 'online'; price: number | null };
export type BookingDoctor = { id: string; name: string; specialty: string; initials: string };
export type BookingDay = { date: string; available: boolean };
export type BookingSlot = { startsAt: string; available: boolean };
