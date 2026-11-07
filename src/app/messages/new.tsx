import { router, useLocalSearchParams } from 'expo-router';
import { Send, TriangleExclamationPoint } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import type { MessageTopic } from '@/data/types';
import { BODY_MAX, NOT_FOR_EMERGENCIES, SUBJECT_MAX, TOPICS } from '@/domain/wording';
import { BottomActionBar, Button, Chip, Header, Notice, Screen, Section, TextField } from '@/ui';

/** Start a conversation with the clinic (`POST /portal/message-threads`). Text only in the app (no attachments). */
export default function NewMessageScreen() {
  const params = useLocalSearchParams<{ topic?: string; subject?: string; body?: string }>();
  const [topic, setTopic] = useState<MessageTopic>(TOPICS.some((t) => t.value === params.topic) ? (params.topic as MessageTopic) : 'general');
  const [subject, setSubject] = useState(params.subject ?? '');
  // Pre-filled by "Ask for a refill" (what is asked and for which medicine); the patient can edit it.
  const [body, setBody] = useState(params.body ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!subject.trim()) return setError('Give the message a subject.');
    if (!body.trim()) return setError('Write a message.');
    setBusy(true);
    setError(null);
    try {
      const thread = await api.startThread({ topic, subject: subject.trim(), body: body.trim() });
      router.replace({ pathname: '/messages/thread/[id]', params: { id: thread.id } });
    } catch (e) {
      setError(api.patientMessage(e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        header={<Header title="New message" leading="close" />}
        footer={
          <BottomActionBar>
            <Button label="Send message" icon={Send} onPress={send} loading={busy} />
          </BottomActionBar>
        }>
        <Notice tone="warning" icon={TriangleExclamationPoint}>
          {NOT_FOR_EMERGENCIES}
        </Notice>
        {error ? (
          <Notice tone="danger" role="alert">
            {error}
          </Notice>
        ) : null}
        <Section title="What is it about?" eyebrow>
          <View style={styles.topics}>
            {TOPICS.map((t) => (
              <Chip key={t.value} label={t.label} selected={t.value === topic} onPress={() => setTopic(t.value)} />
            ))}
          </View>
        </Section>
        <TextField label="Subject" value={subject} onChangeText={setSubject} maxLength={SUBJECT_MAX} />
        <TextField label="Message" value={body} onChangeText={setBody} multiline maxLength={BODY_MAX} help={`${body.length} / ${BODY_MAX}`} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
