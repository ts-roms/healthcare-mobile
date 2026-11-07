import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from './ThemeProvider';
import { radii } from './theme';

type CardProps = {
  children: ReactNode;
  /** `md` 22 px radius, `lg` 26 px. */
  size?: 'md' | 'lg';
  padded?: boolean;
  style?: ViewStyle;
  href?: Href;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Selected state, e.g. picking a service. Draws a 2 px primary border. */
  selected?: boolean;
};

export function Card({ children, size = 'md', padded = true, style, href, onPress, accessibilityLabel, selected }: CardProps) {
  const { colors, shadow } = useTheme();
  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: selected ? colors.primary : colors.cardBorder,
      borderWidth: selected ? 2 : 1,
      borderRadius: size === 'lg' ? radii.cardLg : radii.card,
      boxShadow: selected ? undefined : shadow.card,
    },
    padded ? { padding: size === 'lg' ? 20 : 16 } : {},
    style ?? {},
  ];

  if (href) {
    return (
      <Pressable accessibilityRole="link" accessibilityLabel={accessibilityLabel} onPress={() => router.push(href)} style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={selected === undefined ? undefined : { selected }} onPress={onPress} style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

/** Hairline divider between rows inside a card. */
export function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  pressed: { opacity: 0.85 },
});
