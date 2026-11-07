import { Link } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { CodeInput } from '@/components/CodeInput';
import { ApiError } from '@/data/api';
import { DEMO_LOGIN } from '@/data/demo';
import { useSession } from '@/lib/session';
import { Button, Notice, Text, TextField, useTheme } from '@/ui';

const RESEND_SECONDS = 60;

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const session = useSession();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.card }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: colors.primarySubtle, paddingTop: insets.top + 32 }]}>
          <BrandMark />
          <View style={{ gap: 6 }}>
            <Text variant="display">Your results, visits and medicines in one place</Text>
            <Text muted>Demo Health · Main Clinic</Text>
          </View>
        </View>
        <View style={[styles.body, { paddingBottom: insets.bottom + 32 }]}>{session.status === 'mfa' ? <CodeStep /> : <PasswordStep />}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordStep() {
  const { colors } = useTheme();
  const { signIn } = useSession();
  const [identifier, setIdentifier] = useState(__DEV__ ? DEMO_LOGIN.email : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pwRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    if (!identifier.trim() || !password) {
      setError('Enter your email or mobile number and your password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(identifier, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'We couldn’t sign you in. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Text variant="section" style={{ fontSize: 20 }} accessibilityRole="header">
        Sign in
      </Text>
      {error ? (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      ) : null}
      <TextField
        label="Email or mobile number"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
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
        help={__DEV__ ? 'Demo: any password of 8 or more characters.' : undefined}
      />
      <Button label="Sign in" onPress={submit} loading={busy} />
      {/* D5: "Use fingerprint" goes here once biometric unlock is an approved requirement. */}
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
  const { verify, resend, cancelMfa, mfaDestination } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const submit = async () => {
    if (code.length !== 6) {
      setError('Enter all 6 digits.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verify(code);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'We couldn’t check that code. Try again.');
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={cancelMfa} style={styles.back} hitSlop={8}>
        <ArrowLeft size={18} color={colors.link} />
        <Text weight={600} color={colors.link}>
          Back
        </Text>
      </Pressable>
      <View style={{ gap: 6 }}>
        <Text variant="section" style={{ fontSize: 20 }} accessibilityRole="header">
          Check your phone
        </Text>
        <Text muted>We sent a 6-digit code to {mfaDestination ?? 'your phone'}. It expires in 5 minutes.</Text>
      </View>
      <CodeInput value={code} onChange={setCode} label="Verification code" error={!!error} />
      {error ? (
        <Text variant="caption" weight={600} color={colors.danger.fg} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {__DEV__ ? (
        <Text variant="caption" muted>
          Demo code: {DEMO_LOGIN.code}
        </Text>
      ) : null}
      <View style={styles.resend}>
        <Text variant="bodySm" muted>
          Didn’t get it?{' '}
        </Text>
        {seconds > 0 ? (
          <Text variant="bodySm" muted>
            Send again in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              resend();
              setSeconds(RESEND_SECONDS);
            }}>
            <Text variant="bodySm" weight={600} color={colors.link}>
              Send again
            </Text>
          </Pressable>
        )}
      </View>
      <Button label="Verify and continue" onPress={submit} loading={busy} />
      {/* "Trust this phone for 30 days" is a web cookie feature — not offered in the app. */}
    </>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 36, borderBottomRightRadius: 36, paddingHorizontal: 24, paddingBottom: 36, gap: 20 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', minHeight: 44 },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  resend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', minHeight: 24 },
});
