import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
  size?: 'sm' | 'md';
};

/** Status pill. Clinical status always passes an icon so it is never colour alone. */
export function Badge({ label, tone = 'neutral', icon: Icon, size = 'md' }: BadgeProps) {
  const { colors } = useTheme();
  const t =
    tone === 'neutral'
      ? { fg: colors.textMuted, bg: colors.segmentedBg }
      : tone === 'primary'
        ? { fg: colors.primaryDeep, bg: colors.primarySubtle }
        : colors[tone];
  return (
    <View style={[styles.badge, size === 'sm' ? styles.sm : styles.md, { backgroundColor: t.bg }]}>
      {Icon ? <Icon size={size === 'sm' ? 11 : 12} color={t.fg} strokeWidth={2.6} /> : null}
      <Text variant="small" weight={700} color={t.fg} style={size === 'sm' ? styles.smText : undefined}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, alignSelf: 'flex-start' },
  md: { paddingHorizontal: 9, paddingVertical: 3 },
  sm: { paddingHorizontal: 8, paddingVertical: 2 },
  smText: { fontSize: 11, lineHeight: 15 },
});
