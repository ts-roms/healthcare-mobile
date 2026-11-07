import { describe, expect, it } from 'vitest';

import { notchedBarPath, TAB_BAR_GEOMETRY as G } from './tabBarGeometry';

describe('notchedBarPath', () => {
  it('is empty before the bar is measured', () => {
    expect(notchedBarPath(0, 100)).toBe('');
  });

  it('cuts the notch under the active tab, down to the notch depth', () => {
    const d = notchedBarPath(358, 179);
    expect(d).toContain(`L${179 - G.notchHalfWidth} 0`);
    expect(d).toContain(`179 ${G.notchDepth} C`);
    expect(d).toContain(`${179 + G.notchHalfWidth} 0`);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('keeps the notch inside the bar and tightens the corner next to it', () => {
    const d = notchedBarPath(358, 20);
    expect(d.startsWith('M0 0 Q0 0 0 0 L0 0')).toBe(true);
    const right = notchedBarPath(358, 340);
    expect(right).toContain(`L358 0 Q358 0 358 0`);
  });
});
