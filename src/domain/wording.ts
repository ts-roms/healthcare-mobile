/**
 * Plain-language wording mirrored from MyHealth on the web (`apps/portal/src/lib/{records,billing,messages,booking,
 * notification-settings}.ts`), so the app and the web say the same thing. Keep in step with those files.
 */
import type { PortalAppointment, PortalInvoice, PortalMessage, PortalPrescription, PortalPrescriptionItem, PreferenceCategory, PreferenceChannel } from '@/data/types';

const FREQUENCY: Record<string, string> = {
  once: 'once',
  once_daily: 'once a day',
  twice_daily: 'twice a day',
  three_times_daily: 'three times a day',
  four_times_daily: 'four times a day',
  every_4_hours: 'every 4 hours',
  every_6_hours: 'every 6 hours',
  every_8_hours: 'every 8 hours',
  every_12_hours: 'every 12 hours',
  at_bedtime: 'at bedtime',
  weekly: 'once a week',
};

/** "1 tablet twice a day for 30 days"; the prescriber's instructions stay the authority. */
export function howToTake(item: PortalPrescriptionItem): string {
  const dose = item.doseAmount !== null ? `${item.doseAmount} ${item.doseUnit ?? ''}`.trim() : null;
  const frequency =
    item.frequency === 'as_needed'
      ? `when needed${item.asNeededReason ? ` for ${item.asNeededReason}` : ''}`
      : item.frequency === 'custom'
        ? (item.frequencyText ?? '')
        : (FREQUENCY[item.frequency] ?? item.frequency.replaceAll('_', ' '));
  const duration =
    item.durationValue && item.durationUnit
      ? `for ${item.durationValue} ${item.durationValue === 1 ? item.durationUnit.replace(/s$/, '') : item.durationUnit}`
      : null;
  return [dose, frequency, duration].filter(Boolean).join(' ');
}

/** "Metformin 500 mg" (brand in brackets when there is one). */
export function medicineName(item: PortalPrescriptionItem): string {
  return [item.genericName, item.strength].filter(Boolean).join(' ') + (item.brandName ? ` (${item.brandName})` : '');
}

export const APPOINTMENT_STATUS: Record<PortalAppointment['status'], string> = {
  booked: 'Booked',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  completed: 'Done',
  cancelled: 'Cancelled',
  no_show: 'Missed',
};

/** "₱1,234.50" from integer centavos. */
export function peso(centavos: number): string {
  const sign = centavos < 0 ? '−' : '';
  const abs = Math.abs(centavos);
  return `${sign}₱${Math.floor(abs / 100).toLocaleString('en-PH')}.${String(abs % 100).padStart(2, '0')}`;
}

export function invoiceStatus(invoice: Pick<PortalInvoice, 'status' | 'balance' | 'paidTotal' | 'patientTotal'>): { label: string; tone: 'due' | 'paid' | 'void' } {
  if (invoice.status === 'void') return { label: 'Cancelled — replaced or corrected by the clinic', tone: 'void' };
  if (invoice.balance <= 0) return { label: 'Paid', tone: 'paid' };
  const partly = invoice.paidTotal > 0 || invoice.balance < invoice.patientTotal;
  return { label: partly ? 'Partly paid' : 'To pay', tone: 'due' };
}

export function totalDue(invoices: readonly Pick<PortalInvoice, 'status' | 'balance'>[]): number {
  return invoices.filter((i) => i.status === 'issued' && i.balance > 0).reduce((sum, i) => sum + i.balance, 0);
}

export const PAYMENT_METHOD: Record<string, string> = { cash: 'cash', card: 'card', gcash: 'GCash', maya: 'Maya', bank_transfer: 'bank transfer', check: 'check', online: 'online' };

/** Who a notice is from, in the patient's words. */
export function messageSource(message: Pick<PortalMessage, 'templateKey'>): string {
  if (message.templateKey === 'clinic.message') return 'From your clinic';
  if (message.templateKey.startsWith('lab.')) return 'Laboratory';
  if (message.templateKey.startsWith('care-plan.')) return 'Your care plan';
  if (message.templateKey.startsWith('records.')) return 'Records office';
  return 'Visits';
}

/** Where a notice invites the patient to go next, among the app's screens. */
export function messageAction(message: Pick<PortalMessage, 'templateKey'>): { href: '/results' | '/visits' | '/book'; label: string } | null {
  switch (message.templateKey) {
    case 'lab.results-available':
      return { href: '/results', label: 'See your results' };
    case 'appointment.self-service':
    case 'appointment.reminder':
      return { href: '/visits', label: 'See your visits' };
    case 'appointment.no-show':
    case 'care-plan.follow-up-due':
      return { href: '/book', label: 'Book a visit' };
    default:
      return null;
  }
}

export const CHANNEL_TEXT: Record<PreferenceChannel, string> = { sms: 'Text', email: 'Email', push: 'Push' };

export const CATEGORY_TEXT: Record<PreferenceCategory, { title: string; about: string }> = {
  clinical: { title: 'About your care', about: 'Results ready, follow-up and medicine reminders' },
  administrative: { title: 'Appointments and bills', about: 'Bookings, reminders, changes, bills' },
  outreach: { title: 'Check-in reminders', about: 'Optional; off unless you turn them on' },
};

export const CATEGORY_ORDER: readonly PreferenceCategory[] = ['clinical', 'administrative', 'outreach'];

const BOOKING_MESSAGES: Record<string, string> = {
  slot_unavailable: 'Someone just took that time. Please choose another.',
  booking_too_soon: 'That time is too soon to book online. Choose a later time or call the clinic.',
  booking_too_far_ahead: 'That date is too far ahead to book online.',
  too_many_bookings: 'You already have the most online bookings allowed. Cancel one, or call the clinic.',
  change_window_closed: 'It is too close to the appointment to change it online. Please call the clinic.',
  not_bookable_online: 'This kind of visit cannot be booked online. Please call the clinic.',
  version_conflict: 'This appointment was just changed. Reload to see the latest.',
};

export function bookingMessage(code: string | undefined, fallback: string): string {
  return (code && BOOKING_MESSAGES[code]) || fallback;
}

/** Local calendar dates (YYYY-MM-DD) a patient can pick, from the first bookable day up to the clinic's horizon. */
export function bookingDays(now: Date, rules: { minLeadMinutes: number; maxAdvanceDays: number }, timeZone: string, count: number): string[] {
  const local = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(d);
  const first = new Date(now.getTime() + rules.minLeadMinutes * 60_000);
  const last = new Date(now.getTime() + rules.maxAdvanceDays * 86_400_000);
  const days: string[] = [];
  for (let t = first.getTime(); t <= last.getTime() && days.length < count; t += 86_400_000) {
    const day = local(new Date(t));
    if (days.at(-1) !== day) days.push(day);
  }
  return days;
}

export const TOPICS: readonly { value: import('@/data/types').MessageTopic; label: string }[] = [
  { value: 'general', label: 'A general question' },
  { value: 'appointment', label: 'My appointment' },
  { value: 'results', label: 'My test results' },
  { value: 'medication', label: 'My medicines' },
  { value: 'billing', label: 'A bill or payment' },
  { value: 'other', label: 'Something else' },
];
export const SUBJECT_MAX = 100;
export const BODY_MAX = 2000;

/** Shown wherever the patient writes: this is not a way to reach the clinic in an emergency. */
export const NOT_FOR_EMERGENCIES =
  'Messages are read during clinic hours, not all day, and are not for urgent problems. In an emergency call 911 or go to the nearest emergency room.';

/**
 * The message "Ask for a refill" starts with, so the clinic sees at once what is asked and for which medicine: each
 * medicine with its strength, form and dose as prescribed, and the prescription it comes from. The patient can edit it
 * before sending. `issuedOn` is the prescription date already formatted in the clinic's time zone.
 */
export function refillRequest(rx: Pick<PortalPrescription, 'prescriptionNumber' | 'prescriberName' | 'items'>, issuedOn: string): { subject: string; body: string } {
  const names = rx.items.map(medicineName);
  const subject = clip(`Refill request: ${names.join(', ')}`, SUBJECT_MAX);
  const medicines = rx.items.map((item) => {
    const form = [item.dosageForm, item.route].filter(Boolean).join(', ');
    const take = howToTake(item);
    const quantity = `${item.quantity} ${item.quantityUnit}${item.quantity === 1 ? '' : 's'}`;
    return [
      `- ${medicineName(item)}${form ? ` (${form})` : ''}`,
      take ? `  Dosage: ${take}` : null,
      `  Last supplied: ${quantity} · refills left on the prescription: ${item.refills}`,
    ]
      .filter(Boolean)
      .join('\n');
  });
  const body = [
    `Request: medicine refill`,
    `I would like a refill of ${rx.items.length === 1 ? 'this medicine' : 'these medicines'}:`,
    medicines.join('\n'),
    `Prescription no. ${rx.prescriptionNumber}, ${issuedOn}${rx.prescriberName ? `, prescribed by ${rx.prescriberName}` : ''}.`,
  ].join('\n\n');
  return { subject, body: clip(body, BODY_MAX) };
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}
