/**
 * Presentation-only geometry for the low / usual / high range bar.
 * It never decides whether a value is high or low — that flag comes from the API.
 */
export type RangeBarLayout = {
  /** Segment widths in percent, in order. A missing side has width 0. */
  low: number;
  usual: number;
  high: number;
  /** Marker centre in percent, 3–97. */
  marker: number;
};

const EDGE = 3;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function rangeBarLayout(value: number, low?: number | null, high?: number | null): RangeBarLayout {
  const hasLow = typeof low === 'number' && Number.isFinite(low);
  const hasHigh = typeof high === 'number' && Number.isFinite(high);

  const lowW = hasLow ? (hasHigh ? 20 : 40) : 0;
  const highW = hasHigh ? (hasLow ? 40 : 40) : 0;
  const usualW = 100 - lowW - highW;
  const usualStart = lowW;
  const usualEnd = lowW + usualW;

  if (!Number.isFinite(value)) return { low: lowW, usual: usualW, high: highW, marker: usualStart + usualW / 2 };

  // Scale used to measure how far outside the range a value is.
  const span = hasLow && hasHigh ? Math.max((high as number) - (low as number), Number.EPSILON) : Math.max(Math.abs((hasLow ? low : high) as number), 1);

  let marker: number;
  if (hasLow && value < (low as number)) {
    const deficit = ((low as number) - value) / span;
    marker = usualStart * (1 / (1 + deficit));
  } else if (hasHigh && value > (high as number)) {
    const excess = (value - (high as number)) / span;
    marker = usualEnd + highW * (1 - 1 / (1 + excess));
  } else if (hasLow && hasHigh) {
    marker = usualStart + ((value - (low as number)) / span) * usualW;
  } else if (hasHigh) {
    // "below N": place inside the usual segment proportionally to 0…N.
    marker = clamp(value / (high as number), 0, 1) * usualEnd;
  } else if (hasLow) {
    // "above N": the usual segment runs from N to N × 2.
    marker = usualStart + clamp((value - (low as number)) / span, 0, 1) * usualW;
  } else {
    marker = 50;
  }

  return { low: lowW, usual: usualW, high: highW, marker: clamp(marker, EDGE, 100 - EDGE) };
}
