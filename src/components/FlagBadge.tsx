import { ArrowDown, ArrowUp, Check, Minus, TriangleExclamationPoint } from 'lucide-react-native';

import type { PortalResultFlag } from '@/data/types';
import { flagCopy, type FlagIcon } from '@/domain/results';
import { Badge } from '@/ui';

const ICONS: Record<FlagIcon, typeof Check> = { check: Check, up: ArrowUp, down: ArrowDown, alert: TriangleExclamationPoint, none: Minus };

/** Result status: colour + icon + words, never colour alone. `long` uses MyHealth's full sentence. */
export function FlagBadge({ flag, long, size }: { flag: PortalResultFlag | null; long?: boolean; size?: 'sm' | 'md' }) {
  const c = flagCopy(flag);
  return <Badge label={long ? c.long : c.short} tone={c.tone} icon={ICONS[c.icon]} size={size} />;
}
