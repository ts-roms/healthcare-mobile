import { router } from 'expo-router';
import { Check, Pill } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { Prescription } from '@/data/types';
import { allergyText } from '@/domain/results';
import { formatDateShort } from '@/lib/format';
import { useMe } from '@/lib/me';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageTitle, Screen, Section, Text, useTheme } from '@/ui';

export default function MedicinesScreen() {
  const { me, timeZone } = useMe();
  const { colors } = useTheme();
  const { data, error, reload } = useApi(api.getPrescriptions);
  const active = data?.filter((p) => p.status === 'active') ?? [];
  const past = data?.filter((p) => p.status !== 'active') ?? [];

  return (
    <Screen tabBar header={<PageTitle title="Medicines" />}>
      {/*
        The design's "Today" dose check-offs, "Reminders on" pill and "Supply left" bar are not
        supported by any API (see design README). Left out until there is an approved requirement.
      */}
      {error && !data ? <ErrorState message={error.message} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <Section title="Active prescriptions">
          {active.length === 0 ? <EmptyState icon={Pill} title="No active prescriptions" /> : active.map((p) => <PrescriptionCard key={p.id} rx={p} timeZone={timeZone} />)}
        </Section>
      ) : null}
      {past.length ? (
        <Section title="Past prescriptions">
          {past.map((p) => (
            <PrescriptionCard key={p.id} rx={p} timeZone={timeZone} />
          ))}
        </Section>
      ) : null}
      {me ? (
        <Section title="Allergies">
          <Card style={styles.allergy}>
            <View style={{ flex: 1 }}>
              <Text weight={600}>{allergyText(me.allergies)}</Text>
              <Text variant="caption" muted>
                Something missing? Tell the clinic.
              </Text>
            </View>
            <Pressable accessibilityRole="link" accessibilityLabel="Update allergies" onPress={() => router.navigate('/messages')} style={{ minHeight: 44, justifyContent: 'center' }} hitSlop={8}>
              <Text variant="bodySm" weight={600} color={colors.link}>
                Update
              </Text>
            </Pressable>
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

function PrescriptionCard({ rx, timeZone }: { rx: Prescription; timeZone: string }) {
  const { colors } = useTheme();
  const facts: [string, string][] = [
    ['Prescribed by', rx.prescriber],
    ['Date', formatDateShort(rx.prescribedAt, timeZone)],
    ['Supply', rx.quantity],
    ['Prescription no.', rx.number],
  ];
  return (
    <Card size="lg" style={{ gap: 14 }}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
          <Pill size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.titleRow}>
            <Text weight={700} style={{ fontSize: 17, lineHeight: 22, flexShrink: 1 }}>
              {rx.drug}
            </Text>
            <Badge label={rx.status === 'active' ? 'Active' : 'Completed'} tone={rx.status === 'active' ? 'success' : 'neutral'} icon={rx.status === 'active' ? Check : undefined} />
          </View>
          <Text variant="bodySm" muted>
            {rx.form} · {rx.purpose}
          </Text>
        </View>
      </View>
      <View style={[styles.directions, { backgroundColor: colors.background }]}>
        <Text variant="bodySm">
          <Text variant="bodySm" weight={600}>
            {rx.directions}
          </Text>
          {rx.note ? `, ${rx.note}` : '.'}
        </Text>
      </View>
      <View style={styles.grid}>
        {facts.map(([k, v]) => (
          <View key={k} style={styles.cell}>
            <Text variant="small" muted>
              {k}
            </Text>
            <Text variant="bodySm" weight={600}>
              {v}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {/* "Show e-prescription" needs a prescription document endpoint (Needs API). */}
        <Button label="Ask for a refill" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => router.navigate('/messages')} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  allergy: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  directions: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  cell: { width: '50%', paddingRight: 8 },
});
