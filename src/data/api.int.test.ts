/**
 * Runs the app's own session and API calls against a real MyHealth API. Skipped unless these are set (never commit them):
 *   MYHEALTH_IT_API=http://localhost:3333/api/v1 MYHEALTH_IT_ORG=acme MYHEALTH_IT_EMAIL=… MYHEALTH_IT_PASSWORD=… pnpm vitest run src/data/api.int.test.ts
 * Reads only, except one notification preference that is flipped and put back.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { PatientSession, type TokenStore } from '@/lib/session';

const API = process.env.MYHEALTH_IT_API;
const memory: { token: string | null } = { token: null };
const store: TokenStore = {
  read: async () => memory.token,
  write: async (t) => void (memory.token = t),
  clear: async () => void (memory.token = null),
};
const real = new PatientSession({ baseUrl: API ?? 'http://unset', organizationCode: process.env.MYHEALTH_IT_ORG ?? '', store });
vi.mock('@/lib/session-instance', () => ({ session: real }));

const api = await import('./api');
const { groupResults, flagCopy } = await import('@/domain/results');
const { bookingDays, howToTake, invoiceStatus } = await import('@/domain/wording');

describe.skipIf(!API)('MyHealth API, as the app calls it', () => {
  beforeAll(async () => {
    const step = await real.signIn(process.env.MYHEALTH_IT_EMAIL ?? '', process.env.MYHEALTH_IT_PASSWORD ?? '');
    expect(step).toBe('signed_in');
  });

  it('profile carries the clinic time zone', async () => {
    const me = await api.getMe();
    expect(me.timeZone).toMatch(/\//);
    expect(me.patient.patientNumber).toBeTruthy();
  });

  it('visits split into upcoming and past, each with its facility zone', async () => {
    const a = await api.getAppointments();
    for (const v of [...a.upcoming, ...a.past]) expect(v.timeZone).toBeTruthy();
  });

  it('results group by order and trends load per test', async () => {
    const results = await api.getResults();
    const groups = groupResults(results);
    expect(groups.flatMap((g) => g.items)).toHaveLength(results.length);
    for (const r of results) expect(flagCopy(r.flag).long.length).toBeGreaterThan(0);
    if (results[0]) {
      const trend = await api.getResultTrend(results[0].testId);
      expect(trend.points.every((p) => p.testId === results[0]!.testId)).toBe(true);
    }
  });

  it('prescriptions, bills, notices, conversations, preferences and QR answer', async () => {
    for (const p of await api.getPrescriptions()) for (const item of p.items) expect(howToTake(item)).not.toBe('');
    for (const inv of await api.getInvoices()) expect(invoiceStatus(inv).label).toBeTruthy();
    expect(Array.isArray(await api.getAccounts())).toBe(true);
    expect(typeof (await api.getOnlinePayment()).available).toBe('boolean');
    expect(Array.isArray(await api.getMessages())).toBe(true);
    expect(Array.isArray(await api.getThreads())).toBe(true);
    expect((await api.getPreferences()).preferences.length).toBeGreaterThan(0);
    expect((await api.getCheckInQr()).patientNumber).toBeTruthy();
    expect(Array.isArray(await api.getTeleconsults())).toBe(true);
  });

  it('booking offers days and open times', async () => {
    const options = await api.getBookingOptions();
    const facility = options.facilities[0];
    const visitType = options.visitTypes[0];
    if (!facility || !visitType) return;
    const days = bookingDays(new Date(), facility.rules, facility.timeZone, 6);
    expect(days.length).toBeGreaterThan(0);
    const slots = await api.getBookingSlots({ facilityId: facility.id, visitTypeId: visitType.id, date: days[0]! });
    expect(slots.date).toBe(days[0]);
  });

  it('a preference change round-trips (and is put back)', async () => {
    const before = await api.getPreferences();
    const p = before.preferences.find((x) => x.channel === 'email' && x.category === 'outreach')!;
    const was = p.choice ?? p.enabled;
    const after = await api.updatePreferences([{ channel: 'email', category: 'outreach', optedIn: !was }]);
    const changed = after.preferences.find((x) => x.channel === 'email' && x.category === 'outreach')!;
    expect(changed.choice ?? changed.enabled).toBe(!was);
    await api.updatePreferences([{ channel: 'email', category: 'outreach', optedIn: was }]);
  });

  it('signs out at the API', async () => {
    await real.signOut();
    expect(real.signedIn).toBe(false);
    expect(memory.token).toBeNull();
  });
});
