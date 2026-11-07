import { useFocusEffect } from 'expo-router';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { Socket } from 'socket.io-client';

import { REALTIME_URL } from '@/lib/config';
import { session } from '@/lib/session-instance';

import { realtimeTicket } from './api';

/** While the socket is down the screen re-reads every few seconds; while it is up, only as a safety net now and then. */
export const POLL_MS = 10_000;
export const SAFETY_MS = 30_000;
const REFRESH_DEBOUNCE_MS = 300;
const RECONNECT_MS = 15_000;
const TICK_MS = 2_000;

/**
 * Keeps a conversation or the message list current while the screen is focused and the app is in the foreground, as
 * MyHealth on the web does (`LiveRefresh`). The app opens the API's realtime socket with a short-lived ticket and calls
 * `refresh` when the clinic replies (the event says only which conversation changed; the text is re-read through the API).
 * Without the socket, or while acting for someone else (whose conversations are not on the account holder's channel),
 * it re-reads every few seconds. Nothing is stored on the device (D10).
 */
export function useLiveMessages(refresh: () => void) {
  const refreshRef = useRef(refresh);
  useLayoutEffect(() => {
    refreshRef.current = refresh;
  });

  useFocusEffect(
    useCallback(() => {
      let socket: Socket | null = null;
      let stopped = false;
      let live = false;
      let lastRefresh = Date.now();
      let refreshTimer: ReturnType<typeof setTimeout> | undefined;
      let retryTimer: ReturnType<typeof setTimeout> | undefined;

      const refreshNow = () => {
        lastRefresh = Date.now();
        refreshRef.current();
      };
      const refreshSoon = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshNow, REFRESH_DEBOUNCE_MS);
      };
      const retryLater = () => {
        live = false;
        clearTimeout(retryTimer);
        retryTimer = setTimeout(() => void start(), RECONNECT_MS);
      };
      const ticket = () => realtimeTicket().then((r) => r.ticket);

      async function start() {
        if (stopped || !REALTIME_URL || session.acting) return;
        const first = await ticket().catch(() => null);
        if (stopped) return;
        if (!first) return retryLater();
        const { io } = await import('socket.io-client');
        if (stopped) return;
        let pending: string | null = first;
        socket?.close();
        socket = io(REALTIME_URL, {
          transports: ['websocket'],
          // Tickets expire after 60 s: use the first one now, then fetch a fresh one for every reconnection.
          auth: (cb) => {
            if (pending) {
              cb({ patientTicket: pending });
              pending = null;
              return;
            }
            ticket()
              .then((t) => cb({ patientTicket: t }))
              .catch(() => cb({}));
          },
        });
        socket.on('ready', () => {
          live = true;
          // Catch up on anything missed while disconnected.
          refreshSoon();
        });
        socket.on('messages.updated', refreshSoon);
        // Socket.IO reconnects by itself after network loss; a refusal by the server ends the socket, so retry later.
        socket.on('disconnect', (reason) => (reason === 'io server disconnect' ? retryLater() : (live = false)));
        socket.on('connect_error', () => {
          live = false;
        });
      }

      void start();

      const timer = setInterval(() => {
        if (AppState.currentState !== 'active') return;
        if (Date.now() - lastRefresh < (live ? SAFETY_MS : POLL_MS) - 500) return;
        refreshNow();
      }, TICK_MS);
      // Back from the background: re-read at once.
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') refreshNow();
      });

      return () => {
        stopped = true;
        clearTimeout(refreshTimer);
        clearTimeout(retryTimer);
        clearInterval(timer);
        sub.remove();
        socket?.close();
      };
    }, []),
  );
}
