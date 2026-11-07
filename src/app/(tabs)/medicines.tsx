import { router } from 'expo-router';
import { Check, Pill } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { PortalPrescription } from '@/data/types';
import { howToTake, medicineName, refillRequest } from '@/domain/wording';
import { formatDateShort } from '@/lib/format';
import { useMe } from '@/lib/session-provider';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageTitle, Screen, Section, Text, useTheme } from '@/ui';

/**
 * Active prescriptions (`GET /portal/prescriptions`). Left out of the design until there is an API or an approved
 * requirement: the "Today" check-offs, reminders, the "Supply left" bar and the allergy card (no patient allergy endpoint).
 */
export default function MedicinesScreen() {
  const { timeZone } = useMe();
  const { data, error, reload } = useApi(api.getPrescriptions);

  return (
    <Screen tabBar header={<PageTitle title="Medicines" />}>
      {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <Section title="Active prescriptions">
          {data.length === 0 ? <EmptyState icon={Pill} title="No active prescriptions" /> : data.map((p) => <PrescriptionCard key={p.id} rx={p} timeZone={timeZone} />)}
        </Section>
      ) : null}
    </Screen>
  );
}

function PrescriptionCard({ rx, timeZone }: { rx: PortalPrescription; timeZone: string }) {
  const { colors } = useTheme();
  const facts: [string, string][] = [
    ['Prescribed by', rx.prescriberName ?? '—'],
    ['Date', formatDateShort(rx.issuedAt, timeZone)],
    ['Prescription no.', rx.prescriptionNumber],
  ];
  return (
    <Card size="lg" style={{ gap: 14 }}>
      {rx.items.map((item, i) => (
        <View key={i} style={{ gap: 12 }}>
          <View style={styles.head}>
            <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
              <Pill size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.titleRow}>
                <Text weight={700} style={{ fontSize: 17, lineHeight: 22, flexShrink: 1 }}>
                  {medicineName(item)}
                </Text>
                {i === 0 ? <Badge label="Active" tone="success" icon={Check} /> : null}
              </View>
              <Text variant="bodySm" muted>
                {[item.dosageForm, item.route].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
          <View style={[styles.directions, { backgroundColor: colors.background }]}>
            <Text variant="bodySm">
              <Text variant="bodySm" weight={600}>
                {howToTake(item)}
              </Text>
              {item.instructions ? `. ${item.instructions}` : '.'}
            </Text>
          </View>
          <View style={styles.grid}>
            <Fact label="Quantity" value={`${item.quantity} ${item.quantityUnit}${item.quantity === 1 ? '' : 's'}`} />
            <Fact label="Refills" value={String(item.refills)} />
          </View>
        </View>
      ))}
      <View style={[styles.grid, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }]}>
        {facts.map(([k, v]) => (
          <Fact key={k} label={k} value={v} />
        ))}
      </View>
      {rx.notes ? (
        <Text variant="bodySm" muted>
          {rx.notes}
        </Text>
      ) : null}
      <Button
        label="Ask for a refill"
        variant="secondary"
        size="md"
        onPress={() => router.push({ pathname: '/messages/new', params: { topic: 'medication', ...refillRequest(rx, formatDateShort(rx.issuedAt, timeZone)) } })}
      />
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text variant="small" muted>
        {label}
      </Text>
      <Text variant="bodySm" weight={600}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  directions: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  cell: { width: '50%', paddingRight: 8 },
});
