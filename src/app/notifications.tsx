import { StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { ChannelPrefs } from '@/data/types';
import { Card, Checkbox, ErrorState, Header, KeyValueRow, Loading, Screen, Section, Text, useTheme } from '@/ui';

const CHANNELS: { id: keyof ChannelPrefs; label: string; name: string }[] = [
  { id: 'push', label: 'Push', name: 'push' },
  { id: 'sms', label: 'Text', name: 'text' },
  { id: 'email', label: 'Email', name: 'email' },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { data, error, reload, setData } = useApi(api.getPreferences);

  const toggle = async (category: Parameters<typeof api.updatePreference>[0], channel: keyof ChannelPrefs, value: boolean) => {
    if (!data) return;
    // Optimistic update, then take the server's answer.
    setData({ ...data, categories: data.categories.map((c) => (c.id === category ? { ...c, channels: { ...c.channels, [channel]: value } } : c)) });
    try {
      setData(await api.updatePreference(category, channel, value));
    } catch {
      reload();
    }
  };

  return (
    <Screen header={<Header title="Notifications" />}>
      {/*
        Medicine and refill reminders (top of the design) need decision — there is no API for
        them yet. They go here once approved.
      */}
      {error && !data ? <ErrorState message={error.message} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <>
          <Section title="Messages from the clinic">
            <Card padded={false} style={{ paddingVertical: 6 }}>
              <View style={styles.gridRow}>
                <Text variant="small" weight={700} muted style={styles.kind}>
                  Kind
                </Text>
                {CHANNELS.map((c) => (
                  <Text key={c.id} variant="small" weight={700} muted align="center" style={styles.cell}>
                    {c.label}
                  </Text>
                ))}
              </View>
              {data.categories.map((k) => (
                <View key={k.id} style={[styles.gridRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 4 }]}>
                  <View style={styles.kind}>
                    <Text variant="bodySm" weight={600}>
                      {k.label}
                    </Text>
                    <Text variant="small" muted>
                      {k.hint}
                    </Text>
                  </View>
                  {CHANNELS.map((c) => (
                    <View key={c.id} style={styles.cell}>
                      <Checkbox value={k.channels[c.id]} onChange={(v) => toggle(k.id, c.id, v)} label={`${k.label} by ${c.name}`} />
                    </View>
                  ))}
                </View>
              ))}
            </Card>
            <Text variant="caption" muted>
              Texts and emails never say which test or result — only that something is waiting in MyHealth.
            </Text>
          </Section>

          <Section title="Sent to">
            <Card padded={false}>
              <KeyValueRow label="This phone" value={data.destinations.device ?? 'Not set up'} divider={false} />
              <KeyValueRow label="Text" value={data.destinations.sms} />
              <KeyValueRow label="Email" value={data.destinations.email} />
            </Card>
            {/* "Send a test notification" needs expo-notifications push registration, not in this build. */}
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gridRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 12, paddingVertical: 6 },
  kind: { flex: 1, paddingRight: 6 },
  cell: { width: 52, alignItems: 'center' },
});
