import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { PortalResult } from '@/data/types';
import { resultValue } from '@/domain/portal-results';
import { flagCopy, rangeShort } from '@/domain/results';
import { formatMonthDay } from '@/lib/format';
import { Card, RangeBar, Text, useTheme, type BadgeTone } from '@/ui';

import { FlagBadge } from './FlagBadge';

const spoken = (r: PortalResult) => {
  const range = rangeShort(r);
  return `${r.testName}, ${resultValue(r)}${r.unit ? ` ${r.unit}` : ''}, ${flagCopy(r.flag).long}${range ? `, usual ${range}` : ''}`;
};

const detailHref = (r: PortalResult) => ({ pathname: '/results/[id]' as const, params: { id: r.testId } });
const when = (r: PortalResult) => r.collectedAt ?? r.releasedAt;

/** Numeric result with a range: the bar can be drawn. */
export function hasRangeBar(r: PortalResult): r is PortalResult & { valueNumeric: number } {
  return r.resultType === 'numeric' && r.valueNumeric !== null && (r.refLow !== null || r.refHigh !== null);
}

const barTone = (r: PortalResult): BadgeTone => flagCopy(r.flag).tone;

/** Large result card with the range bar (Home, newest result). */
export function ResultHeroCard({ result: r, timeZone }: { result: PortalResult; timeZone: string }) {
  const { colors } = useTheme();
  const d = when(r);
  return (
    <Card href={detailHref(r)} accessibilityLabel={spoken(r)} style={{ gap: 10 }}>
      <View style={styles.between}>
        <Text weight={600}>{r.testName}</Text>
        {d ? (
          <Text variant="caption" muted>
            {formatMonthDay(d, timeZone)}
          </Text>
        ) : null}
      </View>
      <View style={styles.valueRow}>
        <Text weight={800} style={styles.bigValue}>
          {resultValue(r)}
          {r.unit ? (
            <Text weight={600} color={colors.textMuted} style={{ fontSize: 15 }}>
              {' '}
              {r.unit}
            </Text>
          ) : null}
        </Text>
        <FlagBadge flag={r.flag} long />
      </View>
      {hasRangeBar(r) ? <RangeBar value={r.valueNumeric} low={r.refLow} high={r.refHigh} rangeText={rangeShort(r) ?? ''} tone={barTone(r)} /> : null}
    </Card>
  );
}

/** Compact result card (Home, other new results). */
export function ResultCompactCard({ result: r, timeZone }: { result: PortalResult; timeZone: string }) {
  const { colors } = useTheme();
  const d = when(r);
  const range = rangeShort(r);
  return (
    <Card href={detailHref(r)} accessibilityLabel={spoken(r)} style={styles.compact}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight={600}>{r.testName}</Text>
        <Text variant="caption" muted>
          {[d ? formatMonthDay(d, timeZone) : null, range ? `Usual ${range}` : null].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text weight={800} style={{ fontSize: 18, lineHeight: 24 }}>
        {resultValue(r)}
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
export function ResultRow({ result: r, first }: { result: PortalResult; first: boolean }) {
  const { colors } = useTheme();
  const range = rangeShort(r);
  return (
    <View style={[styles.row, !first && { borderTopWidth: 1, borderTopColor: colors.border }]}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text weight={600}>{r.testName}</Text>
        {range ? (
          <Text variant="caption" muted>
            Usual {range}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text weight={800} style={{ fontSize: 17, lineHeight: 22 }}>
          {resultValue(r)}
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

export { spoken as spokenResult, detailHref as resultHref };

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  bigValue: { fontSize: 28, lineHeight: 34, letterSpacing: -0.56 },
  compact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 44 },
});
