import { Link } from 'expo-router';
import { Check, ReceiptText } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { Billing, Invoice } from '@/data/types';
import { formatDateShort, money } from '@/lib/format';
import { useMe } from '@/lib/me';
import { Badge, Button, Card, EmptyState, ErrorState, Header, Loading, Screen, SegmentedControl, Text, useTheme } from '@/ui';

export default function BillsScreen() {
  const { colors, scheme } = useTheme();
  const { data, error, reload } = useApi(api.getBilling);
  const [tab, setTab] = useState<'due' | 'paid'>('due');

  const due = data?.invoices.filter((i) => i.status === 'due') ?? [];
  const paid = data?.invoices.filter((i) => i.status === 'paid') ?? [];
  const list = tab === 'due' ? due : paid;

  return (
    <Screen header={<Header title="Bills" />} contentStyle={{ gap: 18 }}>
      {error && !data ? <ErrorState message={error.message} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <>
          <View accessible accessibilityLabel={`You owe ${money(data.balance)}. Deposit and credit balance ${money(data.credit)}`} style={[styles.summary, { backgroundColor: scheme === 'dark' ? colors.card : colors.primaryDeep, borderColor: colors.cardBorder, borderWidth: scheme === 'dark' ? 1 : 0, boxShadow: scheme === 'dark' ? undefined : '0 14px 32px rgba(31,77,90,0.3)' }]}>
            <Text variant="caption" weight={600} color={scheme === 'dark' ? colors.textMuted : 'rgba(255,255,255,0.9)'}>
              You owe
            </Text>
            <Text weight={800} color={scheme === 'dark' ? colors.text : '#FFFFFF'} style={styles.owe}>
              {money(data.balance)}
            </Text>
            <View style={styles.between}>
              <Text variant="caption" color={scheme === 'dark' ? colors.textMuted : 'rgba(255,255,255,0.92)'}>
                Deposit and credit balance
              </Text>
              <Text variant="caption" weight={700} color={scheme === 'dark' ? colors.text : '#FFFFFF'}>
                {money(data.credit)}
              </Text>
            </View>
          </View>

          <SegmentedControl
            accessibilityLabel="Show"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'due', label: due.length ? `To pay · ${due.length}` : 'To pay' },
              { value: 'paid', label: 'Paid' },
            ]}
          />

          {list.length === 0 ? <EmptyState icon={ReceiptText} title={tab === 'due' ? 'Nothing to pay' : 'No paid bills yet'} /> : null}
          {list.map((inv) => (inv.status === 'due' ? <DueCard key={inv.id} invoice={inv} billing={data} /> : <PaidCard key={inv.id} invoice={inv} />))}

          <View style={styles.inline}>
            <Text variant="caption" muted>
              A question about a bill?{' '}
            </Text>
            <Link href="/messages" asChild>
              <Pressable accessibilityRole="link" hitSlop={10}>
                <Text variant="caption" weight={600} color={colors.link}>
                  Message billing
                </Text>
              </Pressable>
            </Link>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function InvoiceHead({ invoice: inv }: { invoice: Invoice }) {
  const { timeZone } = useMe();
  return (
    <View style={[styles.between, { alignItems: 'flex-start' }]}>
      <View style={{ flex: 1 }}>
        <Text weight={700}>{inv.title}</Text>
        <Text variant="caption" muted>
          {inv.number} · {formatDateShort(inv.issuedAt, timeZone)}
        </Text>
      </View>
      {inv.status === 'due' ? <Badge label="To pay" tone="warning" /> : <Badge label="Paid" tone="success" icon={Check} />}
    </View>
  );
}

function DueCard({ invoice: inv, billing }: { invoice: Invoice; billing: Billing }) {
  const { colors } = useTheme();
  return (
    <Card size="lg" style={{ gap: 14, padding: 18 }}>
      <InvoiceHead invoice={inv} />
      <View style={{ gap: 8 }}>
        {inv.lines.map((l) => (
          <View key={l.label} style={styles.between}>
            <Text variant="bodySm">{l.label}</Text>
            <Text variant="bodySm">{money(l.amount)}</Text>
          </View>
        ))}
        {inv.adjustments.map((a) => (
          <View key={a.label} style={styles.between}>
            <Text variant="bodySm" color={colors.success.fg}>
              {a.label}
            </Text>
            <Text variant="bodySm" color={colors.success.fg}>
              {money(a.amount)}
            </Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={styles.between}>
          <Text weight={800} style={{ fontSize: 16 }}>
            Balance
          </Text>
          <Text weight={800} style={{ fontSize: 16 }}>
            {money(inv.balance)}
          </Text>
        </View>
      </View>
      {billing.onlinePayment.available ? (
        <>
          {/* DEMO: the real button starts the provider's checkout from the portal API. */}
          <Button label={`Pay ${money(inv.balance)} online`} onPress={() => Alert.alert('Demo', 'In the real app this opens the payment provider’s checkout.')} />
          <Text variant="caption" muted align="center">
            {billing.onlinePayment.methods}. You can also pay at the clinic cashier.
          </Text>
        </>
      ) : (
        <Text variant="caption" muted align="center">
          Pay at the clinic cashier.
        </Text>
      )}
    </Card>
  );
}

function PaidCard({ invoice: inv }: { invoice: Invoice }) {
  return (
    <Card size="lg" style={{ gap: 12, padding: 18 }}>
      <InvoiceHead invoice={inv} />
      <View style={styles.between}>
        <Text variant="bodySm" muted style={{ flex: 1 }}>
          {inv.payment ? `Paid in ${inv.payment.method} · receipt ${inv.payment.receiptNo}` : 'Paid'}
        </Text>
        <Text variant="bodySm" weight={700}>
          {money(inv.payment?.amount ?? inv.total)}
        </Text>
      </View>
      {/* Invoice and receipt PDFs need a document endpoint on the portal API (Needs API). */}
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 28, padding: 22, gap: 12 },
  owe: { fontSize: 36, lineHeight: 40, letterSpacing: -0.72 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  inline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
