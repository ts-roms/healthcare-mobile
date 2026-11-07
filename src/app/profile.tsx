import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ChevronRight, QrCode } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { money } from '@/lib/format';
import { useMe } from '@/lib/me';
import { useSession } from '@/lib/session';
import { Avatar, Badge, Button, Card, Header, KeyValueRow, ListRow, Loading, Screen, Section, SegmentedControl, Text, useTheme, type ThemeOverride } from '@/ui';

export default function ProfileScreen() {
  const { colors, scheme, shadow, override, setOverride } = useTheme();
  const { me } = useMe();
  const { signOut } = useSession();
  const billing = useApi(api.getBilling);

  const due = billing.data?.invoices.filter((i) => i.status === 'due') ?? [];
  const billsSubtitle = billing.data ? (due.length ? `${due.length} bill${due.length > 1 ? 's' : ''} to pay · ${money(billing.data.balance)}` : 'Nothing to pay') : ' ';

  return (
    <Screen header={<Header title="Profile" leadingLabel="Back to home" />}>
      {!me ? (
        <Loading />
      ) : (
        <>
          <Card size="lg" style={{ gap: 14 }}>
            <View style={styles.who}>
              <Avatar initials={me.patient.initials} size={60} bg={scheme === 'dark' ? colors.primarySubtle : colors.primaryDeep} fg={scheme === 'dark' ? colors.primaryDeep : '#FFFFFF'} />
              <View style={{ flex: 1 }}>
                <Text weight={800} style={{ fontSize: 19, lineHeight: 24 }}>
                  {me.patient.fullName}
                </Text>
                <Text variant="caption" muted>
                  Patient no. {me.patient.number} · {me.clinic.organization}
                </Text>
              </View>
            </View>
            <View style={{ marginHorizontal: -16 }}>
              <KeyValueRow label="Mobile" value={me.contact.mobileMasked} divider={false} />
              <KeyValueRow label="Email" divider={false}>
                <View style={styles.email}>
                  <Text variant="bodySm" weight={600}>
                    {me.contact.emailMasked}
                  </Text>
                  {!me.contact.emailVerified ? <Badge label="Not verified" tone="warning" size="sm" /> : null}
                </View>
              </KeyValueRow>
            </View>
            {/* "Edit contact details" — the portal edits contacts on the web; no mobile endpoint listed (Needs API). */}
          </Card>

            <Pressable accessibilityRole="link" accessibilityLabel="My check-in QR code. Show it at the desk or kiosk" onPress={() => router.push('/qr')} style={({ pressed }) => [styles.qr, { backgroundColor: colors.primary, boxShadow: shadow.primary, opacity: pressed ? 0.9 : 1 }]}>
              <View style={[styles.qrIcon, { backgroundColor: colors.onPrimary }]}>
                <QrCode size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight={700} color={colors.onPrimary}>
                  My check-in QR code
                </Text>
                <Text variant="caption" color={colors.onPrimary} style={{ opacity: 0.9 }}>
                  Show it at the desk or kiosk
                </Text>
              </View>
              <ChevronRight size={20} color={colors.onPrimary} />
            </Pressable>

          <Section title="Account" eyebrow>
            <Card padded={false}>
              <ListRow divider={false} title="Bills and payments" subtitle={billsSubtitle} href="/bills" />
              <ListRow title="Notifications" subtitle="Push, text and email" href="/notifications" />
              <ListRow title="Security" subtitle={`Two-step verification ${me.security.mfaEnabled ? 'on' : 'off'}${me.security.passkeys ? ` · ${me.security.passkeys} passkey${me.security.passkeys > 1 ? 's' : ''}` : ''}`} trailing={<Badge label={me.security.mfaEnabled ? 'On' : 'Off'} tone={me.security.mfaEnabled ? 'success' : 'warning'} size="sm" />} />
              {/* People I care for (/people) and Privacy and consents are not in this build yet. */}
            </Card>
          </Section>

          <Section title="Appearance" eyebrow>
            <SegmentedControl<ThemeOverride>
              accessibilityLabel="Theme"
              value={override}
              onChange={setOverride}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </Section>

          <View style={{ gap: 8 }}>
            <Button label="Sign out" variant="destructive" size="md" onPress={signOut} style={{ minHeight: 48 }} />
            <Text variant="small" muted align="center" style={{ marginTop: 4 }}>
              MyHealth {Constants.expoConfig?.version ?? ''}
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  email: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 1 },
  qr: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 16 },
  qrIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
