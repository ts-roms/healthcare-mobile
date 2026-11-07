import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from './ThemeProvider';
import { font, type as typeScale, type TypeVariant, type Weight } from './theme';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  weight?: Weight;
  color?: string;
  /** Shorthand for the muted text colour. */
  muted?: boolean;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', weight, color, muted, align, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const t = typeScale[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          color: color ?? (muted ? colors.textMuted : colors.text),
          textAlign: align,
        },
        font(weight ?? t.weight),
        style,
      ]}
    />
  );
}
