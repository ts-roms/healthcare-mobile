import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { SenderAvatar } from '@/components/SenderAvatar';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { formatDate, formatTime } from '@/lib/format';
import { useMe } from '@/lib/me';
import { Card, ErrorState, Header, Loading, Screen, Text } from '@/ui';

export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timeZone } = useMe();
  const { data, error, reload } = useApi(async () => {
    const all = await api.getMessages();
    const m = all.find((x) => x.id === id);
    if (!m) throw new Error('This message isn’t available.');
    return m;
  }, [id]);

  useEffect(() => {
    if (data && !data.read) api.markMessageRead(data.id);
  }, [data]);

  return (
    <Screen header={<Header title="Message" leadingLabel="Back to messages" />}>
      {error && !data ? <ErrorState message={error.message} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <Card size="lg" style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <SenderAvatar message={data} />
            <View style={{ flex: 1 }}>
              <Text weight={700}>{data.from}</Text>
              <Text variant="caption" muted>
                {formatDate(data.sentAt, timeZone)} · {formatTime(data.sentAt, timeZone)}
              </Text>
            </View>
          </View>
          <Text variant="section" accessibilityRole="header">
            {data.subject}
          </Text>
          <Text>{data.body}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
