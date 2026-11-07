import { Link } from 'expo-router';
import { Check, ReceiptText } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { PortalInvoice, PortalOnlinePayment } from '@/data/types';
import { invoiceStatus, PAYMENT_METHOD, peso, totalDue } from '@/domain/wording';
import { formatDateShort } from '@/lib/format';
import { useMe } from '@/lib/session-provider';
import { Badge, Card, EmptyState, ErrorState, Header, Loading, Notice, Screen, SegmentedControl, Text, useTheme } from '@/ui';

/** Invoices, coverage and payments (`GET /portal/billing`), the deposit balance (`/account`). Amounts are centavos. */
export default function BillsScreen() {
  const { colors, scheme } = useTheme();
  const { data, error, reload } = useApi(async () => {
    const [invoices, accounts, online] = await Promise.all([api.getInvoices(), api.getAccounts(), api.getOnlinePayment()]);
    return { invoices, accounts, online };
  });
  const [tab, setTab] = useState<'due' | 'paid'>('due');

  const issued = data?.invoices.filter((i) => i.status === 'issued') ?? [];
  const due = issued.filter((i) => i.balance > 0);
  const paid = [...issued.filter((i) => i.balance <= 0), ...(data?.invoices.filter((i) => i.status === 'void') ?? [])];
  const list = tab === 'due' ? due : paid;
  const owed = data ? totalDue(data.invoices) : 0;
  const credit = data?.accounts.reduce((s, a) => s + a.balance, 0) ?? 0;

  return (
    <Screen header={<Header title="Bills" />} contentStyle={{ gap: 18 }}>
      {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <>
          <View
            accessible
            accessibilityLabel={`You owe ${peso(owed)}. Deposit and credit balance ${peso(credit)}`}
            style={[
              styles.summary,
              { backgroundColor: scheme === 'dark' ? colors.card : colors.primaryDeep, borderColor: colors.cardBorder, borderWidth: scheme === 'dark' ? 1 : 0, boxShadow: scheme === 'dark' ? undefined : '0 14px 32px rgba(31,77,90,0.3)' },
            ]}>
            <Text variant="caption" weight={600} color={scheme === 'dark' ? colors.textMuted : 'rgba(255,255,255,0.9)'}>
              You owe
            </Text>
            <Text weight={800} color={scheme === 'dark' ? colors.text : '#FFFFFF'} style={styles.owe}>
              {peso(owed)}
            </Text>
            <View style={styles.between}>
              <Text variant="caption" color={scheme === 'dark' ? colors.textMuted : 'rgba(255,255,255,0.92)'}>
                Deposit and credit balance
              </Text>
              <Text variant="caption" weight={700} color={scheme === 'dark' ? colors.text : '#FFFFFF'}>
                {peso(credit)}
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
          {list.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} online={data.online} />
          ))}

          <View style={styles.inline}>
            <Text variant="caption" muted>
              A question about a bill?{' '}
            </Text>
            <Link href={{ pathname: '/messages/new', params: { topic: 'billing' } }} asChild>
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

function InvoiceCard({ invoice: inv, online }: { invoice: PortalInvoice; online: PortalOnlinePayment }) {
  const { colors } = useTheme();
  const { timeZone } = useMe();
  const status = invoiceStatus(inv);
  const title = inv.items.length === 1 ? inv.items[0]!.description : `${inv.items.length} services`;
  return (
    <Card size="lg" style={{ gap: 14, padding: 18 }}>
      <View style={[styles.between, { alignItems: 'flex-start' }]}>
        <View style={{ flex: 1 }}>
          <Text weight={700}>{title}</Text>
          <Text variant="caption" muted>
            {inv.invoiceNumber} · {formatDateShort(inv.issuedAt, timeZone)}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone === 'paid' ? 'success' : status.tone === 'due' ? 'warning' : 'neutral'} icon={status.tone === 'paid' ? Check : undefined} />
      </View>
      <View style={{ gap: 8 }}>
        {inv.items.map((l, i) => (
          <Line key={`i${i}`} label={l.quantity > 1 ? `${l.description} × ${l.quantity}` : l.description} amount={l.netAmount} />
        ))}
        {inv.discounts.map((d, i) => (
          <Line key={`d${i}`} label={d.name} amount={-d.amount} color={colors.success.fg} />
        ))}
        {inv.payers.map((p, i) => (
          <Line key={`p${i}`} label={`Coverage · ${p.name}`} amount={-p.amount} color={colors.success.fg} />
        ))}
        {inv.payments.map((p, i) => (
          <Line
            key={`y${i}`}
            label={`${p.kind === 'refund' ? 'Refunded' : 'Paid'} in ${PAYMENT_METHOD[p.method] ?? p.method}${p.receiptNumber ? ` · ${p.receiptNumber}` : ''}`}
            amount={p.kind === 'refund' ? p.amount : -p.amount}
            color={colors.textMuted}
          />
        ))}
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={styles.between}>
          <Text weight={800} style={{ fontSize: 16 }}>
            Balance
          </Text>
          <Text weight={800} style={{ fontSize: 16 }}>
            {peso(Math.max(inv.balance, 0))}
          </Text>
        </View>
      </View>
      {status.tone === 'due' ? (
        online.available ? (
          // Paying starts the provider's checkout (`POST /portal/billing/:id/online-payments`) — not built in the app yet.
          <Notice tone="info">{`${online.name} is available in MyHealth on the web. You can also pay at the clinic cashier.`}</Notice>
        ) : (
          <Text variant="caption" muted align="center">
            Pay at the clinic’s cashier.
          </Text>
        )
      ) : null}
    </Card>
  );
}

function Line({ label, amount, color }: { label: string; amount: number; color?: string }) {
  return (
    <View style={styles.between}>
      <Text variant="bodySm" color={color} style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodySm" color={color}>
        {peso(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 28, padding: 22, gap: 12 },
  owe: { fontSize: 36, lineHeight: 40, letterSpacing: -0.72 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  inline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
