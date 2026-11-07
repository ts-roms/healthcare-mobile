import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { dark, elevation, light, type Palette } from './theme';

export type ThemeOverride = 'system' | 'light' | 'dark';

type ThemeValue = {
  scheme: 'light' | 'dark';
  colors: Palette;
  shadow: ReturnType<typeof elevation>;
  override: ThemeOverride;
  setOverride: (value: ThemeOverride) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Follows the system setting unless the person picks Light or Dark in Profile.
 * The override is the only thing the design allows us to persist; this project has no
 * storage module yet (expo-secure-store / AsyncStorage), so it lives in memory for now.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<ThemeOverride>('system');
  const scheme: 'light' | 'dark' = override === 'system' ? (system === 'dark' ? 'dark' : 'light') : override;

  const value = useMemo<ThemeValue>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? dark : light,
      shadow: elevation(scheme),
      override,
      setOverride,
    }),
    [scheme, override],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>');
  return value;
}
