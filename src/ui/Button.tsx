import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import { BUTTON_HEIGHT, MIN_TOUCH, radii } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** `lg` = 52 px (primary actions), `md` = 44 px. */
  size?: 'lg' | 'md';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  /** Override colours, e.g. on the teal hero card. */
  colors?: { bg: string; fg: string; border?: string };
};

export function Button({ label, onPress, variant = 'primary', size = 'lg', icon: Icon, loading, disabled, style, accessibilityHint, colors: custom }: ButtonProps) {
  const { colors, shadow } = useTheme();
  const isDisabled = disabled || loading;

  const palette = custom
    ? { bg: custom.bg, fg: custom.fg, border: custom.border ?? custom.bg }
    : {
        primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
        secondary: { bg: colors.card, fg: colors.text, border: colors.inputBorder },
        destructive: { bg: colors.card, fg: colors.danger.fg, border: colors.dangerBorder },
        ghost: { bg: 'transparent', fg: colors.link, border: 'transparent' },
      }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: size === 'lg' ? BUTTON_HEIGHT : MIN_TOUCH,
          borderRadius: size === 'lg' ? radii.button : radii.buttonSm,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'secondary' || variant === 'destructive' || custom?.border ? 1.5 : 0,
          boxShadow: variant === 'primary' && !custom && !isDisabled ? shadow.primary : undefined,
          opacity: isDisabled && !loading ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={18} color={palette.fg} strokeWidth={2} /> : null}
          <Text variant={size === 'lg' ? 'body' : 'bodySm'} weight={variant === 'primary' || variant === 'destructive' ? 700 : 600} color={palette.fg} style={size === 'lg' && variant === 'primary' ? styles.lgText : undefined} align="center">
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icon-only buttons need a spoken name. */
  label: string;
  onPress?: () => void;
  /** `elevated` = white circle with card shadow; `plain` = no background; `tinted` = translucent. */
  variant?: 'elevated' | 'plain' | 'tinted';
  color?: string;
  size?: number;
  badge?: boolean;
  children?: ReactNode;
};

export function IconButton({ icon: Icon, label, onPress, variant = 'elevated', color, size = 20, badge, children }: IconButtonProps) {
  const { colors, shadow } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.icon,
        variant === 'elevated' && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, boxShadow: shadow.card },
        variant === 'tinted' && { backgroundColor: 'rgba(255,255,255,0.14)' },
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <Icon size={size} color={color ?? colors.text} strokeWidth={2} />
      {badge ? <View style={[styles.dot, { backgroundColor: colors.dangerDot, borderColor: colors.card }]} /> : null}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  lgText: { fontSize: 16 },
  icon: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 999, borderWidth: 2 },
});
