import type { BottomTabBarProps } from 'expo-router/tabs';
import { Calendar, FlaskConical, House, MessageSquare, Pill, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  results: FlaskConical,
  visits: Calendar,
  medicines: Pill,
  messages: MessageSquare,
};

/** Floating, rounded tab bar: 16 px from the sides, 22 px from the bottom. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors, shadow } = useTheme();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom - 8, 0) + 22 }]}>
      <View accessibilityRole="tablist" style={[styles.bar, { backgroundColor: colors.tabBarBg, boxShadow: shadow.tabBar }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const Icon = ICONS[route.name] ?? House;
          const badge = options.tabBarBadge;
          const color = focused ? colors.primary : colors.textMuted;

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
              style={[styles.tab, focused && { backgroundColor: colors.primarySubtle }]}>
              <View>
                <Icon size={22} color={color} strokeWidth={2} />
                {badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.dangerDot, borderColor: colors.card }]}>
                    <Text variant="small" weight={700} color="#FFFFFF" style={styles.badgeText}>
                      {String(badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="small" weight={focused ? 700 : 500} color={color} numberOfLines={1}>
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
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: { flexDirection: 'row', justifyContent: 'space-around', padding: 6, borderRadius: 28 },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 22, paddingVertical: 4 },
  badge: { position: 'absolute', top: -5, right: -10, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  badgeText: { fontSize: 10, lineHeight: 13, color: '#FFFFFF' },
});
