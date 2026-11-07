import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import type { BadgeTone } from './Badge';

type EmptyStateProps = { icon?: LucideIcon; title: string; body?: string; action?: { label: string; onPress: () => void } };

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      {Icon ? (
        <View style={[styles.emptyIcon, { backgroundColor: colors.primarySubtle }]}>
          <Icon size={26} color={colors.primary} strokeWidth={2} />
        </View>
      ) : null}
      <Text variant="cardTitle" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="bodySm" muted align="center">
          {body}
        </Text>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} size="md" variant="secondary" /> : null}
    </View>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.loading} accessibilityLabel={label} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <EmptyState title="Something went wrong" body={message} action={onRetry ? { label: 'Try again', onPress: onRetry } : undefined} />;
}

type NoticeProps = { tone?: BadgeTone; icon?: LucideIcon; children: ReactNode; title?: string; role?: 'alert' | 'none' };

/** Inline tinted message (info, success, warning, danger). */
export function Notice({ tone = 'info', icon: Icon, children, title, role }: NoticeProps) {
  const { colors } = useTheme();
  const t = tone === 'neutral' ? { fg: colors.text, bg: colors.segmentedBg } : tone === 'primary' ? { fg: colors.primaryDeep, bg: colors.primarySubtle } : colors[tone];
  return (
    <View accessibilityRole={role === 'alert' ? 'alert' : undefined} style={[styles.notice, { backgroundColor: t.bg }, role === 'alert' && { borderWidth: 1.5, borderColor: t.fg }]}>
      {Icon ? <Icon size={18} color={t.fg} strokeWidth={2.2} style={styles.noticeIcon} /> : null}
      <View style={styles.noticeText}>
        {title ? (
          <Text weight={700} color={t.fg}>
            {title}
          </Text>
        ) : null}
        {typeof children === 'string' ? (
          <Text variant="bodySm" weight={title || tone === 'info' ? 400 : 600} color={t.fg}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

/** White sheet with 28 px top corners and one primary action (detail and flow screens). */
export function BottomActionBar({ children }: { children: ReactNode }) {
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sheet, { backgroundColor: colors.card, boxShadow: shadow.sheet, paddingBottom: Math.max(insets.bottom, 18) + 12 }]}>
      {children}
    </View>
  );
}

type AvatarProps = { initials: string; size?: number; bg?: string; fg?: string; label?: string };

export function Avatar({ initials, size = 44, bg, fg, label }: AvatarProps) {
  const { colors } = useTheme();
  return (
    <View accessibilityLabel={label} accessible={!!label} style={{ width: size, height: size, borderRadius: 999, backgroundColor: bg ?? colors.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
      <Text weight={size >= 60 ? 800 : 700} color={fg ?? colors.primaryDeep} style={{ fontSize: size >= 60 ? 20 : 14, lineHeight: size >= 60 ? 26 : 18 }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 16 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  loading: { paddingVertical: 48, alignItems: 'center' },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  noticeIcon: { marginTop: 2 },
  noticeText: { flex: 1, gap: 4 },
  sheet: { paddingTop: 12, paddingHorizontal: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 10 },
});
