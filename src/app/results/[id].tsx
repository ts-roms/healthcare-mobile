import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, MessageSquare } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { FlagBadge } from '@/components/FlagBadge';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { flagCopy } from '@/domain/results';
import { formatDate, formatTime, partsInZone } from '@/lib/format';
import { useMe } from '@/lib/me';
import { BottomActionBar, Button, Card, ErrorState, Header, Loading, RangeBar, Screen, Section, Text, TrendChart, useTheme } from '@/ui';

export default function ResultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { timeZone } = useMe();
  const now = new Date();

  const { data, error, reload } = useApi(async () => {
    const result = await api.getResult(id);
    const [trend, appointments] = await Promise.all([api.getResultTrend(result.testId).catch(() => null), api.getAppointments()]);
    return { result, trend, appointments };
  }, [id]);

  const r = data?.result;
  const next = data?.appointments.find((a) => a.status === 'booked' && new Date(a.startsAt) > now);
  const points = data?.trend?.points ?? [];

  const trendLabel =
    r && points.length
      ? `${r.name} ${points.map((p) => `${p.value}${data?.trend?.unit === '%' ? '%' : ` ${data?.trend?.unit}`} in ${partsInZone(p.collectedAt, timeZone).month} ${partsInZone(p.collectedAt, timeZone).year}`).join(', ')}. Usual range ${r.rangeText}.`
      : '';

  return (
    <Screen
      header={<Header title={r?.name ?? 'Result'} leadingLabel="Back to results" />}
      footer={
        r ? (
          <BottomActionBar>
            <Button label="Ask about this result" icon={MessageSquare} onPress={() => router.navigate('/messages')} />
          </BottomActionBar>
        ) : null
      }
      contentStyle={{ gap: 16 }}>
      {/* "Share or download" is in the design; the portal API has no result PDF endpoint listed yet (Needs API). */}
      {error && !data ? <ErrorState message={error.message} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {r ? (
        <>
          <Card size="lg" style={{ gap: 12 }}>
            <Text variant="caption" muted>
              {formatDate(r.collectedAt, timeZone)} · Released by {r.releasedBy}
            </Text>
            <View style={styles.valueRow}>
              <Text weight={800} style={styles.value}>
                {r.value}
              </Text>
              {r.unit ? (
                <Text weight={600} muted style={{ fontSize: 18, lineHeight: 24 }}>
                  {r.unit}
                </Text>
              ) : null}
              <View style={{ marginLeft: 'auto' }}>
                <FlagBadge flag={r.flag} long />
              </View>
            </View>
            {r.numericValue !== null && (r.low !== null || r.high !== null) ? <RangeBar value={r.numericValue} low={r.low} high={r.high} rangeText={r.rangeText} tone={flagCopy(r.flag).tone} /> : <Text variant="bodySm" muted>Usual: {r.rangeText}</Text>}
            {/* A per-test health-facts explainer is in the mockup but not returned by the API (Needs API). */}
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
            {points.length > 1 ? (
              <TrendChart data={points.map((p) => ({ value: p.value, low: p.low, high: p.high, label: partsInZone(p.collectedAt, timeZone).monthShort }))} accessibilityLabel={trendLabel} />
            ) : (
              <Text variant="bodySm" muted>
                No chart yet — you’ll see your trend once there are two or more results for this test.
              </Text>
            )}
          </Card>

          {next ? (
            <Section title="What happens next" gap={10}>
              <Card size="lg" style={styles.next}>
                <View style={[styles.nextIcon, { backgroundColor: colors.primarySubtle }]}>
                  <Calendar size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight={600}>{next.doctorName} can go over this with you</Text>
                  <Text variant="caption" muted>
                    {next.service} · {formatDate(next.startsAt, timeZone).replace(/ \d{4}$/, '')} · {formatTime(next.startsAt, timeZone)}
                  </Text>
                </View>
              </Card>
            </Section>
          ) : null}

          <Text variant="caption" muted>
            Don’t change your medicines without talking to your doctor.
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
  next: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  nextIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
