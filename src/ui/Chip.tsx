import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import { MIN_TOUCH } from './theme';

type Option<T extends string> = { value: T; label: string };

type ChipProps = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: ChipProps) {
  const { colors, shadow } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary, boxShadow: shadow.primary }
          : { backgroundColor: colors.card, borderColor: colors.inputBorder },
        pressed && { opacity: 0.85 },
      ]}>
      <Text variant="bodySm" weight={600} color={selected ? colors.onPrimary : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
}

type ChipGroupProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Horizontal row of filter chips (Results, Messages). */
export function ChipGroup<T extends string>({ options, value, onChange, accessibilityLabel }: ChipGroupProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={accessibilityLabel} contentContainerStyle={styles.row} style={styles.scroller}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  );
}

/** Pill-in-track segmented control (Bills tabs, theme picker). */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: ChipGroupProps<T>) {
  const { colors, shadow } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={[styles.track, { backgroundColor: colors.segmentedBg }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && { backgroundColor: colors.card, boxShadow: shadow.segment }]}>
            <Text variant="bodySm" weight={selected ? 700 : 600} color={selected ? colors.text : colors.textBody} align="center">
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0, marginHorizontal: -20 },
  row: { gap: 8, paddingHorizontal: 20, paddingVertical: 2 },
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  track: { flexDirection: 'row', gap: 4, borderRadius: 14, padding: 4 },
  segment: { flex: 1, minHeight: MIN_TOUCH - 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});
