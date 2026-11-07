/**
 * The MyHealth API (`/api/v1/portal/*`) as the screens use it. Every call goes through the patient session
 * (`src/lib/session.ts`): bearer token, single-flight refresh, sign-out only when the API refuses the session,
 * `X-Acting-For` only where allowed. Nothing returned here is stored on the device (decision D10).
 */
import { session } from '@/lib/session-instance';

import type {
  BookingOptions,
  BookingSlots,
  PortalAccount,
  PortalAppointments,
  PortalInvoice,
  PortalMe,
  PortalMessage,
  PortalOnlinePayment,
  PortalPreferences,
  PortalPrescription,
  PortalQr,
  PortalResult,
  PortalTeleconsult,
  PortalThread,
  PortalThreadDetail,
  PortalTrend,
  MessageTopic,
  PreferenceCategory,
  PreferenceChannel,
} from './types';

export { ApiError, patientMessage, SessionEndedError } from '@/lib/api-error';

const q = (params: Record<string, string | undefined>) =>
  new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined)).toString();

// Account
export const getMe = () => session.get<PortalMe>('/portal/me');
export const getCheckInQr = () => session.get<PortalQr>('/portal/qr');
export const getPreferences = () => session.get<PortalPreferences>('/portal/communication-preferences');
/** Only changed choices are sent, as the web portal does. */
export const updatePreferences = (preferences: { channel: PreferenceChannel; category: PreferenceCategory; optedIn: boolean }[]) =>
  session.put<PortalPreferences>('/portal/communication-preferences', { preferences });

// Care
export const getAppointments = () => session.get<PortalAppointments>('/portal/appointments');
export const getTeleconsults = () => session.get<PortalTeleconsult[]>('/portal/teleconsults');
export const getResults = () => session.get<PortalResult[]>('/portal/results');
export const getResultTrend = (testId: string) => session.get<PortalTrend>(`/portal/results/trend?${q({ testId })}`);
export const getPrescriptions = () => session.get<PortalPrescription[]>('/portal/prescriptions');

// Notices and conversations
export const getMessages = () => session.get<PortalMessage[]>('/portal/messages');
export const markMessageRead = (id: string) => session.post<void>(`/portal/messages/${id}/read`);
export const getUnreadCount = () => session.get<{ unread: number }>('/portal/messages/unread-count');
export const getThreads = () => session.get<PortalThread[]>('/portal/message-threads');
export const getThread = (id: string) => session.get<PortalThreadDetail>(`/portal/message-threads/${id}`);
export const startThread = (input: { topic: MessageTopic; subject: string; body: string }) =>
  session.post<PortalThreadDetail>('/portal/message-threads', { ...input, documentIds: [] });
export const replyToThread = (id: string, body: string) => session.post<PortalThreadDetail>(`/portal/message-threads/${id}/messages`, { body, documentIds: [] });

// Bills
export const getInvoices = () => session.get<PortalInvoice[]>('/portal/billing');
export const getAccounts = () => session.get<PortalAccount[]>('/portal/billing/account');
export const getOnlinePayment = () => session.get<PortalOnlinePayment>('/portal/billing/online-payment');

// Booking
export const getBookingOptions = () => session.get<BookingOptions>('/portal/booking/options');
export const getBookingSlots = (input: { facilityId: string; visitTypeId: string; date: string; practitionerId?: string }) =>
  session.get<BookingSlots>(`/portal/booking/slots?${q(input)}`);
export const bookAppointment = (input: { facilityId: string; visitTypeId: string; practitionerId: string; startsAt: string; reason?: string }) =>
  session.post<{ id: string }>('/portal/appointments', input);
export const cancelAppointment = (id: string, version: number, reason?: string) =>
  session.post<void>(`/portal/appointments/${id}/cancel`, { version, ...(reason ? { reason } : {}) });

/**
 * A 60-second ticket that opens the realtime socket for the account holder's own conversations
 * (`POST /portal/realtime-tickets`). Only asked for while not acting for someone else (see `useLiveMessages`).
 */
export const realtimeTicket = () => session.post<{ ticket: string; expiresInSeconds: number }>('/portal/realtime-tickets', {});
