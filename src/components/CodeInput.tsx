import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { font, Text, useTheme } from '@/ui';

type Props = { value: string; onChange: (v: string) => void; length?: number; label: string; error?: boolean };

/** Six digit boxes over one real input, so paste and SMS autofill work. */
export function CodeInput({ value, onChange, length = 6, label, error }: Props) {
  const { colors } = useTheme();
  const ref = useRef<TextInputInstance>(null);
  const digits = value.split('');

  return (
    <View style={styles.wrap}>
      <Text variant="bodySm" weight={600}>
        {label}
      </Text>
      <Pressable onPress={() => ref.current?.focus()} style={styles.row} accessible={false}>
        {Array.from({ length }, (_, i) => {
          const filled = i < digits.length;
          const active = i === Math.min(digits.length, length - 1);
          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  borderColor: error ? colors.danger.fg : filled || active ? colors.primary : colors.inputBorder,
                  borderWidth: filled || active || error ? 2 : 1.5,
                  backgroundColor: colors.card,
                },
              ]}>
              <Text weight={700} style={styles.digit}>
                {digits[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus
        accessibilityLabel={label}
        style={[styles.hidden, font(400)]}
        caretHidden
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 22, lineHeight: 28 },
  hidden: { position: 'absolute', opacity: 0.01, height: 1, width: 1, bottom: 0 },
});
