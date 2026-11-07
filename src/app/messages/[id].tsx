import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { initialsOf, SenderAvatar } from '@/components/SenderAvatar';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { messageAction, messageSource } from '@/domain/wording';
import { formatDate, formatTime } from '@/lib/format';
import { useMe } from '@/lib/session-provider';
import { Button, Card, ErrorState, Header, Loading, Screen, Text } from '@/ui';

/** A clinic notice (read-only; questions go through a new message). Opening it marks it read. */
export default function NoticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me, timeZone } = useMe();
  const org = me?.organization.name ?? 'Your clinic';
  const { data, error, reload } = useApi(async () => {
    const m = (await api.getMessages()).find((x) => x.id === id);
    if (!m) throw new Error('This message isn’t available.');
    return m;
  }, [id]);

  useEffect(() => {
    if (data && !data.readAt) api.markMessageRead(data.id).catch(() => undefined);
  }, [data]);

  const action = data ? messageAction(data) : null;

  return (
    <Screen header={<Header title="Message" leadingLabel="Back to messages" />}>
      {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <Card size="lg" style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <SenderAvatar kind="clinic" initials={initialsOf(org)} />
            <View style={{ flex: 1 }}>
              <Text weight={700}>
                {org} · {messageSource(data)}
              </Text>
              <Text variant="caption" muted>
                {formatDate(data.createdAt, timeZone)} · {formatTime(data.createdAt, timeZone)}
              </Text>
            </View>
          </View>
          {data.subject ? (
            <Text variant="section" accessibilityRole="header">
              {data.subject}
            </Text>
          ) : null}
          <Text>{data.text}</Text>
          {action ? <Button label={action.label} variant="secondary" size="md" onPress={() => router.navigate(action.href)} /> : null}
        </Card>
      ) : null}
    </Screen>
  );
}
