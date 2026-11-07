import { forwardRef, useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { useTheme } from './ThemeProvider';
import { font, radii } from './theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  help?: string;
  error?: string;
  /** Rendered at the right of the label row (e.g. "Forgot?"). */
  labelAction?: ReactNode;
  multiline?: boolean;
};

/**
 * A labelled text input. With `secureTextEntry` it is a password field with a show/hide button, so people can check
 * what they typed (the text is hidden again whenever the field is first shown).
 */
export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField({ label, help, error, labelAction, readOnly, multiline, onFocus, onBlur, secureTextEntry, ...rest }, ref) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = !!secureTextEntry && !multiline;
  const borderColor = error ? colors.danger.fg : focused ? colors.primary : readOnly ? colors.border : colors.inputBorder;
  const RevealIcon = revealed ? EyeOff : Eye;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text variant="bodySm" weight={600} nativeID={`${label}-label`}>
          {label}
        </Text>
        {labelAction}
      </View>
      <View>
      <TextInput
        ref={ref}
        {...rest}
        secureTextEntry={isPassword ? !revealed : secureTextEntry}
        readOnly={readOnly}
        multiline={multiline}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${label}-label`}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          font(400),
          multiline && styles.multiline,
          isPassword && styles.withReveal,
          {
            color: colors.text,
            backgroundColor: readOnly ? colors.inputReadOnlyBg : colors.card,
            borderColor,
            borderWidth: focused || error ? 2 : 1.5,
          },
          // The 2 px primary border is the focus ring; drop the browser's own outline on web.
          Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
        ]}
      />
      {isPassword ? (
        <Pressable
          onPress={() => setRevealed((r) => !r)}
          disabled={readOnly}
          accessibilityRole="button"
          accessibilityLabel={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          hitSlop={4}
          style={({ pressed }) => [styles.reveal, pressed && { opacity: 0.6 }]}>
          <RevealIcon size={20} strokeWidth={2} color={colors.textMuted} />
        </Pressable>
      ) : null}
      </View>
      {error ? (
        <Text variant="caption" weight={600} color={colors.danger.fg} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : help ? (
        <Text variant="caption" muted>
          {help}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { minHeight: 52, paddingHorizontal: 14, borderRadius: radii.input, fontSize: 15 },
  withReveal: { paddingRight: 52 },
  // 44 × 44 touch target inside the 52 px field, on the right.
  reveal: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },
  multiline: { minHeight: 96, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
});
