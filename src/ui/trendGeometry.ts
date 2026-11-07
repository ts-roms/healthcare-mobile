/**
 * Geometry for the result trend chart. Plots only the values it is given, each with the
 * usual range that applied when that sample was taken.
 */
export type TrendInput = { value: number; low?: number | null; high?: number | null; label: string };

export type TrendGeometry = {
  points: { x: number; y: number; value: number; label: string }[];
  /** One usual-range band per sample (ranges can change over time). */
  bands: { x: number; width: number; y: number; height: number }[];
  ticks: { y: number; value: number }[];
  plot: { left: number; right: number; top: number; bottom: number };
};

const PAD = { left: 28, right: 6, top: 22, bottom: 30 };

export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001 || ticks.length < count; v += step) {
    ticks.push(Number(v.toFixed(6)));
    if (ticks.length > 8) break;
  }
  return ticks;
}

export function trendGeometry(data: TrendInput[], width: number, height: number): TrendGeometry {
  const plot = { left: PAD.left, right: width - PAD.right, top: PAD.top, bottom: height - PAD.bottom };
  if (data.length === 0 || width <= PAD.left + PAD.right) return { points: [], bands: [], ticks: [], plot };

  const all: number[] = [];
  for (const d of data) {
    all.push(d.value);
    if (typeof d.low === 'number') all.push(d.low);
    if (typeof d.high === 'number') all.push(d.high);
  }
  const ticks = niceTicks(Math.min(...all), Math.max(...all));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const y = (v: number) => plot.bottom - ((v - lo) / (hi - lo || 1)) * (plot.bottom - plot.top);

  const innerLeft = plot.left + 22;
  const innerRight = plot.right - 22;
  const x = (i: number) => (data.length === 1 ? (innerLeft + innerRight) / 2 : innerLeft + (i / (data.length - 1)) * (innerRight - innerLeft));

  const points = data.map((d, i) => ({ x: x(i), y: y(d.value), value: d.value, label: d.label }));

  const bands = data.flatMap((d, i) => {
    const hasLow = typeof d.low === 'number';
    const hasHigh = typeof d.high === 'number';
    if (!hasLow && !hasHigh) return [];
    const x0 = i === 0 ? plot.left : (x(i - 1) + x(i)) / 2;
    const x1 = i === data.length - 1 ? plot.right : (x(i) + x(i + 1)) / 2;
    const top = y(hasHigh ? (d.high as number) : hi);
    const bottom = y(hasLow ? (d.low as number) : lo);
    return [{ x: x0, width: x1 - x0, y: top, height: Math.max(bottom - top, 1) }];
  });

  return { points, bands, ticks: ticks.map((value) => ({ value, y: y(value) })), plot };
}
