import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { CloudOff, Settings } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { configureForegroundNotices, notifications, pushAvailable } from '@/lib/native-push';
import { pushRoute } from '@/lib/push-route';
import { SessionProvider, useSession } from '@/lib/session-provider';
import { EmptyState, Loading, ThemeProvider, useTheme } from '@/ui';

// Keep the native splash up until Figtree is loaded; the animated copy (AnimatedSplash) then takes over and hides it.
SplashScreen.preventAutoHideAsync();
// A notice arriving while the app is open shows as a quiet banner (no-op in Expo Go and on the web).
configureForegroundNotices();

function RootStack() {
  const { state, retry } = useSession();
  const { scheme, colors } = useTheme();
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  if (state.status === 'starting' || state.status === 'not_configured' || state.status === 'unavailable') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {state.status === 'starting' ? <Loading label="Opening MyHealth" /> : null}
        {state.status === 'not_configured' ? (
          <EmptyState icon={Settings} title="MyHealth is not set up" body="This build has no API address or organization. Set EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_ORGANIZATION_CODE in .env.local, then restart." />
        ) : null}
        {state.status === 'unavailable' ? <EmptyState icon={CloudOff} title="Can’t reach MyHealth" body={state.message} action={{ label: 'Try again', onPress: retry }} /> : null}
      </View>
    );
  }

  const signedIn = state.status === 'signed_in';
  return (
    <NavThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: colors.background, card: colors.card, text: colors.text, primary: colors.primary, border: colors.border } }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {pushAvailable ? <OpenFromNotification signedIn={signedIn} /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="results/[id]" />
          <Stack.Screen name="messages/[id]" />
          <Stack.Screen name="messages/thread/[id]" />
          <Stack.Screen name="messages/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile" />
          <Stack.Screen name="bills" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="book" options={{ presentation: 'modal' }} />
          <Stack.Screen name="qr" options={{ presentation: 'modal' }} />
          <Stack.Screen name="consult" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="activate" />
        </Stack.Protected>
      </Stack>
    </NavThemeProvider>
  );
}

/**
 * Mounted only where expo-notifications can load (not Expo Go, not the web). Tapping a notice opens the matching screen
 * once signed in; the notice itself carries only a MyHealth page, never anything clinical.
 */
function OpenFromNotification({ signedIn }: { signedIn: boolean }) {
  const response = notifications().useLastNotificationResponse();
  useEffect(() => {
    if (!signedIn || !response) return;
    const route = pushRoute(response.notification.request.content.data?.['url']);
    if (route) router.navigate(route);
  }, [response, signedIn]);
  return null;
}

/** The animated splash over the app until the session is restored (signed in, signed out or an error to show). */
function SplashHandOff() {
  const { state } = useSession();
  const [showing, setShowing] = useState(true);
  const done = useCallback(() => setShowing(false), []);
  return showing ? <AnimatedSplash ready={state.status !== 'starting'} onDone={done} /> : null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <RootStack />
          <SplashHandOff />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
