import type { BottomTabBarProps } from 'expo-router/tabs';
import { Calendar, FlaskConical, House, MessageSquare, Pill, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import { notchedBarPath, TAB_BAR_GEOMETRY as G } from './tabBarGeometry';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  results: FlaskConical,
  visits: Calendar,
  medicines: Pill,
  messages: MessageSquare,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const SPRING = { damping: 18, stiffness: 180, mass: 0.8 } as const;

/**
 * Floating tab bar, 16 px from the sides and 22 px from the bottom. The active tab rises out of the bar as a round
 * button sitting in a notch; the notch and button slide to the tab that is chosen (no motion with Reduce Motion on).
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors, shadow, scheme } = useTheme();
  const isDark = scheme === 'dark';
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const tabWidth = width > 0 ? (width - G.sidePadding * 2) / count : 0;
  const centerOf = (index: number) => G.sidePadding + tabWidth * (index + 0.5);

  // The notch centre, in px from the bar's left edge.
  const cx = useSharedValue(0);
  useEffect(() => {
    if (!width) return;
    const target = centerOf(state.index);
    cx.value = reduceMotion || cx.value === 0 ? target : withSpring(target, SPRING);
    // `centerOf` depends only on width and count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, width, count, reduceMotion]);

  const pathProps = useAnimatedProps(() => ({ d: notchedBarPath(width, cx.value) }));
  const bubbleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: cx.value - G.bubble / 2 }] }));

  const active = state.routes[state.index];
  const ActiveIcon = (active && ICONS[active.name]) ?? House;
  const barShadow = isDark ? 'drop-shadow(0px 10px 18px rgba(0,0,0,0.45))' : 'drop-shadow(0px 10px 18px rgba(20,37,47,0.14))';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom - 8, 0) + 22 }]}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {/* The bar's shape: a rounded rectangle with a notch under the active tab. The shadow follows the shape (filter on
          Android and the web, layer shadow on iOS). */}
      {width > 0 ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, Platform.OS === 'ios' ? styles.iosShadow : { filter: barShadow }]}>
          <Svg width={width} height={G.height}>
            <AnimatedPath animatedProps={pathProps} fill={colors.card} stroke={colors.border} strokeWidth={StyleSheet.hairlineWidth} />
          </Svg>
        </View>
      ) : null}

      {/* The raised button of the active tab, in the notch. */}
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.bubble, { backgroundColor: colors.primary, borderColor: colors.background, boxShadow: shadow.primary }, bubbleStyle]}>
          <ActiveIcon size={24} color={colors.onPrimary} strokeWidth={2.2} />
        </Animated.View>
      ) : null}

      <View accessibilityRole="tablist" style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const Icon = ICONS[route.name] ?? House;
          const badge = options.tabBarBadge;

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${label}, ${badge} new` : label}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && !focused && { opacity: 0.6 }]}>
              {/* The active tab's icon is in the raised button; its place here stays empty so the labels line up. */}
              <View style={styles.iconSlot}>
                {focused ? null : <Icon size={22} color={colors.textMuted} strokeWidth={2} />}
                {badge ? (
                  <View
                    style={[
                      styles.badge,
                      focused ? styles.badgeOnBubble : null,
                      { backgroundColor: colors.dangerDot, borderColor: colors.card },
                    ]}>
                    <Text variant="small" weight={700} color="#FFFFFF" style={styles.badgeText}>
                      {String(badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="small" weight={focused ? 800 : 500} color={focused ? colors.text : colors.textMuted} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, height: G.height },
  iosShadow: { shadowColor: '#14252F', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } },
  bubble: {
    position: 'absolute',
    left: 0,
    top: G.bubbleTop,
    width: G.bubble,
    height: G.bubble,
    borderRadius: G.bubble / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flex: 1, flexDirection: 'row', paddingHorizontal: G.sidePadding },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingBottom: 10 },
  iconSlot: { height: 24, justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -10, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  // On the raised button the badge sits at its top-right edge.
  badgeOnBubble: { top: G.bubbleTop - 14, right: -26 },
  badgeText: { fontSize: 10, lineHeight: 13, color: '#FFFFFF' },
});
