import { MessageSquare } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SenderAvatar } from '@/components/SenderAvatar';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { formatMessageTime } from '@/lib/format';
import { useMe } from '@/lib/me';
import { Card, ChipGroup, EmptyState, ErrorState, Loading, PageTitle, Screen, Text, useTheme } from '@/ui';

type Tab = 'all' | 'unread' | 'notice';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { timeZone } = useMe();
  const now = new Date();
  const [tab, setTab] = useState<Tab>('all');
  const { data, error, reload } = useApi(api.getMessages);

  const unread = data?.filter((m) => !m.read).length ?? 0;
  const items = (data ?? []).filter((m) => tab === 'all' || (tab === 'unread' ? !m.read : m.kind === 'notice'));

  return (
    <Screen
      tabBar
      header={
        <PageTitle title="Messages">
          <ChipGroup
            accessibilityLabel="Show"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: unread ? `Unread · ${unread}` : 'Unread' },
              { value: 'notice', label: 'Clinic notices' },
            ]}
          />
        </PageTitle>
      }
      contentStyle={{ gap: 10 }}>
      {/* "New message" (compose) is in the design, but the portal API only lists and marks read (Needs API). */}
      {error && !data ? <ErrorState message={error.message} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && items.length === 0 ? <EmptyState icon={MessageSquare} title={tab === 'unread' ? 'You’re all caught up' : 'No messages yet'} /> : null}
      {items.map((m) => (
        <Card key={m.id} href={{ pathname: '/messages/[id]', params: { id: m.id } }} accessibilityLabel={`${m.read ? '' : 'Unread. '}From ${m.from}, ${m.subject}, ${formatMessageTime(m.sentAt, now, timeZone)}`} style={styles.item}>
          <SenderAvatar message={m} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={styles.top}>
              <Text variant="bodySm" weight={m.read ? 500 : 700} numberOfLines={1} style={{ flexShrink: 1 }}>
                {m.from}
              </Text>
              <Text variant="small" muted numberOfLines={1} style={{ flexShrink: 0 }}>
                {formatMessageTime(m.sentAt, now, timeZone)}
              </Text>
            </View>
            <Text weight={m.read ? 500 : 700}>{m.subject}</Text>
            <Text variant="caption" muted numberOfLines={1}>
              {m.body}
            </Text>
          </View>
          {!m.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
        </Card>
      ))}
      {data ? (
        <Text variant="caption" muted align="center" style={{ marginTop: 6 }}>
          For emergencies, call 911 or go to the nearest ER — messages are answered within 1 working day.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 999, marginTop: 6 },
});
