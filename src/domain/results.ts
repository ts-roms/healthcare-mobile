import type { LabResult, ResultFlag } from '@/data/types';

/**
 * Plain-language wording for result flags, matching MyHealth on the web
 * (`@healthcare/domain/portal-results`). The flag itself always comes from the API; this
 * file only turns it into words and a tone. Never compute a flag in the app.
 */
export type FlagTone = 'success' | 'warning' | 'danger' | 'info';
export type FlagIcon = 'check' | 'up' | 'down' | 'alert';

export type FlagCopy = { short: string; long: string; tone: FlagTone; icon: FlagIcon; outsideRange: boolean };

const COPY: Record<ResultFlag, FlagCopy> = {
  normal: { short: 'Usual', long: 'In usual range', tone: 'success', icon: 'check', outsideRange: false },
  high: { short: 'High', long: 'Above usual range', tone: 'warning', icon: 'up', outsideRange: true },
  low: { short: 'Low', long: 'Below usual range', tone: 'info', icon: 'down', outsideRange: true },
  critical_high: { short: 'Very high', long: 'Well above usual range', tone: 'danger', icon: 'alert', outsideRange: true },
  critical_low: { short: 'Very low', long: 'Well below usual range', tone: 'danger', icon: 'alert', outsideRange: true },
  abnormal: { short: 'Not usual', long: 'Outside usual range', tone: 'warning', icon: 'alert', outsideRange: true },
};

export function flagCopy(flag: ResultFlag): FlagCopy {
  return COPY[flag] ?? COPY.abnormal;
}

export type ResultGroup = { key: string; collectedAt: string; orderNo: string; items: LabResult[] };

/** Groups results by lab order, newest first, keeping the API's order inside a group. */
export function groupResults(results: LabResult[], filter: 'all' | 'outside' = 'all'): ResultGroup[] {
  const groups = new Map<string, ResultGroup>();
  for (const r of results) {
    if (filter === 'outside' && !flagCopy(r.flag).outsideRange) continue;
    const g = groups.get(r.orderNo) ?? { key: r.orderNo, collectedAt: r.collectedAt, orderNo: r.orderNo, items: [] };
    g.items.push(r);
    groups.set(r.orderNo, g);
  }
  return [...groups.values()].sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));
}

/** Allergy wording must stay exact. */
export function allergyText(allergies: { reviewed: boolean; items: string[] }): string {
  if (allergies.items.length > 0) return allergies.items.join(', ');
  return allergies.reviewed ? 'No known allergies' : 'Allergies not recorded — ask the patient';
}
