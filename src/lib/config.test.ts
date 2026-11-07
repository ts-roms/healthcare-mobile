import { describe, expect, it } from 'vitest';

import { realtimeUrlFor } from './config';

describe('realtimeUrlFor', () => {
  it('uses the API origin and the /realtime namespace', () => {
    expect(realtimeUrlFor('http://192.168.254.100:3333/api/v1')).toBe('http://192.168.254.100:3333/realtime');
    expect(realtimeUrlFor('https://api.example.ph/api/v1/')).toBe('https://api.example.ph/realtime');
  });

  it('is empty without an API address', () => {
    expect(realtimeUrlFor('')).toBe('');
  });
});
