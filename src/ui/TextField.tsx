import { forwardRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

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

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField({ label, help, error, labelAction, readOnly, multiline, onFocus, onBlur, ...rest }, ref) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger.fg : focused ? colors.primary : readOnly ? colors.border : colors.inputBorder;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text variant="bodySm" weight={600} nativeID={`${label}-label`}>
          {label}
        </Text>
        {labelAction}
      </View>
      <TextInput
        ref={ref}
        {...rest}
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
  multiline: { minHeight: 96, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
});
