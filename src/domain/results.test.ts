import { describe, expect, it } from 'vitest';

import type { LabResult } from '@/data/types';

import { allergyText, flagCopy, groupResults } from './results';

const r = (over: Partial<LabResult>): LabResult => ({
  id: 'x',
  testId: 't',
  name: 'Test',
  value: '1',
  numericValue: 1,
  unit: '',
  rangeText: '0–2',
  low: 0,
  high: 2,
  flag: 'normal',
  collectedAt: '2026-10-22T07:30:00+08:00',
  orderNo: 'L1',
  releasedBy: 'Dr. X',
  isNew: false,
  ...over,
});

describe('flagCopy', () => {
  it('uses the web wording and always gives an icon', () => {
    expect(flagCopy('high')).toMatchObject({ short: 'High', long: 'Above usual range', tone: 'warning' });
    expect(flagCopy('normal')).toMatchObject({ short: 'Usual', tone: 'success' });
    for (const f of ['normal', 'high', 'low', 'critical_high', 'critical_low', 'abnormal'] as const) {
      expect(flagCopy(f).icon).toBeTruthy();
      expect(flagCopy(f).short.length).toBeGreaterThan(0);
    }
  });
});

describe('groupResults', () => {
  const list = [r({ id: 'a', orderNo: 'L1', collectedAt: '2026-07-18T07:30:00+08:00', flag: 'high' }), r({ id: 'b', orderNo: 'L2', flag: 'normal' }), r({ id: 'c', orderNo: 'L2', flag: 'low' })];

  it('groups by lab order, newest first', () => {
    const g = groupResults(list);
    expect(g.map((x) => x.orderNo)).toEqual(['L2', 'L1']);
    expect(g[0].items.map((x) => x.id)).toEqual(['b', 'c']);
  });

  it('filters to results outside the usual range using the API flag only', () => {
    const g = groupResults(list, 'outside');
    expect(g.flatMap((x) => x.items.map((i) => i.id))).toEqual(['c', 'a']);
  });
});

describe('allergyText', () => {
  it('says "No known allergies" only after a recorded review', () => {
    expect(allergyText({ reviewed: true, items: [] })).toBe('No known allergies');
    expect(allergyText({ reviewed: false, items: [] })).toBe('Allergies not recorded — ask the patient');
    expect(allergyText({ reviewed: true, items: ['Penicillin'] })).toBe('Penicillin');
  });
});
