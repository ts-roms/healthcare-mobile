import { router } from 'expo-router';
import { TriangleExclamationPoint, Video } from 'lucide-react-native';

import { EmptyState, Header, Notice, Screen } from '@/ui';

/**
 * Online consultation (design screens 13–14) is on hold for decision D8: run telemedicine
 * inside the app, or hand off to MyHealth in the browser. Nothing here starts a call.
 *
 * Whatever D8 decides, the red-flag check must keep blocking the waiting room with:
 * "Call 911 or go to the nearest emergency room".
 */
export default function ConsultScreen() {
  return (
    <Screen header={<Header title="Online consultation" leadingLabel="Back to home" />}>
      <Notice tone="danger" icon={TriangleExclamationPoint} title="Chest pain, trouble breathing, sudden weakness or fainting?">
        Call 911 or go to the nearest emergency room. Don’t wait for an online consultation.
      </Notice>
      <EmptyState icon={Video} title="Online consultations aren’t in the app yet" body="Your clinic will tell you how to join. For questions before your consultation, message the clinic." action={{ label: 'Message the clinic', onPress: () => router.navigate('/messages') }} />
    </Screen>
  );
}
