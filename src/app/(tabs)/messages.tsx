import { router } from 'expo-router';
import { MessageSquare, PenLine } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initialsOf, SenderAvatar, type SenderKind } from '@/components/SenderAvatar';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { useLiveMessages } from '@/data/useLiveMessages';
import { messageSource } from '@/domain/wording';
import { formatMessageTime } from '@/lib/format';
import { useMe } from '@/lib/session-provider';
import { Card, ChipGroup, EmptyState, ErrorState, Loading, PageTitle, Screen, TAB_BAR_SPACE, Text, useTheme } from '@/ui';

type Tab = 'all' | 'unread' | 'notice';

type Item = {
  key: string;
  kind: 'notice' | 'thread';
  href: { pathname: '/messages/[id]' | '/messages/thread/[id]'; params: { id: string } };
  from: string;
  avatar: { kind: SenderKind; initials: string };
  subject: string;
  preview: string;
  at: string;
  unread: boolean;
};

/** Conversations with the clinic (`/portal/message-threads`) and the clinic's notices (`/portal/messages`), newest first. */
export default function MessagesScreen() {
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { me, timeZone } = useMe();
  const now = new Date();
  const [tab, setTab] = useState<Tab>('all');
  const { data, error, reload, refresh } = useApi(async () => {
    const [notices, threads] = await Promise.all([api.getMessages(), api.getThreads()]);
    return { notices, threads };
  });
  useLiveMessages(refresh);

  const org = me?.organization.name ?? 'Your clinic';
  const all: Item[] = data
    ? [
        ...data.threads.map<Item>((t) => ({
          key: `t${t.id}`,
          kind: 'thread',
          href: { pathname: '/messages/thread/[id]', params: { id: t.id } },
          from: t.lastMessageFrom === 'staff' ? org : 'You',
          avatar: { kind: 'conversation', initials: initialsOf(org) },
          subject: t.subject,
          preview: `${t.messageCount} message${t.messageCount === 1 ? '' : 's'}${t.status === 'closed' ? ' · closed' : ''}`,
          at: t.lastMessageAt,
          unread: t.unread,
        })),
        ...data.notices.map<Item>((n) => {
          const source = messageSource(n);
          return {
            key: `n${n.id}`,
            kind: 'notice',
            href: { pathname: '/messages/[id]', params: { id: n.id } },
            from: `${org} · ${source}`,
            avatar: { kind: source === 'Visits' ? 'visits' : 'clinic', initials: initialsOf(org) },
            subject: n.subject ?? source,
            preview: n.text,
            at: n.createdAt,
            unread: !n.readAt,
          };
        }),
      ].sort((a, b) => b.at.localeCompare(a.at))
    : [];
  const unread = all.filter((m) => m.unread).length;
  const items = all.filter((m) => tab === 'all' || (tab === 'unread' ? m.unread : m.kind === 'notice'));

  const fab = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New message"
      onPress={() => router.push('/messages/new')}
      style={({ pressed }) => [styles.fab, { bottom: TAB_BAR_SPACE + insets.bottom - 8, backgroundColor: colors.primary, boxShadow: shadow.primary, opacity: pressed ? 0.9 : 1 }]}>
      <PenLine size={20} color={colors.onPrimary} />
      <Text weight={700} color={colors.onPrimary}>
        New message
      </Text>
    </Pressable>
  );

  return (
    <Screen
      tabBar
      overlay={fab}
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
      contentStyle={{ gap: 10, paddingBottom: TAB_BAR_SPACE + insets.bottom + 72 }}>
      {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && items.length === 0 ? <EmptyState icon={MessageSquare} title={tab === 'unread' ? 'You’re all caught up' : 'No messages yet'} body={tab === 'all' ? 'Questions for the clinic? Start a new message.' : undefined} /> : null}
      {items.map((m) => (
        <Card key={m.key} href={m.href} accessibilityLabel={`${m.unread ? 'Unread. ' : ''}From ${m.from}, ${m.subject}, ${formatMessageTime(m.at, now, timeZone)}`} style={styles.item}>
          <SenderAvatar kind={m.avatar.kind} initials={m.avatar.initials} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={styles.top}>
              <Text variant="bodySm" weight={m.unread ? 700 : 500} numberOfLines={1} style={{ flexShrink: 1 }}>
                {m.from}
              </Text>
              <Text variant="small" muted numberOfLines={1} style={{ flexShrink: 0 }}>
                {formatMessageTime(m.at, now, timeZone)}
              </Text>
            </View>
            <Text weight={m.unread ? 700 : 500}>{m.subject}</Text>
            <Text variant="caption" muted numberOfLines={1}>
              {m.preview}
            </Text>
          </View>
          {m.unread ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
        </Card>
      ))}
      {data ? (
        <Text variant="caption" muted align="center" style={{ marginTop: 6 }}>
          MyHealth is not for emergencies: call 911 or go to the nearest emergency room. Messages are read during clinic hours.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 999, marginTop: 6 },
  fab: { position: 'absolute', right: 20, height: 56, paddingHorizontal: 20, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
