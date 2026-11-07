import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { useLiveMessages } from '@/data/useLiveMessages';
import { BODY_MAX, NOT_FOR_EMERGENCIES, TOPICS } from '@/domain/wording';
import { formatDate, formatTime } from '@/lib/format';
import { useMe } from '@/lib/session-provider';
import { BottomActionBar, Button, ErrorState, Header, Loading, Notice, Screen, Text, TextField, useTheme } from '@/ui';

/** One conversation with the clinic and a reply box (`GET /portal/message-threads/:id`, `POST …/messages`). */
export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { me, timeZone } = useMe();
  const org = me?.organization.name ?? 'The clinic';
  const { data, error, reload, refresh, setData } = useApi(() => api.getThread(id), [id]);
  // The clinic's replies appear while the conversation is open; a reply being typed is kept.
  useLiveMessages(refresh);
  const [reply, setReply] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    setSendError(null);
    try {
      setData(await api.replyToThread(id, reply.trim()));
      setReply('');
    } catch (e) {
      setSendError(api.patientMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const open = data?.status === 'open';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        header={<Header title={data?.subject ?? 'Conversation'} subtitle={data ? TOPICS.find((t) => t.value === data.topic)?.label : undefined} leadingLabel="Back to messages" />}
        footer={
          data && open ? (
            <BottomActionBar>
              {sendError ? (
                <Text variant="caption" weight={600} color={colors.danger.fg} accessibilityLiveRegion="polite">
                  {sendError}
                </Text>
              ) : null}
              <TextField label="Reply" value={reply} onChangeText={setReply} multiline maxLength={BODY_MAX} />
              <Button label="Send" icon={Send} size="md" onPress={send} loading={busy} disabled={!reply.trim()} />
            </BottomActionBar>
          ) : null
        }
        contentStyle={{ gap: 12 }}>
        {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
        {!data && !error ? <Loading /> : null}
        {data ? (
          <>
            {data.messages.map((m) => {
              const mine = m.sender === 'patient';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    mine
                      ? { alignSelf: 'flex-end', backgroundColor: colors.primarySubtle, borderBottomRightRadius: 4 }
                      : { alignSelf: 'flex-start', backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderBottomLeftRadius: 4 },
                  ]}>
                  <Text>{m.body}</Text>
                  <Text variant="small" muted style={{ marginTop: 4 }}>
                    {mine ? (m.viaGuardian ? 'Your guardian' : 'You') : (m.senderName ?? org)} · {formatDate(m.createdAt, timeZone)}, {formatTime(m.createdAt, timeZone)}
                  </Text>
                </View>
              );
            })}
            {!open ? <Notice tone="info">The clinic closed this conversation. Start a new message if you have another question.</Notice> : null}
            <Text variant="caption" muted>
              {NOT_FOR_EMERGENCIES}
            </Text>
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '85%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
});
