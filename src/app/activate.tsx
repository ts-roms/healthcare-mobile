import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { patientMessage } from '@/data/api';
import { isoBirthDate } from '@/lib/format';
import { useSession } from '@/lib/session-provider';
import { Button, Header, Notice, Text, TextField, useTheme } from '@/ui';

const MIN_PASSWORD = 12;

/**
 * First sign-in with the clinic's one-time code (`POST /portal/auth/activate`). Scanning the clinic card
 * (`POST /portal/auth/activation-card`, expo-camera) is the design's first step, but decision D9 allows no camera
 * yet, so the patient types the details from the card or letter.
 */
export default function ActivateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { activate } = useSession();
  const [patientNumber, setPatientNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const iso = isoBirthDate(birthDate);
    if (!patientNumber.trim() || !code.trim() || !email.trim()) return setError('Fill in every field.');
    if (!iso) return setError('Enter your date of birth as MM / DD / YYYY.');
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
    setBusy(true);
    setError(null);
    try {
      await activate({ patientNumber: patientNumber.trim(), birthDate: iso, activationCode: code.trim(), email: email.trim(), password });
    } catch (e) {
      setError(patientMessage(e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Activate MyHealth" leading="close" onLeading={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))} />
      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Text muted>Use the patient number and the one-time code the clinic gave you.</Text>
        {error ? (
          <Notice tone="danger" role="alert">
            {error}
          </Notice>
        ) : null}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <TextField label="Patient number" value={patientNumber} onChangeText={setPatientNumber} autoCapitalize="characters" autoCorrect={false} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Date of birth" value={birthDate} onChangeText={setBirthDate} placeholder="MM / DD / YYYY" keyboardType="numbers-and-punctuation" autoComplete="birthdate-full" />
          </View>
        </View>
        <TextField label="Activation code" value={code} onChangeText={setCode} placeholder="XXXXX-XXXXX" autoCapitalize="characters" autoCorrect={false} help="From the clinic. It works once and expires after 72 hours." />
        <TextField label="Your email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" help="You will sign in with it." />
        <TextField label="Create a password" value={password} onChangeText={setPassword} secureTextEntry placeholder={`At least ${MIN_PASSWORD} characters`} autoComplete="new-password" textContentType="newPassword" />
        <Button label="Activate my account" onPress={submit} loading={busy} />
        <Text variant="caption" muted align="center">
          The card alone can’t open your record — we still check your birth date and code.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
  twoCol: { flexDirection: 'row', gap: 12 },
});
