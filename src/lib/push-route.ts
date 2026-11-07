/**
 * Where tapping a notification opens the app. A notice names a page of MyHealth on the web (`data.url`, never anything
 * clinical); the app opens its own screen for it, or stays where it is.
 */
export type PushRoute = '/results' | '/messages' | '/visits' | '/bills' | '/medicines';

const ROUTES: [prefix: string, route: PushRoute][] = [
  ['/results', '/results'],
  ['/messages', '/messages'],
  ['/appointments', '/visits'],
  ['/consultations', '/visits'],
  ['/billing', '/bills'],
  ['/prescriptions', '/medicines'],
];

export function pushRoute(url: unknown): PushRoute | null {
  if (typeof url !== 'string' || !url.startsWith('/')) return null;
  const path = url.split(/[?#]/)[0]!;
  return ROUTES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] ?? null;
}
