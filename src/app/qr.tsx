import { Link } from 'expo-router';
import { Check, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QrCodeView } from '@/components/QrCodeView';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { useMe } from '@/lib/session-provider';
import { ErrorState, Header, Loading, Text, useTheme } from '@/ui';

const LIGHT_TEXT = '#14252F';

export default function QrScreen() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { me } = useMe();
  const { data, error, reload } = useApi(api.getCheckInQr);
  // The teal page stays teal in dark mode (darker), and the code always sits on white so scanners read it.
  const bg = scheme === 'dark' ? '#17697A' : colors.primary;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Header title="My check-in QR code" leading="close" color="#FFFFFF" />
      <View style={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
        <Text color="#FFFFFF" align="center" style={{ opacity: 0.95 }}>
          Show this at reception or the kiosk to find your record and check in.
        </Text>
        <View style={styles.card}>
          {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
          {!data && !error ? <Loading /> : null}
          {data && !data.payload ? (
            <Text color={LIGHT_TEXT} align="center">
              {data.enabled ? 'The clinic hasn’t issued you a check-in code yet. Ask at the desk.' : 'Your clinic doesn’t use check-in QR codes. Give your patient number at the desk: '}
              {data.enabled ? null : <Text weight={700} color={LIGHT_TEXT}>{data.patientNumber}</Text>}
            </Text>
          ) : null}
          {data?.payload ? (
            <>
              <View accessible accessibilityRole="image" accessibilityLabel="QR code for checking in">
                {/* Drawn on the phone from the check-in key only — never the activation link. */}
                <QrCodeView value={data.payload} />
              </View>
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text weight={800} color={LIGHT_TEXT} style={{ fontSize: 18, lineHeight: 24 }}>
                  {me?.patient.displayName}
                </Text>
                <Text variant="bodySm" color="#4A5C66">
                  {data.patientNumber} · {me?.organization.name}
                </Text>
              </View>
              <View style={styles.status}>
                <Check size={14} color="#1E6B3A" strokeWidth={2.6} />
                <Text variant="caption" weight={600} color="#1E6B3A">
                  Active
                </Text>
              </View>
            </>
          ) : null}
        </View>
        <View style={styles.privacy}>
          <ShieldCheck size={18} color="#FFFFFF" style={{ marginTop: 2 }} />
          <Text variant="bodySm" color="#FFFFFF" style={{ flex: 1 }}>
            The code holds only a key — no name, birthday or health details. On its own it opens nothing.
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.inline}>
          <Text variant="bodySm" color="#FFFFFF" style={{ opacity: 0.95 }}>
            Lost your clinic card?{' '}
          </Text>
          <Link href={{ pathname: '/messages/new', params: { topic: 'other', subject: 'Replace my clinic card' } }} asChild>
            <Pressable accessibilityRole="link" hitSlop={8}>
              <Text variant="bodySm" weight={700} color="#FFFFFF" style={{ textDecorationLine: 'underline' }}>
                Ask the clinic to replace it
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 12, alignItems: 'center', gap: 22 },
  card: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, alignItems: 'center', gap: 16 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DDF3E4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  privacy: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14 },
  inline: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
});
