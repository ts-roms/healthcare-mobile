import { Avatar, useTheme } from '@/ui';

export type SenderKind = 'clinic' | 'conversation' | 'billing' | 'visits';

/** Avatar for a notice or conversation: a colour family per kind, with initials or a symbol. */
export function SenderAvatar({ kind, initials, size = 44 }: { kind: SenderKind; initials: string; size?: number }) {
  const { colors } = useTheme();
  const tone = {
    clinic: { bg: colors.primary, fg: colors.onPrimary },
    conversation: { bg: colors.primarySubtle, fg: colors.primaryDeep },
    billing: { bg: colors.info.bg, fg: colors.info.fg },
    visits: { bg: colors.warning.bg, fg: colors.warning.fg },
  }[kind];
  return <Avatar initials={initials} size={size} bg={tone.bg} fg={tone.fg} />;
}

/** "Demo Health" → "DH" */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '•'
  );
}
