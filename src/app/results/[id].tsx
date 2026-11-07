import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, MessageSquare } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { FlagBadge } from '@/components/FlagBadge';
import { hasRangeBar } from '@/components/ResultCards';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { PortalResult } from '@/data/types';
import { resultValue, usualRange } from '@/domain/portal-results';
import { flagCopy, rangeShort } from '@/domain/results';
import { formatDate, formatTime, partsInZone } from '@/lib/format';
import { useMe } from '@/lib/session-provider';
import { BottomActionBar, Button, Card, ErrorState, Header, Loading, RangeBar, Screen, Section, Text, TrendChart, useTheme } from '@/ui';

const when = (r: PortalResult) => r.collectedAt ?? r.releasedAt ?? '';

/** One test over time (`GET /portal/results/trend?testId=`): the latest value, the trend and every value with its range at the time. */
export default function ResultDetailScreen() {
  const { id: testId } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { timeZone } = useMe();

  const { data, error, reload } = useApi(async () => {
    const [trend, appointments] = await Promise.all([api.getResultTrend(testId), api.getAppointments()]);
    return { trend, appointments };
  }, [testId]);

  const points = [...(data?.trend.points ?? [])].sort((a, b) => when(a).localeCompare(when(b)));
  const r = points.at(-1);
  const numeric = points.filter((p): p is PortalResult & { valueNumeric: number } => p.resultType === 'numeric' && p.valueNumeric !== null);
  const next = data?.appointments.upcoming.filter((a) => a.status !== 'cancelled').sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const unit = data?.trend.unit ? ` ${data.trend.unit}` : '';
  const trendLabel = numeric.length
    ? `${data?.trend.testName}: ${numeric
        .map((p) => {
          const d = partsInZone(when(p), timeZone);
          return `${p.valueNumeric}${unit} in ${d.month} ${d.year}`;
        })
        .join(', ')}.`
    : '';

  return (
    <Screen
      header={<Header title={data?.trend.testName ?? 'Result'} leadingLabel="Back to results" />}
      footer={
        r ? (
          <BottomActionBar>
            <Button
              label="Ask about this result"
              icon={MessageSquare}
              onPress={() => router.push({ pathname: '/messages/new', params: { topic: 'results', subject: `About my ${data?.trend.testName ?? 'result'}` } })}
            />
          </BottomActionBar>
        ) : null
      }
      contentStyle={{ gap: 16 }}>
      {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && !r ? <Text muted>No results for this test yet.</Text> : null}
      {r ? (
        <>
          <Card size="lg" style={{ gap: 12 }}>
            <Text variant="caption" muted>
              {[when(r) ? formatDate(when(r), timeZone) : null, r.performingLaboratory ? `Tested by ${r.performingLaboratory}` : null, r.corrected ? 'Corrected' : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <View style={styles.valueRow}>
              <Text weight={800} style={styles.value}>
                {resultValue(r)}
              </Text>
              {r.unit ? (
                <Text weight={600} muted style={{ fontSize: 18, lineHeight: 24 }}>
                  {r.unit}
                </Text>
              ) : null}
            </View>
            <FlagBadge flag={r.flag} long />
            {hasRangeBar(r) ? (
              <RangeBar value={r.valueNumeric} low={r.refLow} high={r.refHigh} rangeText={rangeShort(r) ?? ''} tone={flagCopy(r.flag).tone} />
            ) : usualRange(r) ? (
              <Text variant="bodySm" muted>
                {usualRange(r)}
              </Text>
            ) : null}
          </Card>

          <Card size="lg" style={{ gap: 10, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14 }}>
            <View style={styles.between}>
              <Text variant="cardTitle" accessibilityRole="header">
                Your trend
              </Text>
              {points.length > 1 ? (
                <Text variant="caption" muted>
                  {points.length} results
                </Text>
              ) : null}
            </View>
            {numeric.length > 1 ? (
              <TrendChart
                data={numeric.map((p) => ({ value: p.valueNumeric, low: p.refLow, high: p.refHigh, label: partsInZone(when(p), timeZone).monthShort }))}
                accessibilityLabel={trendLabel}
              />
            ) : (
              <Text variant="bodySm" muted>
                No chart yet — you’ll see your trend once there are two or more results for this test.
              </Text>
            )}
          </Card>

          {points.length > 1 ? (
            <Section title="History" gap={10}>
              <Card padded={false}>
                {[...points].reverse().map((p, i) => (
                  <View key={p.id} style={[styles.historyRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text weight={600}>{when(p) ? formatDate(when(p), timeZone) : '—'}</Text>
                      <Text variant="caption" muted>
                        {usualRange(p) ?? 'No usual range'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text weight={800}>
                        {resultValue(p)}
                        {p.unit ? ` ${p.unit}` : ''}
                      </Text>
                      <FlagBadge flag={p.flag} size="sm" />
                    </View>
                  </View>
                ))}
              </Card>
            </Section>
          ) : null}

          {next ? (
            <Section title="What happens next" gap={10}>
              <Card size="lg" style={styles.next}>
                <View style={[styles.nextIcon, { backgroundColor: colors.primarySubtle }]}>
                  <Calendar size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight={600}>{next.practitionerName} can go over this with you</Text>
                  <Text variant="caption" muted>
                    {next.visitType} · {formatDate(next.startsAt, next.timeZone)} · {formatTime(next.startsAt, next.timeZone)}
                  </Text>
                </View>
              </Card>
            </Section>
          ) : null}

          <Text variant="caption" muted>
            This shows where your value sits against the laboratory’s usual range. Talk to your doctor about what it means for you, and don’t change your medicines without them.
          </Text>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  value: { fontSize: 44, lineHeight: 48, letterSpacing: -1.32 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  next: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  nextIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
