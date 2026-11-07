/**
 * Response shapes of the MyHealth API (`/api/v1/portal/*`) that this app reads, mirrored by hand from the platform's web
 * portal (`apps/portal/src/lib/api/types.ts`), as decision D12 records, until a published API contract exists.
 * Results come from `@/domain/portal-results` (a copy of `@healthcare/domain/portal-results`). Amounts are integer centavos.
 */
export type { PortalResult, PortalResultFlag, PortalTrend } from '@/domain/portal-results';

/** `POST /portal/auth/login`, `/auth/mfa/verify`, `/auth/refresh`, `/auth/activate` */
export interface PortalTokenResponse {
  status: 'authenticated';
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface PortalMfaRequired {
  status: 'mfa_required';
  challengeToken: string;
  passkeys?: boolean;
}

/** `GET /portal/me` */
export interface PortalMe {
  patient: { displayName: string; givenName: string; familyName: string; patientNumber: string; birthDate: string; sex: string };
  organization: { name: string };
  account: { email: string; emailVerified: boolean; mfaEnabled: boolean };
  mfaPolicy: { required: boolean; requiredFrom: string | null; enrollmentRequired: boolean };
  /** The patient's clinic's time zone: dates are shown in it (a visit uses its own facility's). */
  timeZone: string;
  acting: { relationship: string; scopes: ('view' | 'act')[] } | null;
}

/** `GET /portal/appointments` row */
export interface PortalAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  reason: string | null;
  visitType: string;
  modality: 'in_person' | 'telemedicine';
  practitionerName: string;
  facilityName: string;
  timeZone: string;
  version: number;
  facilityId: string;
  practitionerId: string;
  visitTypeId: string;
  bookedByPatient: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canCheckIn: boolean;
  checkInOpensAt: string | null;
  queueTicket: string | null;
}

export interface PortalAppointments {
  upcoming: PortalAppointment[];
  past: PortalAppointment[];
}

/** `GET /portal/prescriptions` row (active prescriptions) */
export interface PortalPrescription {
  id: string;
  prescriptionNumber: string;
  issuedAt: string;
  prescriberName: string | null;
  notes: string | null;
  items: PortalPrescriptionItem[];
}

export interface PortalPrescriptionItem {
  genericName: string;
  brandName: string | null;
  strength: string | null;
  dosageForm: string | null;
  doseAmount: number | null;
  doseUnit: string | null;
  route: string;
  frequency: string;
  frequencyText: string | null;
  asNeededReason: string | null;
  durationValue: number | null;
  durationUnit: 'days' | 'weeks' | 'months' | null;
  quantity: number;
  quantityUnit: string;
  refills: number;
  instructions: string;
}

/** `GET /portal/teleconsults` row */
export interface PortalTeleconsult {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  practitionerName: string;
  visitType: string;
  status: 'scheduled' | 'waiting' | 'in_consultation' | 'ended' | 'escalated';
  questionnaireSubmitted: boolean;
  waitingRoomOpensAt: string;
}

/** `GET /portal/qr`: `payload` is the key to draw; null until the clinic uses codes and has issued one. */
export interface PortalQr {
  enabled: boolean;
  issued: boolean;
  payload: string | null;
  patientNumber: string;
}

/** `GET /portal/booking/options` */
export interface BookingOptions {
  visitTypes: { id: string; name: string; modality: 'in_person' | 'telemedicine'; durationMinutes: number }[];
  facilities: {
    id: string;
    name: string;
    cityMunicipality: string | null;
    timeZone: string;
    practitioners: { id: string; displayName: string; specialty: string | null }[];
    rules: { minLeadMinutes: number; maxAdvanceDays: number; maxUpcoming: number; changeCutoffMinutes: number };
  }[];
}

/** `GET /portal/booking/slots` */
export interface BookingSlots {
  date: string;
  timeZone: string;
  durationMinutes: number;
  slots: { startsAt: string; endsAt: string; practitionerId: string; practitionerName: string }[];
}

/** `GET /portal/messages` row: an in-app notice, rendered by the API. */
export interface PortalMessage {
  id: string;
  templateKey: string;
  subject: string | null;
  text: string;
  createdAt: string;
  readAt: string | null;
}

export type MessageTopic = 'general' | 'appointment' | 'results' | 'medication' | 'billing' | 'other';

/** `GET /portal/message-threads` row: a conversation with the clinic. */
export interface PortalThread {
  id: string;
  topic: MessageTopic;
  subject: string;
  status: 'open' | 'closed';
  startedBy: 'patient' | 'staff';
  messageCount: number;
  lastMessageAt: string;
  lastMessageFrom: 'patient' | 'staff';
  unread: boolean;
}

export interface PortalThreadMessage {
  id: string;
  sender: 'patient' | 'staff';
  senderName: string | null;
  body: string;
  viaGuardian: boolean;
  createdAt: string;
}

export interface PortalThreadDetail extends PortalThread {
  messages: PortalThreadMessage[];
}

/** `GET /portal/billing` row: an issued (or voided) invoice. Amounts are integer centavos (PHP). */
export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  status: 'issued' | 'void';
  issuedAt: string;
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  payerTotal: number;
  patientTotal: number;
  paidTotal: number;
  balance: number;
  items: { description: string; serviceDate: string; quantity: number; grossAmount: number; discountAmount: number; netAmount: number }[];
  discounts: { name: string; amount: number }[];
  payers: { name: string; amount: number; status: 'pending' | 'submitted' | 'settled' | 'denied' }[];
  payments: { kind: 'payment' | 'refund'; amount: number; method: string; receiptNumber: string | null; recordedAt: string }[];
}

/** `GET /portal/billing/account` row: the deposit and credit balance at one facility. */
export interface PortalAccount {
  facilityName: string;
  balance: number;
}

/** `GET /portal/billing/online-payment` */
export interface PortalOnlinePayment {
  available: boolean;
  name: string;
  note: string;
}

export type PreferenceChannel = 'sms' | 'email' | 'push';
export type PreferenceCategory = 'clinical' | 'administrative' | 'outreach';

export interface PortalPreference {
  channel: PreferenceChannel;
  category: PreferenceCategory;
  /** The patient's own choice; null: the default (`enabled`) applies. */
  choice: boolean | null;
  enabled: boolean;
  recordedVia: 'clinic' | 'myhealth' | null;
  updatedAt: string | null;
}

/** `GET /portal/communication-preferences` */
export interface PortalPreferences {
  destinations: Record<PreferenceChannel, string | null>;
  preferences: PortalPreference[];
}

/** A device that receives this account's notifications (`GET /portal/push`). */
export interface PushDevice {
  id: string;
  label: string;
  kind: 'web' | 'expo';
  createdAt: string;
  lastSuccessAt: string | null;
}

/** `GET /portal/push` */
export interface PushStatus {
  /** Push to browsers is offered. */
  configured: boolean;
  /** Push to this app is offered (`EXPO_PUSH_ENABLED` on the API). */
  mobileConfigured: boolean;
  devices: PushDevice[];
  /** The device with the token asked about, if it is registered. */
  thisDeviceId: string | null;
}
