import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from './ThemeProvider';
import { MIN_TOUCH } from './theme';

type ToggleProps = { value: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean };

/** 52 × 32 switch from the design (not the platform switch, so it matches in both themes). */
export function Switch({ value, onChange, label, disabled }: ToggleProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      hitSlop={6}
      style={[styles.track, { backgroundColor: value ? colors.primary : colors.switchTrackOff, opacity: disabled ? 0.5 : 1 }]}>
      <View style={[styles.knob, { left: value ? 23 : 3 }]} />
    </Pressable>
  );
}

/** 22 px checkbox with a 44 px touch area. */
export function Checkbox({ value, onChange, label, tone = 'primary' }: ToggleProps & { tone?: 'primary' | 'danger' }) {
  const { colors } = useTheme();
  const on = tone === 'danger' ? colors.danger.fg : colors.primary;
  return (
    <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={styles.checkHit}>
      <View style={[styles.box, value ? { backgroundColor: on, borderColor: on } : { borderColor: colors.inputBorder, backgroundColor: colors.card }]}>
        {value ? <Check size={15} color={tone === 'danger' ? colors.card : colors.onPrimary} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 52, height: 32, borderRadius: 999 },
  knob: { position: 'absolute', top: 3, width: 26, height: 26, borderRadius: 999, backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  checkHit: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
