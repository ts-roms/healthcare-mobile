import { router } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from './Button';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import { spacing, TAB_BAR_SPACE } from './theme';

type ScreenProps = {
  children: ReactNode;
  /** Rendered above the scroll area (e.g. `Header`, or a page title block). */
  header?: ReactNode;
  /** Rendered under the scroll area (e.g. `BottomActionBar`). */
  footer?: ReactNode;
  /** Leave room for the floating tab bar. */
  tabBar?: boolean;
  scroll?: boolean;
  background?: string;
  contentStyle?: ViewStyle;
  /** Extra node drawn over the content (e.g. a floating button). */
  overlay?: ReactNode;
};

export function Screen({ children, header, footer, tabBar, scroll = true, background, contentStyle, overlay }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = tabBar ? TAB_BAR_SPACE + insets.bottom : footer ? spacing.xxl : spacing.xxl + insets.bottom;

  const content = (
    <View style={[styles.content, { paddingBottom: bottomPad }, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: background ?? colors.background, paddingTop: header ? 0 : insets.top }]}>
      {header}
      {scroll ? (
        <ScrollView style={styles.flex} contentContainerStyle={styles.grow} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{content}</View>
      )}
      {footer}
      {overlay}
    </View>
  );
}

type PageTitleProps = {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  children?: ReactNode;
};

/** Large 30/800 title used by the tab screens. */
export function PageTitle({ title, eyebrow, right, children }: PageTitleProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.pageTitle, { paddingTop: insets.top + 16 }]}>
      <View style={styles.pageTitleRow}>
        <View style={styles.flex}>
          {eyebrow ? (
            <Text variant="caption" weight={500} muted>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
        </View>
        {right ? <View style={styles.actions}>{right}</View> : null}
      </View>
      {children}
    </View>
  );
}

type HeaderProps = {
  title?: string;
  subtitle?: string;
  /** `back` shows an arrow, `close` an X. */
  leading?: 'back' | 'close' | 'none';
  onLeading?: () => void;
  leadingLabel?: string;
  actions?: ReactNode;
  color?: string;
};

/** Compact header for detail and flow screens. */
export function Header({ title, subtitle, leading = 'back', onLeading, leadingLabel, actions, color }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const fg = color ?? colors.text;
  const goBack = onLeading ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/index')));

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {leading !== 'none' ? (
        <IconButton
          icon={leading === 'close' ? X : ArrowLeft}
          label={leadingLabel ?? (leading === 'close' ? 'Close' : 'Back')}
          onPress={goBack}
          color={fg}
          variant="plain"
          size={22}
        />
      ) : null}
      <View style={[styles.flex, leading === 'none' && { paddingLeft: 8 }]}>
        {title ? (
          <Text variant="headerTitle" color={fg} accessibilityRole="header" numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actions}
    </View>
  );
}

type SectionProps = { title?: string; right?: ReactNode; children: ReactNode; eyebrow?: boolean; gap?: number; titleAccessory?: ReactNode };

/** A titled block of content with 10 px between title and body. */
export function Section({ title, right, children, eyebrow, gap = 10, titleAccessory }: SectionProps) {
  return (
    <View style={{ gap }}>
      {title || right ? (
        <View style={styles.sectionHead}>
          {title ? (
            <View style={[styles.flex, styles.titleRow]}>
              <Text variant={eyebrow ? 'eyebrow' : 'section'} muted={eyebrow} accessibilityRole="header">
                {title}
              </Text>
              {titleAccessory}
            </View>
          ) : (
            <View style={styles.flex} />
          )}
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  content: { paddingHorizontal: spacing.gutter, paddingTop: 4, gap: 20, flexGrow: 1 },
  pageTitle: { paddingHorizontal: spacing.gutter, paddingBottom: 12, gap: 14 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingBottom: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
});
