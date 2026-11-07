import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, TriangleExclamationPoint, Video } from 'lucide-react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { PORTAL_BASE_URL } from '@/lib/config';
import { formatDate, formatTime } from '@/lib/format';
import { Button, Card, EmptyState, ErrorState, Header, Loading, Notice, Screen, Text } from '@/ui';

/**
 * Online consultation. Decision D8: not in the app — the patient is handed to MyHealth in the browser
 * (`/consultations/[appointmentId]`: questions, waiting room, video). The red-flag warning stays here too.
 */
export default function ConsultScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, error, reload } = useApi(api.getTeleconsults);
  const consult = data?.find((t) => t.appointmentId === id) ?? data?.find((t) => t.status !== 'ended');

  return (
    <Screen header={<Header title="Online consultation" leadingLabel="Back" />}>
      <Notice tone="danger" icon={TriangleExclamationPoint} title="Chest pain, trouble breathing, sudden weakness or fainting?">
        This may be an emergency: call 911 or go to the nearest emergency room. Don’t wait for an online consultation.
      </Notice>
      {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && !consult ? <EmptyState icon={Video} title="No online consultation booked" action={{ label: 'Book one', onPress: () => router.push('/book') }} /> : null}
      {consult ? (
        <Card size="lg" style={{ gap: 12 }}>
          <Text variant="cardTitle">
            {consult.visitType} with {consult.practitionerName}
          </Text>
          <Text muted>
            {formatDate(consult.startsAt, consult.timeZone)} · {formatTime(consult.startsAt, consult.timeZone)}
          </Text>
          <Text variant="bodySm">
            {consult.questionnaireSubmitted
              ? `Your answers are in. The waiting room opens at ${formatTime(consult.waitingRoomOpensAt, consult.timeZone)}.`
              : 'Before the call, answer a few questions for your doctor.'}
          </Text>
          {PORTAL_BASE_URL ? (
            <Button
              label="Continue in MyHealth on the web"
              icon={ExternalLink}
              onPress={() => WebBrowser.openBrowserAsync(`${PORTAL_BASE_URL}/consultations/${consult.appointmentId}`)}
            />
          ) : (
            <Text variant="caption" muted>
              Open MyHealth on the web to answer the questions and join the call.
            </Text>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
