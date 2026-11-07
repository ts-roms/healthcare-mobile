import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MeProvider } from '@/lib/me';
import { SessionProvider, useSession } from '@/lib/session';
import { ThemeProvider, useTheme } from '@/ui';

// Keep the splash screen up until Figtree is loaded.
SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { status } = useSession();
  const { scheme, colors } = useTheme();
  const signedIn = status === 'signedIn';
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: colors.background, card: colors.card, text: colors.text, primary: colors.primary, border: colors.border } }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="results/[id]" />
          <Stack.Screen name="messages/[id]" />
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <MeProvider>
            <RootStack />
          </MeProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
