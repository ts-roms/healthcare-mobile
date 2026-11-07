import type { Message } from '@/data/types';
import { Avatar, useTheme } from '@/ui';

export function SenderAvatar({ message: m, size = 44 }: { message: Message; size?: number }) {
  const { colors } = useTheme();
  const tone = {
    clinic: { bg: colors.primary, fg: colors.onPrimary },
    doctor: { bg: colors.primarySubtle, fg: colors.primaryDeep },
    billing: { bg: colors.info.bg, fg: colors.info.fg },
    staff: { bg: colors.warning.bg, fg: colors.warning.fg },
  }[m.sender];
  return <Avatar initials={m.initials} size={size} bg={tone.bg} fg={tone.fg} />;
}
