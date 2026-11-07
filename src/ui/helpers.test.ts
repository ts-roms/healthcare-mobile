import { describe, expect, it } from 'vitest';

import { rangeBarLayout } from './rangeBarLayout';
import { niceTicks, trendGeometry } from './trendGeometry';

describe('rangeBarLayout', () => {
  it('uses low / usual / high segments when both bounds exist', () => {
    const l = rangeBarLayout(5, 4, 6);
    expect(l.low + l.usual + l.high).toBe(100);
    expect(l.low).toBeGreaterThan(0);
    expect(l.high).toBeGreaterThan(0);
  });

  it('puts an in-range value inside the usual segment', () => {
    const l = rangeBarLayout(4.8, 4.0, 5.6);
    expect(l.marker).toBeGreaterThan(l.low);
    expect(l.marker).toBeLessThan(l.low + l.usual);
  });

  it('puts a value above the range in the high segment, further out when higher', () => {
    const a = rangeBarLayout(7.9, 4.0, 5.6);
    const b = rangeBarLayout(12, 4.0, 5.6);
    expect(a.marker).toBeGreaterThan(a.low + a.usual);
    expect(b.marker).toBeGreaterThan(a.marker);
    expect(b.marker).toBeLessThanOrEqual(97);
  });

  it('puts a value below the range in the low segment', () => {
    const l = rangeBarLayout(3, 4.0, 5.6);
    expect(l.marker).toBeLessThan(l.low);
    expect(l.marker).toBeGreaterThanOrEqual(3);
  });

  it('drops the low segment for "below N" ranges', () => {
    const l = rangeBarLayout(96, null, 100);
    expect(l.low).toBe(0);
    expect(l.marker).toBeLessThan(l.usual);
  });

  it('keeps the marker centred for non-numeric values', () => {
    const l = rangeBarLayout(Number.NaN, 4, 6);
    expect(l.marker).toBe(l.low + l.usual / 2);
  });
});

describe('niceTicks', () => {
  it('covers the range with round steps', () => {
    const t = niceTicks(4, 9.1);
    expect(t[0]).toBeLessThanOrEqual(4);
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(9.1);
    const steps = t.slice(1).map((v, i) => +(v - t[i]).toFixed(6));
    expect(new Set(steps).size).toBe(1);
  });

  it('handles a flat series', () => {
    expect(niceTicks(5, 5).length).toBeGreaterThan(1);
  });
});

describe('trendGeometry', () => {
  const data = [
    { value: 9.1, low: 4, high: 5.6, label: 'Jan' },
    { value: 8.4, low: 4, high: 5.6, label: 'Jul' },
    { value: 7.9, low: 4, high: 5.6, label: 'Oct' },
  ];

  it('plots one point per value, left to right, higher values higher up', () => {
    const g = trendGeometry(data, 324, 170);
    expect(g.points).toHaveLength(3);
    expect(g.points[0].x).toBeLessThan(g.points[1].x);
    expect(g.points[0].y).toBeLessThan(g.points[2].y);
  });

  it('draws one usual-range band per sample', () => {
    const g = trendGeometry(data, 324, 170);
    expect(g.bands).toHaveLength(3);
    for (const b of g.bands) expect(b.height).toBeGreaterThan(0);
  });

  it('skips the band when a sample had no range', () => {
    const g = trendGeometry([{ value: 1, label: 'A' }, { value: 2, low: 0, high: 3, label: 'B' }], 300, 170);
    expect(g.bands).toHaveLength(1);
  });

  it('returns nothing before layout', () => {
    expect(trendGeometry(data, 0, 170).points).toHaveLength(0);
  });
});
