import { resultMeaning, type PortalResult, type PortalResultFlag } from './portal-results';

/**
 * How the redesign shows a result's flag: the wording is MyHealth's own (`resultMeaning` from the shared
 * `portal-results`), always with an icon and a tone, never colour alone. The flag itself always comes from the API.
 */
export type FlagTone = 'success' | 'warning' | 'danger' | 'neutral';
export type FlagIcon = 'check' | 'up' | 'down' | 'alert' | 'none';

export type FlagCopy = { short: string; long: string; tone: FlagTone; icon: FlagIcon; outsideRange: boolean };

const SHORT: Record<PortalResultFlag, { short: string; icon: FlagIcon }> = {
  normal: { short: 'Usual', icon: 'check' },
  high: { short: 'High', icon: 'up' },
  low: { short: 'Low', icon: 'down' },
  critical_high: { short: 'Very high', icon: 'alert' },
  critical_low: { short: 'Very low', icon: 'alert' },
  abnormal: { short: 'Not usual', icon: 'alert' },
};

export function flagCopy(flag: PortalResultFlag | null): FlagCopy {
  const meaning = resultMeaning({ flag });
  const tone: FlagTone = meaning.tone === 'normal' ? 'success' : meaning.tone === 'attention' ? 'warning' : meaning.tone === 'urgent' ? 'danger' : 'neutral';
  const s = flag ? SHORT[flag] : { short: 'No range', icon: 'none' as const };
  return { short: s.short, long: meaning.text, tone, icon: s.icon, outsideRange: flag !== null && flag !== 'normal' };
}

/** "4.0–5.6", "up to 5.6", "70 or more" or the laboratory's text; null when there is no range. */
export function rangeShort(r: Pick<PortalResult, 'refLow' | 'refHigh' | 'refText'>): string | null {
  if (r.refLow !== null && r.refHigh !== null) return `${r.refLow}–${r.refHigh}`;
  if (r.refHigh !== null) return `up to ${r.refHigh}`;
  if (r.refLow !== null) return `${r.refLow} or more`;
  return r.refText;
}

export type ResultGroup = { key: string; collectedAt: string; orderNumber: string; items: PortalResult[] };

const when = (r: PortalResult) => r.collectedAt ?? r.releasedAt ?? '';

/** Groups results by lab order, newest first. "Outside" keeps those the API flagged as anything but normal. */
export function groupResults(results: PortalResult[], filter: 'all' | 'outside' = 'all'): ResultGroup[] {
  const groups = new Map<string, ResultGroup>();
  for (const r of results) {
    if (filter === 'outside' && !flagCopy(r.flag).outsideRange) continue;
    const g = groups.get(r.orderId) ?? { key: r.orderId, collectedAt: when(r), orderNumber: r.orderNumber, items: [] };
    g.items.push(r);
    if (when(r) > g.collectedAt) g.collectedAt = when(r);
    groups.set(r.orderId, g);
  }
  return [...groups.values()].sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));
}

/** Results released since the given instant (Home's "New results"); the API has no "new" flag, so the app uses the newest order. */
export function newestOrder(results: PortalResult[]): PortalResult[] {
  return groupResults(results)[0]?.items ?? [];
}
