import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getMe } from '@/data/api';
import type { Me } from '@/data/types';

import { useSession } from './session';

type MeValue = { me: Me | null; timeZone: string; refresh: () => void };

const MeContext = createContext<MeValue>({ me: null, timeZone: 'Asia/Manila', refresh: () => {} });

/** Loads `GET /portal/me` once per session; times everywhere use its clinic time zone. */
export function MeProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status !== 'signedIn') return;
    let live = true;
    getMe().then((m) => live && setMe(m));
    return () => {
      live = false;
    };
  }, [status, tick]);

  // After sign-out, never expose the previous person's profile.
  const current = status === 'signedIn' ? me : null;
  return <MeContext.Provider value={{ me: current, timeZone: current?.clinic.timeZone ?? 'Asia/Manila', refresh: () => setTick((t) => t + 1) }}>{children}</MeContext.Provider>;
}

export const useMe = () => useContext(MeContext);
