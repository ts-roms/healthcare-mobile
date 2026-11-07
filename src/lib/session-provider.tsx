import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { PortalMe } from '@/data/types';

import { patientMessage } from './api-error';
import { configured } from './config';
import { nativePush } from './native-push';
import { unregisterThisPhone } from './push';
import { session } from './session-instance';

/**
 * The app's view of the patient session (`session.ts` holds the tokens and the rules). After sign-in the profile
 * (`GET /portal/me`) is loaded once: its clinic time zone is used for every date.
 */
export type AppSession =
  | { status: 'starting' }
  | { status: 'not_configured' }
  | { status: 'signed_out'; notice: string | null }
  /** Password accepted; the authenticator or recovery code is next. */
  | { status: 'code_required' }
  | { status: 'signed_in'; me: PortalMe }
  /** A stored session could not be checked (offline, server error) or the profile did not load. */
  | { status: 'unavailable'; message: string };

type SessionValue = {
  state: AppSession;
  signIn: (email: string, password: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  cancelCode: () => void;
  activate: (input: { patientNumber: string; birthDate: string; activationCode: string; email: string; password: string }) => Promise<void>;
  retry: () => void;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppSession>(configured ? { status: 'starting' } : { status: 'not_configured' });

  const loadMe = useCallback(async () => {
    try {
      setState({ status: 'signed_in', me: await session.get<PortalMe>('/portal/me') });
    } catch (error) {
      if (!session.signedIn) return; // the session ended; the listener shows sign-in
      setState({ status: 'unavailable', message: patientMessage(error) });
    }
  }, []);

  const start = useCallback(async () => {
    try {
      if (await session.restore()) await loadMe();
      else setState({ status: 'signed_out', notice: null });
    } catch (error) {
      setState({ status: 'unavailable', message: patientMessage(error) });
    }
  }, [loadMe]);

  useEffect(() => {
    if (!configured) return;
    const unsubscribe = session.subscribe((change) => {
      if (change.status === 'signed_out') setState({ status: 'signed_out', notice: change.reason === 'session_ended' ? 'Your session has ended. Sign in again.' : null });
    });
    // Restoring awaits the API, so it starts after this effect (never a synchronous state change here).
    void Promise.resolve().then(start);
    return unsubscribe;
  }, [start]);

  const value = useMemo<SessionValue>(
    () => ({
      state,
      async signIn(email, password) {
        const result = await session.signIn(email.trim(), password);
        if (result === 'code_required') setState({ status: 'code_required' });
        else await loadMe();
      },
      async verifyCode(code) {
        await session.verifyCode(code.trim());
        await loadMe();
      },
      cancelCode() {
        setState({ status: 'signed_out', notice: null });
      },
      async activate(input) {
        await session.activate(input);
        await loadMe();
      },
      retry() {
        setState({ status: 'starting' });
        void (session.signedIn ? loadMe() : start());
      },
      // This phone stops receiving the patient's notifications first (best effort; never blocks signing out).
      async signOut() {
        await unregisterThisPhone(session, nativePush);
        await session.signOut();
      },
    }),
    [state, loadMe, start],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(SessionContext);
  if (!v) throw new Error('useSession must be used inside <SessionProvider>');
  return v;
}

/** The signed-in patient's profile and their clinic's time zone (dates are shown in it). */
export function useMe(): { me: PortalMe | null; timeZone: string } {
  const { state } = useSession();
  const me = state.status === 'signed_in' ? state.me : null;
  return { me, timeZone: me?.timeZone ?? 'Asia/Manila' };
}
