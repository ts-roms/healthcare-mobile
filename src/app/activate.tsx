import { router } from 'expo-router';
import { Check, QrCode } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { activate, ApiError, readActivationCard } from '@/data/api';
import { useSession } from '@/lib/session';
import { Button, Header, Notice, Text, TextField, useTheme } from '@/ui';

type Card = { patientNumber: string; firstName: string; clinic: string } | null;

export default function ActivateScreen() {
  const [step, setStep] = useState<'scan' | 'form'>('scan');
  const [card, setCard] = useState<Card>(null);

  if (step === 'scan') {
    return (
      <ScanStep
        onRead={(c) => {
          setCard(c);
          setStep('form');
        }}
        onManual={() => {
          setCard(null);
          setStep('form');
        }}
      />
    );
  }
  return <FormStep card={card} onBack={() => setStep('scan')} />;
}

function ScanStep({ onRead, onManual }: { onRead: (c: NonNullable<Card>) => void; onManual: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const s = colors.scanner;
  const corner = { position: 'absolute' as const, width: 56, height: 56, borderColor: s.accent };

  return (
    <View style={{ flex: 1, backgroundColor: s.bg }}>
      <Header title="Scan your clinic card" leading="close" color="#FFFFFF" onLeading={() => router.back()} />
      <View style={styles.scanBody}>
        {/*
          The real app scans with expo-camera here. This project doesn't include it yet
          (adding a camera permission needs decision D9), so the viewfinder is shown without a feed.
        */}
        <View style={[styles.frame, { backgroundColor: s.frame }]} accessible accessibilityLabel="Camera viewfinder">
          <View style={[corner, { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 28 }]} />
          <View style={[corner, { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 28 }]} />
          <View style={[corner, { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 28 }]} />
          <View style={[corner, { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 28 }]} />
          <View style={styles.qrTile}>
            <QrCode size={64} color="#14252F" strokeWidth={1.6} />
          </View>
          <View style={[styles.scanLine, { backgroundColor: s.accent }]} />
        </View>
        <View style={{ gap: 6, alignItems: 'center' }}>
          <Text variant="section" color="#FFFFFF" align="center">
            Point the camera at the QR code
          </Text>
          <Text variant="bodySm" color={s.muted} align="center">
            It’s on the card or letter the clinic gave you.
          </Text>
        </View>
        {__DEV__ ? <Button label="Simulate a scan" size="md" colors={{ bg: s.accent, fg: s.bg }} onPress={() => readActivationCard().then(onRead)} /> : null}
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 24, alignItems: 'center' }}>
        <Pressable accessibilityRole="button" onPress={onManual} hitSlop={10} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="bodySm" weight={600} color="#FFFFFF" style={{ textDecorationLine: 'underline' }}>
            No card? Enter your patient number instead
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FormStep({ card, onBack }: { card: Card; onBack: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { activated } = useSession();
  const [patientNumber, setPatientNumber] = useState(card?.patientNumber ?? '');
  const [firstName, setFirstName] = useState(card?.firstName ?? '');
  const [birthDate, setBirthDate] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await activate({ patientNumber, firstName, birthDate, code, password });
      activated();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'We couldn’t activate your account. Try again.');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Activate MyHealth" leadingLabel={card ? 'Scan again' : 'Back'} onLeading={onBack} />
      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        {card ? (
          <Notice tone="success" icon={Check}>
            {`Card read — ${card.clinic}`}
          </Notice>
        ) : null}
        {error ? (
          <Notice tone="danger" role="alert">
            {error}
          </Notice>
        ) : null}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <TextField label="Patient number" value={patientNumber} onChangeText={setPatientNumber} readOnly={!!card} autoCapitalize="characters" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="First name" value={firstName} onChangeText={setFirstName} readOnly={!!card} autoComplete="given-name" />
          </View>
        </View>
        <TextField label="Date of birth" value={birthDate} onChangeText={setBirthDate} placeholder="MM / DD / YYYY" keyboardType="numbers-and-punctuation" autoComplete="birthdate-full" />
        <TextField label="Activation code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} placeholder="6 digits from the clinic" keyboardType="number-pad" help="Sent by text or email when the clinic invited you." />
        <TextField label="Create a password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 10 characters" autoComplete="new-password" textContentType="newPassword" />
        <Button label="Activate my account" onPress={submit} loading={busy} />
        <Text variant="caption" muted align="center">
          The card alone can’t open your record — we still check your birth date and code.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scanBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26, paddingHorizontal: 24 },
  frame: { width: 260, height: 260, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  qrTile: { position: 'absolute', top: 70, left: 70, right: 70, bottom: 70, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  scanLine: { position: 'absolute', left: 24, right: 24, top: 128, height: 3, borderRadius: 999 },
  form: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
  twoCol: { flexDirection: 'row', gap: 12 },
});
