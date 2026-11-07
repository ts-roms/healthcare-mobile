/**
 * DEMO DATA — stand-in for the Healthcare Platform portal API.
 *
 * Every screen reads through `src/data/api.ts`; this file is the only place the mock data
 * lives. It is held in memory only (nothing is written to the device). Replace the bodies of
 * the functions in `api.ts` with real `/api/v1/portal/*` calls and delete this file.
 *
 * Patient, clinic and IDs match ui/README.md (Maria Reyes Santos, P00000001, Demo Health).
 * Values flagged "invented for the mockups" in that README are kept so the screens look like
 * the design; real screens show only API data.
 */
import type {
  Appointment,
  Billing,
  BookingDoctor,
  BookingService,
  CheckInQr,
  CommunicationPreferences,
  LabResult,
  Me,
  Message,
  Prescription,
  ResultTrend,
  Teleconsult,
} from './types';

export const DEMO_TIME_ZONE = 'Asia/Manila';

/** Demo sign-in. Any password of 8+ characters works for this email; the code is 6 digits. */
export const DEMO_LOGIN = {
  email: 'maria.santos@demo.healthcare.ph',
  code: '123456',
};

/** Today's date in the clinic time zone as YYYY-MM-DD. */
function clinicToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DEMO_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function createDemoStore() {
  const me: Me = {
    patient: { id: 'pat_1', number: 'P00000001', firstName: 'Maria', fullName: 'Maria Reyes Santos', initials: 'MS' },
    clinic: { name: 'Demo Health · Main Clinic', organization: 'Demo Health', branch: 'Main Clinic', timeZone: DEMO_TIME_ZONE },
    contact: { mobileMasked: '+63 917 ••• 4821', emailMasked: 'm•••@demo.healthcare.ph', emailVerified: false },
    security: { mfaEnabled: true, passkeys: 1 },
    allergies: { reviewed: true, items: [] },
  };

  const appointments: Appointment[] = [
    {
      id: 'apt_2',
      startsAt: '2026-11-19T08:00:00+08:00',
      doctorName: 'Dr. Ana Santos',
      specialty: 'Internal Medicine',
      location: 'Main Clinic',
      service: 'Follow-up consultation',
      mode: 'in_person',
      status: 'booked',
      instructions: 'Fast for 8 hours before — we’ll recheck your sugar and HbA1c.',
    },
    {
      id: 'apt_1',
      startsAt: '2026-10-22T08:20:00+08:00',
      doctorName: 'Dr. Ana Santos',
      specialty: 'Internal Medicine',
      location: 'Main Clinic',
      service: 'Consultation',
      mode: 'in_person',
      status: 'completed',
    },
  ];

  const teleconsults: Teleconsult[] = [
    { id: 'tc_1', startsAt: `${clinicToday()}T14:30:00+08:00`, doctorName: 'Dr. Miguel Reyes', questionsPending: 4 },
  ];

  const results: LabResult[] = [
    { id: 'r1', testId: 'hba1c', name: 'HbA1c', value: '7.9', numericValue: 7.9, unit: '%', rangeText: '4.0–5.6', low: 4.0, high: 5.6, flag: 'high', collectedAt: '2026-10-22T07:30:00+08:00', orderNo: 'L000000001', releasedBy: 'Dr. Elena Cruz', isNew: true },
    { id: 'r2', testId: 'fbs', name: 'Fasting blood sugar', value: '142', numericValue: 142, unit: 'mg/dL', rangeText: '70–100', low: 70, high: 100, flag: 'high', collectedAt: '2026-10-22T07:30:00+08:00', orderNo: 'L000000001', releasedBy: 'Dr. Elena Cruz', isNew: true },
    { id: 'r3', testId: 'crea', name: 'Creatinine', value: '0.9', numericValue: 0.9, unit: 'mg/dL', rangeText: '0.6–1.1', low: 0.6, high: 1.1, flag: 'normal', collectedAt: '2026-10-22T07:30:00+08:00', orderNo: 'L000000001', releasedBy: 'Dr. Elena Cruz', isNew: false },
    { id: 'r4', testId: 'ldl', name: 'LDL cholesterol', value: '96', numericValue: 96, unit: 'mg/dL', rangeText: 'below 100', low: null, high: 100, flag: 'normal', collectedAt: '2026-10-22T07:30:00+08:00', orderNo: 'L000000001', releasedBy: 'Dr. Elena Cruz', isNew: false },
    { id: 'r5', testId: 'hba1c', name: 'HbA1c', value: '8.4', numericValue: 8.4, unit: '%', rangeText: '4.0–5.6', low: 4.0, high: 5.6, flag: 'high', collectedAt: '2026-07-18T07:30:00+08:00', orderNo: 'L000000000', releasedBy: 'Dr. Elena Cruz', isNew: false },
    { id: 'r6', testId: 'fbs', name: 'Fasting blood sugar', value: '156', numericValue: 156, unit: 'mg/dL', rangeText: '70–100', low: 70, high: 100, flag: 'high', collectedAt: '2026-07-18T07:30:00+08:00', orderNo: 'L000000000', releasedBy: 'Dr. Elena Cruz', isNew: false },
    { id: 'r7', testId: 'ua', name: 'Urinalysis', value: 'Normal', numericValue: null, unit: '', rangeText: 'normal', low: null, high: null, flag: 'normal', collectedAt: '2026-07-18T07:30:00+08:00', orderNo: 'L000000000', releasedBy: 'Dr. Elena Cruz', isNew: false },
  ];

  const trends: Record<string, ResultTrend> = {
    hba1c: {
      testId: 'hba1c',
      name: 'HbA1c',
      unit: '%',
      points: [
        { collectedAt: '2026-01-14T07:30:00+08:00', value: 9.1, low: 4.0, high: 5.6 },
        { collectedAt: '2026-07-18T07:30:00+08:00', value: 8.4, low: 4.0, high: 5.6 },
        { collectedAt: '2026-10-22T07:30:00+08:00', value: 7.9, low: 4.0, high: 5.6 },
      ],
    },
    fbs: {
      testId: 'fbs',
      name: 'Fasting blood sugar',
      unit: 'mg/dL',
      points: [
        { collectedAt: '2026-07-18T07:30:00+08:00', value: 156, low: 70, high: 100 },
        { collectedAt: '2026-10-22T07:30:00+08:00', value: 142, low: 70, high: 100 },
      ],
    },
    crea: { testId: 'crea', name: 'Creatinine', unit: 'mg/dL', points: [{ collectedAt: '2026-10-22T07:30:00+08:00', value: 0.9, low: 0.6, high: 1.1 }] },
    ldl: { testId: 'ldl', name: 'LDL cholesterol', unit: 'mg/dL', points: [{ collectedAt: '2026-10-22T07:30:00+08:00', value: 96, low: null, high: 100 }] },
    ua: { testId: 'ua', name: 'Urinalysis', unit: '', points: [] },
  };

  const prescriptions: Prescription[] = [
    {
      id: 'rx1',
      number: 'RX00000001',
      drug: 'Metformin 500 mg',
      form: 'Tablet',
      purpose: 'for blood sugar',
      directions: 'Take 1 tablet twice a day',
      note: 'with breakfast and dinner. Take with food to avoid an upset stomach.',
      prescriber: 'Dr. Ana Santos',
      prescribedAt: '2026-10-22T09:00:00+08:00',
      quantity: '60 tablets · 30 days',
      status: 'active',
    },
  ];

  const messages: Message[] = [
    { id: 'm1', kind: 'notice', from: 'Demo Health · Main Clinic', initials: 'DH', sender: 'clinic', sentAt: '2026-11-07T10:42:00+08:00', subject: 'Your lab results are ready', body: 'New results are in MyHealth. Open the app to see them.', read: false },
    { id: 'm2', kind: 'message', from: 'Dr. Ana Santos', initials: 'AS', sender: 'doctor', sentAt: '2026-11-07T09:15:00+08:00', subject: 'Before your follow-up', body: 'Hi Maria — please fast for 8 hours before your 19 Nov visit. Water is fine.', read: false },
    { id: 'm3', kind: 'notice', from: 'Billing', initials: '₱', sender: 'billing', sentAt: '2026-10-22T11:05:00+08:00', subject: 'Receipt AR-2026-000001', body: 'Payment received: ₱1,500.00 for invoice INV-2026-000001. Thank you.', read: true },
    { id: 'm4', kind: 'message', from: 'Liza Mendoza · Reception', initials: 'LM', sender: 'staff', sentAt: '2026-10-15T15:20:00+08:00', subject: 'Re: Parking at the clinic', body: 'You can park at the back lot on Mabini St. Show your booking at the gate.', read: true },
  ];

  const billing: Billing = {
    balance: 850,
    credit: 0,
    onlinePayment: { available: true, methods: 'GCash, Maya or card' },
    invoices: [
      {
        id: 'inv2',
        number: 'INV-2026-000002',
        title: 'Laboratory tests',
        issuedAt: '2026-10-22T10:00:00+08:00',
        status: 'due',
        lines: [
          { label: 'HbA1c', amount: 650 },
          { label: 'Fasting blood sugar', amount: 150 },
          { label: 'Creatinine', amount: 250 },
        ],
        adjustments: [{ label: 'HMO coverage · MediCard', amount: -200 }],
        total: 850,
        balance: 850,
      },
      {
        id: 'inv1',
        number: 'INV-2026-000001',
        title: 'Consultation · Dr. Ana Santos',
        issuedAt: '2026-10-22T09:00:00+08:00',
        status: 'paid',
        lines: [{ label: 'Consultation', amount: 1500 }],
        adjustments: [],
        total: 1500,
        balance: 0,
        payment: { method: 'cash', receiptNo: 'AR-2026-000001', amount: 1500 },
      },
    ],
  };

  const preferences: CommunicationPreferences = {
    categories: [
      { id: 'care', label: 'Results and records', hint: 'New results, documents', channels: { push: true, sms: true, email: true } },
      { id: 'appointments', label: 'Visits and bills', hint: 'Bookings, changes, bills', channels: { push: true, sms: true, email: false } },
      { id: 'optional', label: 'Follow-up reminders', hint: 'From your care plan', channels: { push: true, sms: false, email: false } },
    ],
    destinations: { device: 'This phone', sms: '+63 917 ••• 4821', email: 'm•••@demo.healthcare.ph' },
  };

  const qr: CheckInQr = { key: 'mhq_7Kp2Vx9QmR4tLw8N', issuedAt: '2026-10-22T08:00:00+08:00', status: 'active' };

  const services: BookingService[] = [
    { id: 'svc_fu', name: 'Follow-up consultation', durationMin: 20, mode: 'in_person', price: 500 },
    { id: 'svc_tele', name: 'Online consultation', durationMin: 20, mode: 'online', price: 450 },
  ];
  const doctors: BookingDoctor[] = [
    { id: 'doc_ana', name: 'Dr. Ana Santos', specialty: 'Internal Medicine', initials: 'AS' },
    { id: 'doc_miguel', name: 'Dr. Miguel Reyes', specialty: 'Family Medicine', initials: 'MR' },
  ];

  return { me, appointments, teleconsults, results, trends, prescriptions, messages, billing, preferences, qr, services, doctors };
}

export type DemoStore = ReturnType<typeof createDemoStore>;
