import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import * as api from '@/data/api';

/**
 * DEMO session. The real app's `src/lib/session.ts` rules must be kept when the API is wired:
 *  - access token in memory, refresh token in expo-secure-store;
 *  - single-flight refresh;
 *  - sign out only when the API refuses the session;
 *  - `X-Acting-For` only while acting for someone, never on own-account routes.
 * Here the signed-in flag lives in memory only, so a reload signs you out.
 */
type Status = 'signedOut' | 'mfa' | 'signedIn';

type SessionValue = {
  status: Status;
  mfaDestination: string | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  verify: (code: string) => Promise<void>;
  resend: () => Promise<void>;
  cancelMfa: () => void;
  activated: () => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('signedOut');
  const [mfaDestination, setMfaDestination] = useState<string | null>(null);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      mfaDestination,
      async signIn(identifier, password) {
        const res = await api.login(identifier, password);
        setMfaDestination(res.destination);
        setStatus('mfa');
      },
      async verify(code) {
        await api.verifyMfa(code);
        setStatus('signedIn');
      },
      resend: () => api.resendMfa(),
      cancelMfa() {
        setStatus('signedOut');
        setMfaDestination(null);
      },
      activated() {
        setStatus('signedIn');
      },
      signOut() {
        api.resetDemoStore();
        setMfaDestination(null);
        setStatus('signedOut');
      },
    }),
    [status, mfaDestination],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(SessionContext);
  if (!v) throw new Error('useSession must be used inside <SessionProvider>');
  return v;
}
