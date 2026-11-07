import { Link } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { CodeInput } from '@/components/CodeInput';
import { patientMessage } from '@/data/api';
import { useSession } from '@/lib/session-provider';
import { Button, Notice, Text, TextField, useTheme } from '@/ui';

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useSession();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: colors.primarySubtle, paddingTop: insets.top + 32 }]}>
          <BrandMark />
          <Text variant="display">Your results, visits and medicines in one place</Text>
        </View>
        <View style={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
          {state.status === 'code_required' ? <CodeStep /> : <PasswordStep notice={state.status === 'signed_out' ? state.notice : null} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordStep({ notice }: { notice: string | null }) {
  const { colors } = useTheme();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pwRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and your password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(patientMessage(e));
      setBusy(false);
    }
  };

  return (
    <>
      <Text variant="section" style={{ fontSize: 20 }} accessibilityRole="header">
        Sign in
      </Text>
      {notice && !error ? <Notice tone="info">{notice}</Notice> : null}
      {error ? (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      ) : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => pwRef.current?.focus()}
      />
      <TextField
        ref={pwRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        help="Forgot it? Reset it in MyHealth on the web."
      />
      <Button label="Sign in" onPress={submit} loading={busy} />
      {/* D5: biometric unlock is not a requirement, so there is no "Use fingerprint" button. */}
      <View style={{ flex: 1 }} />
      <View style={styles.footer}>
        <Text variant="bodySm" muted align="center">
          Got a code from the clinic?{' '}
        </Text>
        <Link href="/activate" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <Text variant="bodySm" weight={600} color={colors.link}>
              Activate your account
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

function CodeStep() {
  const { colors } = useTheme();
  const { verifyCode, cancelCode } = useSession();
  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!recovery && code.length !== 6) {
      setError('Enter all 6 digits.');
      return;
    }
    if (recovery && !code.trim()) {
      setError('Enter one of your recovery codes.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyCode(code);
    } catch (e) {
      setError(patientMessage(e));
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={cancelCode} style={styles.back} hitSlop={8}>
        <ArrowLeft size={18} color={colors.link} />
        <Text weight={600} color={colors.link}>
          Back
        </Text>
      </Pressable>
      <View style={{ gap: 6 }}>
        <Text variant="section" style={{ fontSize: 20 }} accessibilityRole="header">
          Two-step verification
        </Text>
        <Text muted>{recovery ? 'Enter one of the recovery codes you saved when you set this up. Each works once.' : 'Enter the 6-digit code from your authenticator app.'}</Text>
      </View>
      {recovery ? (
        <TextField label="Recovery code" value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} autoFocus error={error ?? undefined} />
      ) : (
        <>
          <CodeInput value={code} onChange={setCode} label="Code from your app" error={!!error} />
          {error ? (
            <Text variant="caption" weight={600} color={colors.danger.fg} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
        </>
      )}
      <Button label="Verify and continue" onPress={submit} loading={busy} />
      <Button
        label={recovery ? 'Use the code from my app' : 'Use a recovery code instead'}
        variant="ghost"
        size="md"
        onPress={() => {
          setRecovery((r) => !r);
          setCode('');
          setError(null);
        }}
      />
      {/* "Trust this phone for 30 days" is a web cookie feature — not offered in the app. */}
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36, paddingHorizontal: 24, paddingBottom: 36, gap: 20 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', minHeight: 44 },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
});
