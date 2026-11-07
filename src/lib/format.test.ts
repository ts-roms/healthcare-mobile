import { describe, expect, it } from 'vitest';

import { formatDate, formatMessageTime, formatTime, greeting, isoBirthDate, isSameClinicDay, money, price, relativeDays } from './format';

const TZ = 'Asia/Manila';

describe('format (clinic time zone)', () => {
  it('formats times in the clinic zone, not the device zone', () => {
    expect(formatTime('2026-11-19T00:00:00Z', TZ)).toBe('8:00 AM');
    expect(formatTime('2026-11-19T06:30:00Z', TZ)).toBe('2:30 PM');
    expect(formatTime('2026-11-18T16:05:00Z', TZ)).toBe('12:05 AM');
  });

  it('formats dates', () => {
    expect(formatDate('2026-10-22T07:30:00+08:00', TZ)).toBe('Thu, 22 Oct 2026');
  });

  it('crosses midnight using the clinic day', () => {
    // 23:30 UTC on the 21st is already the 22nd in Manila.
    expect(isSameClinicDay('2026-10-21T23:30:00Z', '2026-10-22T10:00:00+08:00', TZ)).toBe(true);
  });

  it('describes how far away a day is', () => {
    const now = new Date('2026-11-07T15:00:00+08:00');
    expect(relativeDays('2026-11-07T18:00:00+08:00', now, TZ)).toBe('today');
    expect(relativeDays('2026-11-08T08:00:00+08:00', now, TZ)).toBe('tomorrow');
    expect(relativeDays('2026-11-12T08:00:00+08:00', now, TZ)).toBe('in 5 days');
    expect(relativeDays('2026-11-19T08:00:00+08:00', now, TZ)).toBe('in 12 days');
    expect(relativeDays('2026-12-05T08:00:00+08:00', now, TZ)).toBe('in 4 weeks');
  });

  it('shows a time for today’s messages and a date otherwise', () => {
    const now = new Date('2026-11-07T15:00:00+08:00');
    expect(formatMessageTime('2026-11-07T10:42:00+08:00', now, TZ)).toBe('10:42 AM');
    expect(formatMessageTime('2026-10-22T10:42:00+08:00', now, TZ)).toBe('Oct 22');
  });

  it('greets by the clinic hour', () => {
    expect(greeting(new Date('2026-11-07T08:00:00+08:00'), TZ)).toBe('Good morning');
    expect(greeting(new Date('2026-11-07T14:00:00+08:00'), TZ)).toBe('Good afternoon');
    expect(greeting(new Date('2026-11-07T20:00:00+08:00'), TZ)).toBe('Good evening');
  });

  it('formats pesos', () => {
    expect(money(1500)).toBe('₱1,500.00');
    expect(money(-200)).toBe('−₱200.00');
    expect(price(500)).toBe('₱500');
    expect(price(99.5)).toBe('₱99.50');
  });
});

describe('isoBirthDate', () => {
  it('accepts US and ISO forms and refuses impossible dates', () => {
    expect(isoBirthDate('05/14/1978')).toBe('1978-05-14');
    expect(isoBirthDate('5 / 4 / 1978')).toBe('1978-05-04');
    expect(isoBirthDate('1978-05-14')).toBe('1978-05-14');
    expect(isoBirthDate('02/30/1978')).toBeNull();
    expect(isoBirthDate('May 14')).toBeNull();
  });
});
