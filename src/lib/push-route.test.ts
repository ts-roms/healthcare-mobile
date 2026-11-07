import { describe, expect, it } from 'vitest';

import { pushRoute } from './push-route';

describe('pushRoute', () => {
  it('maps MyHealth web pages to the app screens', () => {
    expect(pushRoute('/results')).toBe('/results');
    expect(pushRoute('/messages/abc?x=1')).toBe('/messages');
    expect(pushRoute('/appointments/123')).toBe('/visits');
    expect(pushRoute('/billing')).toBe('/bills');
  });

  it('ignores anything else, including full URLs', () => {
    expect(pushRoute('/dental')).toBeNull();
    expect(pushRoute('https://evil.example/results')).toBeNull();
    expect(pushRoute(42)).toBeNull();
    expect(pushRoute('/resultsx')).toBeNull();
  });
});
