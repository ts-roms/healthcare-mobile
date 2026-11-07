import { StyleSheet, View } from 'react-native';

import { rangeBarLayout } from './rangeBarLayout';
import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import type { BadgeTone } from './Badge';

type RangeBarProps = {
  value: number;
  low?: number | null;
  high?: number | null;
  /** Usual-range text exactly as the API gives it, e.g. "4.0–5.6". */
  rangeText: string;
  /** Tone of the flag the API returned; colours the marker. */
  tone: BadgeTone;
};

export function RangeBar({ value, low, high, rangeText, tone }: RangeBarProps) {
  const { colors } = useTheme();
  const l = rangeBarLayout(value, low, high);
  const markerColor = tone === 'success' ? colors.success.fg : tone === 'danger' ? colors.danger.fg : tone === 'info' ? colors.info.fg : colors.warningMarker;

  return (
    <View style={styles.wrap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={styles.bar}>
        {l.low > 0 ? <View style={[styles.seg, { flex: l.low, backgroundColor: colors.info.bg }]} /> : null}
        <View style={[styles.seg, { flex: l.usual, backgroundColor: colors.success.bg }]} />
        {l.high > 0 ? <View style={[styles.seg, { flex: l.high, backgroundColor: colors.warning.bg }]} /> : null}
        <View style={[styles.marker, { left: `${l.marker}%`, backgroundColor: markerColor, borderColor: colors.card, boxShadow: `0 0 0 1px ${markerColor}` }]} />
      </View>
      <View style={styles.labels}>
        <Text variant="small" muted>
          {l.low > 0 ? 'Low' : ''}
        </Text>
        <Text variant="small" muted>
          Usual {rangeText}
        </Text>
        <Text variant="small" muted>
          {l.high > 0 ? 'High' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  bar: { flexDirection: 'row', gap: 3, height: 8 },
  seg: { borderRadius: 999 },
  marker: { position: 'absolute', top: -4, width: 16, height: 16, marginLeft: -8, borderRadius: 999, borderWidth: 3 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
