/**
 * Presentation-only geometry for the tab bar: a rounded bar with a notch under the active tab, where its round button
 * sits. `notchedBarPath` runs on the UI thread while the notch slides (a Reanimated worklet).
 */
export const TAB_BAR_GEOMETRY = {
  /** Height of the bar itself. */
  height: 66,
  /** Corner radius of the bar. */
  radius: 26,
  /** Space between the bar's edge and the first and last tab. */
  sidePadding: 10,
  /** Diameter of the active tab's raised button (a 4 px ring included). */
  bubble: 58,
  /** The button's top edge, relative to the bar's top edge (it rises above the bar). */
  bubbleTop: -24,
  /** Half the notch's width at the bar's top edge, and its depth. */
  notchHalfWidth: 44,
  notchDepth: 38,
} as const;

/**
 * SVG path of the bar `width` px wide with the notch centred at `cx`. The notch is kept inside the bar; next to a corner
 * the corner tightens to make room for it. Empty until the bar has been measured.
 */
export function notchedBarPath(width: number, cx: number): string {
  'worklet';
  const { height: H, radius: R, notchHalfWidth: N, notchDepth: D } = TAB_BAR_GEOMETRY;
  if (width <= 0) return '';
  const c = Math.min(Math.max(cx, N), width - N);
  const left = c - N;
  const right = c + N;
  const r1 = Math.min(R, left);
  const r2 = Math.min(R, width - right);
  const f = (n: number) => Math.round(n * 100) / 100;
  return [
    `M0 ${f(r1)}`,
    `Q0 0 ${f(r1)} 0`,
    `L${f(left)} 0`,
    `C${f(c - 30)} 0 ${f(c - 32)} ${D} ${f(c)} ${D}`,
    `C${f(c + 32)} ${D} ${f(c + 30)} 0 ${f(right)} 0`,
    `L${f(width - r2)} 0`,
    `Q${f(width)} 0 ${f(width)} ${f(r2)}`,
    `L${f(width)} ${H - R}`,
    `Q${f(width)} ${H} ${f(width - R)} ${H}`,
    `L${R} ${H}`,
    `Q0 ${H} 0 ${H - R}`,
    'Z',
  ].join(' ');
}
