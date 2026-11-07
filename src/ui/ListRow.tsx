import { router, type Href } from 'expo-router';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import { MIN_TOUCH } from './theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Shown before the chevron (badge, value…). */
  trailing?: ReactNode;
  href?: Href;
  onPress?: () => void;
  chevron?: boolean;
  /** Draws the divider above this row. Pass false on the first row. */
  divider?: boolean;
};

export function ListRow({ title, subtitle, icon: Icon, trailing, href, onPress, chevron, divider = true }: ListRowProps) {
  const { colors } = useTheme();
  const pressable = !!href || !!onPress;
  const showChevron = chevron ?? pressable;

  const body = (pressed: boolean) => (
    <View style={[styles.row, divider && { borderTopWidth: 1, borderTopColor: colors.border }, pressed && { opacity: 0.7 }]}>
      {Icon ? (
        <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
          <Icon size={18} color={colors.primary} strokeWidth={2} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text weight={600}>{title}</Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {showChevron ? <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} /> : null}
    </View>
  );

  if (href) {
    return (
      <Pressable accessibilityRole="link" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} onPress={() => router.push(href)}>
        {({ pressed }) => body(pressed)}
      </Pressable>
    );
  }
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} onPress={onPress}>
        {({ pressed }) => body(pressed)}
      </Pressable>
    );
  }
  return body(false);
}

/** Label/value row used in definition lists (Profile, Notifications "Sent to"). */
export function KeyValueRow({ label, value, divider = true, children }: { label: string; value?: string; divider?: boolean; children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.kv, divider && { borderTopWidth: 1, borderTopColor: colors.border }]}>
      <Text variant="bodySm" muted>
        {label}
      </Text>
      {children ?? (
        <Text variant="bodySm" weight={700} style={styles.kvValue}>
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: MIN_TOUCH },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  kvValue: { flexShrink: 1, textAlign: 'right' },
});
