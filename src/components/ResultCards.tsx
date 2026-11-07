import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { LabResult } from '@/data/types';
import { flagCopy } from '@/domain/results';
import { formatMonthDay } from '@/lib/format';
import { Card, RangeBar, Text, useTheme } from '@/ui';

import { FlagBadge } from './FlagBadge';

const spoken = (r: LabResult) => `${r.name}, ${r.value}${r.unit ? ` ${r.unit}` : ''}, ${flagCopy(r.flag).long}, usual ${r.rangeText}`;

/** Large result card with the range bar (Home, newest result). */
export function ResultHeroCard({ result: r, timeZone }: { result: LabResult; timeZone: string }) {
  const { colors } = useTheme();
  return (
    <Card href={{ pathname: '/results/[id]', params: { id: r.id } }} accessibilityLabel={spoken(r)} style={{ gap: 10 }}>
      <View style={styles.between}>
        <Text weight={600}>{r.name}</Text>
        <Text variant="caption" muted>
          {formatMonthDay(r.collectedAt, timeZone)}
        </Text>
      </View>
      <View style={styles.valueRow}>
        <Text weight={800} style={styles.bigValue}>
          {r.value}
          {r.unit ? (
            <Text weight={600} color={colors.textMuted} style={{ fontSize: 15 }}>
              {' '}
              {r.unit}
            </Text>
          ) : null}
        </Text>
        <FlagBadge flag={r.flag} long />
      </View>
      {r.numericValue !== null && (r.low !== null || r.high !== null) ? <RangeBar value={r.numericValue} low={r.low} high={r.high} rangeText={r.rangeText} tone={flagCopy(r.flag).tone} /> : null}
    </Card>
  );
}

/** Compact result card (Home, other new results). */
export function ResultCompactCard({ result: r, timeZone }: { result: LabResult; timeZone: string }) {
  const { colors } = useTheme();
  return (
    <Card href={{ pathname: '/results/[id]', params: { id: r.id } }} accessibilityLabel={spoken(r)} style={styles.compact}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight={600}>{r.name}</Text>
        <Text variant="caption" muted>
          {formatMonthDay(r.collectedAt, timeZone)} · Usual {r.rangeText}
        </Text>
      </View>
      <Text weight={800} style={{ fontSize: 18, lineHeight: 24 }}>
        {r.value}
        {r.unit ? (
          <Text variant="small" weight={600} color={colors.textMuted}>
            {' '}
            {r.unit}
          </Text>
        ) : null}
      </Text>
      <FlagBadge flag={r.flag} />
    </Card>
  );
}

/** Row inside a grouped results card (Results tab). */
export function ResultRow({ result: r, first }: { result: LabResult; first: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, !first && { borderTopWidth: 1, borderTopColor: colors.border }]}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text weight={600}>{r.name}</Text>
        <Text variant="caption" muted>
          Usual {r.rangeText}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text weight={800} style={{ fontSize: 17, lineHeight: 22 }}>
          {r.value}
          {r.unit ? (
            <Text variant="small" weight={600} color={colors.textMuted}>
              {' '}
              {r.unit}
            </Text>
          ) : null}
        </Text>
        <FlagBadge flag={r.flag} size="sm" />
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </View>
  );
}

export { spoken as spokenResult };

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  bigValue: { fontSize: 28, lineHeight: 34, letterSpacing: -0.56 },
  compact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 44 },
});
