import { BellRing, Smartphone, TriangleExclamationPoint } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { PortalPreference, PreferenceCategory, PreferenceChannel } from '@/data/types';
import { CATEGORY_ORDER, CATEGORY_TEXT, CHANNEL_TEXT } from '@/domain/wording';
import { nativePush } from '@/lib/native-push';
import { EXPO_GO_MESSAGE, enableMessage, enablePush, pushState, removeDevice } from '@/lib/push';
import { session } from '@/lib/session-instance';
import { Button, Card, Checkbox, ErrorState, Header, KeyValueRow, Loading, Notice, Screen, Section, Text, useTheme } from '@/ui';

const isOn = (p: PortalPreference | undefined) => (p ? (p.choice ?? p.enabled) : false);

/**
 * Notifications on this phone (`/portal/push`, Expo push — decision D6) and the same message choices as MyHealth on the web
 * (`GET|PUT /portal/communication-preferences`). A notification only says that something is waiting; never a result or a name.
 */
export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { data, error, reload, setData } = useApi(async () => {
    // A push problem (e.g. a build without an Expo project id) must not hide the message choices.
    const [prefs, push] = await Promise.all([
      api.getPreferences(),
      pushState(session, nativePush).catch(() => ({ state: { kind: 'unavailable' as const, reason: 'not_offered' as const }, devices: [] })),
    ]);
    return { prefs, push };
  });
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const prefs = data?.prefs;
  const push = data?.push.state;
  const devices = data?.push.devices ?? [];
  const thisDeviceId = push?.kind === 'on' ? push.deviceId : null;
  // Push is a channel to choose only where the clinic sends it (the web shows it the same way).
  const channels: readonly PreferenceChannel[] = push && push.kind !== 'unavailable' ? ['push', 'sms', 'email'] : ['sms', 'email'];

  const find = (channel: PreferenceChannel, category: PreferenceCategory) => prefs?.preferences.find((p) => p.channel === channel && p.category === category);

  const act = useCallback(
    async (work: () => Promise<string | null>) => {
      setBusy(true);
      setMessage(null);
      try {
        const done = await work();
        if (done) setMessage({ tone: 'success', text: done });
      } catch (e) {
        setMessage({ tone: 'danger', text: api.patientMessage(e) });
      } finally {
        setBusy(false);
        reload();
      }
    },
    [reload],
  );

  const turnOn = () =>
    act(async () => {
      const result = await enablePush(session, nativePush);
      if (!result.ok) throw new Error(enableMessage(result));
      return 'Notifications are on for this phone.';
    });

  const toggle = async (channel: PreferenceChannel, category: PreferenceCategory, optedIn: boolean) => {
    if (!data || !prefs) return;
    setMessage(null);
    setData({ ...data, prefs: { ...prefs, preferences: prefs.preferences.map((p) => (p.channel === channel && p.category === category ? { ...p, choice: optedIn } : p)) } });
    try {
      setData({ ...data, prefs: await api.updatePreferences([{ channel, category, optedIn }]) });
    } catch (e) {
      setMessage({ tone: 'danger', text: api.patientMessage(e) });
      reload();
    }
  };

  const careOff = !!prefs && channels.every((c) => !isOn(find(c, 'clinical')));

  return (
    <Screen header={<Header title="Notifications" />}>
      {/* Medicine and refill reminders (top of the design) have no API and no approved requirement. */}
      {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {message ? (
        <Notice tone={message.tone} role={message.tone === 'danger' ? 'alert' : undefined}>
          {message.text}
        </Notice>
      ) : null}
      {data && push ? (
        <>
          <Section title="On this phone">
            <Card style={{ gap: 12 }}>
              <View style={styles.phoneHead}>
                <View style={[styles.phoneIcon, { backgroundColor: push.kind === 'on' ? colors.success.bg : colors.primarySubtle }]}>
                  <BellRing size={20} color={push.kind === 'on' ? colors.success.fg : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight={700}>
                    {push.kind === 'on' ? 'Notifications are on' : push.kind === 'off' ? 'Notifications are off' : 'Notifications aren’t available'}
                  </Text>
                  <Text variant="caption" muted>
                    {push.kind === 'unavailable'
                      ? push.reason === 'expo_go'
                        ? EXPO_GO_MESSAGE
                        : push.reason === 'simulator'
                          ? 'Notifications work only on a real phone.'
                          : 'Your clinic hasn’t turned on notifications for the app yet.'
                      : push.kind === 'off' && !push.canAsk
                        ? 'They’re blocked for MyHealth in the phone’s settings. Turn them on there, then come back.'
                        : 'With them on, you get them instead of a text or email.'}
                  </Text>
                </View>
              </View>
              {push.kind === 'off' && push.canAsk ? <Button label="Turn on notifications" size="md" onPress={turnOn} loading={busy} /> : null}
              {push.kind === 'on' ? (
                <View style={styles.row}>
                  <Button
                    label="Send a test"
                    size="md"
                    variant="secondary"
                    style={{ flex: 1 }}
                    disabled={busy}
                    onPress={() =>
                      act(async () => {
                        await session.post('/portal/push/test');
                        return 'A test notification was sent. It should arrive in a moment.';
                      })
                    }
                  />
                  <Button
                    label="Turn off"
                    size="md"
                    variant="destructive"
                    style={{ flex: 1 }}
                    disabled={busy}
                    onPress={() =>
                      act(async () => {
                        await removeDevice(session, push.deviceId);
                        return 'Notifications are off for this phone.';
                      })
                    }
                  />
                </View>
              ) : null}
            </Card>
            <Text variant="caption" muted>
              A notification only tells you that something is waiting in MyHealth, such as a new result or message. It never shows a result, a name or a reason.
            </Text>
          </Section>

          {devices.length ? (
            <Section title="Your devices">
              <Card padded={false}>
                {devices.map((d, i) => (
                  <View key={d.id} style={[styles.device, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <Smartphone size={18} color={colors.textMuted} />
                    <Text variant="bodySm" weight={600} style={{ flex: 1 }}>
                      {d.label}
                      {d.id === thisDeviceId ? ' (this phone)' : ''}
                    </Text>
                    {d.id === thisDeviceId ? null : (
                      <Button
                        label="Remove"
                        variant="ghost"
                        size="md"
                        disabled={busy}
                        onPress={() =>
                          act(async () => {
                            await removeDevice(session, d.id);
                            return `${d.label} no longer gets notifications.`;
                          })
                        }
                      />
                    )}
                  </View>
                ))}
              </Card>
              <Text variant="caption" muted>
                Up to 5 devices, browsers included.
              </Text>
            </Section>
          ) : null}
        </>
      ) : null}
      {prefs ? (
        <>
          <Section title="Messages from the clinic">
            <Card padded={false} style={{ paddingVertical: 6 }}>
              <View style={styles.gridRow}>
                <Text variant="small" weight={700} muted style={styles.kind}>
                  Kind
                </Text>
                {channels.map((c) => (
                  <Text key={c} variant="small" weight={700} muted align="center" style={styles.cell}>
                    {CHANNEL_TEXT[c]}
                  </Text>
                ))}
              </View>
              {CATEGORY_ORDER.map((category) => (
                <View key={category} style={[styles.gridRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 4 }]}>
                  <View style={styles.kind}>
                    <Text variant="bodySm" weight={600}>
                      {CATEGORY_TEXT[category].title}
                    </Text>
                    <Text variant="small" muted>
                      {CATEGORY_TEXT[category].about}
                    </Text>
                  </View>
                  {channels.map((channel) => (
                    <View key={channel} style={styles.cell}>
                      <Checkbox value={isOn(find(channel, category))} onChange={(v) => toggle(channel, category, v)} label={`${CATEGORY_TEXT[category].title} by ${CHANNEL_TEXT[channel].toLowerCase()}`} />
                    </View>
                  ))}
                </View>
              ))}
            </Card>
            {careOff ? (
              <Notice tone="warning" icon={TriangleExclamationPoint}>
                With care messages off everywhere, you may not hear that a result or follow-up needs your attention.
              </Notice>
            ) : null}
            <Text variant="caption" muted>
              Texts and emails never say which test or result — only that something is waiting in MyHealth.
            </Text>
          </Section>

          <Section title="Sent to">
            <Card padded={false}>
              <KeyValueRow label="Text" value={prefs.destinations.sms ?? 'No mobile number on file'} divider={false} />
              <KeyValueRow label="Email" value={prefs.destinations.email ?? 'No email on file'} />
            </Card>
            <Text variant="caption" muted>
              To change where messages go, ask the clinic.
            </Text>
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  phoneHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  phoneIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  device: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 6, minHeight: 52 },
  gridRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 12, paddingVertical: 6 },
  kind: { flex: 1, paddingRight: 6 },
  cell: { width: 52, alignItems: 'center' },
});
