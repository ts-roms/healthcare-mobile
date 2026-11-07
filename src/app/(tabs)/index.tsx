import { Link, router, type Href } from 'expo-router';
import { Bell, CalendarPlus, FlaskConical, MessageSquare, Pill, ReceiptText, Video, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { NextVisitCard } from '@/components/NextVisitCard';
import { ResultCompactCard, ResultHeroCard } from '@/components/ResultCards';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { formatLongToday, formatTime, greeting, isSameClinicDay } from '@/lib/format';
import { useMe } from '@/lib/me';
import { Avatar, Badge, Card, IconButton, ListRow, Loading, PageTitle, Screen, Section, Text, useTheme } from '@/ui';

export default function HomeScreen() {
  const { colors, scheme } = useTheme();
  const { me, timeZone } = useMe();
  const now = new Date();

  const { data } = useApi(async () => {
    const [appointments, results, prescriptions, teleconsults, unread] = await Promise.all([api.getAppointments(), api.getResults(), api.getPrescriptions(), api.getTeleconsults(), api.getUnreadCount()]);
    return { appointments, results, prescriptions, teleconsults, unread };
  });

  const nextVisit = data?.appointments.find((a) => a.status === 'booked' && new Date(a.startsAt) > now);
  const consultToday = data?.teleconsults.find((t) => isSameClinicDay(t.startsAt, now, timeZone));
  const newResults = data?.results.filter((r) => r.isNew) ?? [];
  const activeRx = data?.prescriptions.filter((p) => p.status === 'active') ?? [];

  const header = (
    <PageTitle
      eyebrow={formatLongToday(now, timeZone)}
      title={me ? `${greeting(now, timeZone)}, ${me.patient.firstName}` : greeting(now, timeZone)}
      right={
        <>
          <IconButton icon={Bell} label={data?.unread ? `Messages, ${data.unread} new` : 'Messages'} badge={!!data?.unread} onPress={() => router.navigate('/messages')} />
          <Link href="/profile" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Profile" hitSlop={4}>
              <Avatar initials={me?.patient.initials ?? ''} bg={scheme === 'dark' ? colors.primarySubtle : colors.primaryDeep} fg={scheme === 'dark' ? colors.primaryDeep : '#FFFFFF'} />
            </Pressable>
          </Link>
        </>
      }
    />
  );

  return (
    <Screen header={header} tabBar contentStyle={{ paddingTop: 8 }}>
      {!data ? (
        <Loading />
      ) : (
        <>
          {consultToday ? (
            <Pressable accessibilityRole="link" onPress={() => router.push('/consult')} style={({ pressed }) => [styles.banner, { backgroundColor: colors.primarySubtle, opacity: pressed ? 0.85 : 1 }]}>
                <View style={[styles.bannerIcon, { backgroundColor: colors.primary }]}>
                  <Video size={22} color={colors.onPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight={700}>Online consultation today · {formatTime(consultToday.startsAt, timeZone)}</Text>
                  <Text variant="caption" muted>
                    {consultToday.doctorName}
                    {consultToday.questionsPending ? ` · answer ${consultToday.questionsPending} questions first` : ''}
                  </Text>
                </View>
                <Text variant="caption" weight={700} color={colors.link}>
                  Start
                </Text>
            </Pressable>
          ) : null}

          {nextVisit ? <NextVisitCard appointment={nextVisit} timeZone={timeZone} now={now} /> : null}

          <View style={styles.quick} accessibilityLabel="Quick actions">
            <QuickAction href="/book" icon={CalendarPlus} label="Book a visit" tint="teal" />
            <QuickAction href="/results" icon={FlaskConical} label="Results" tint="amber" count={newResults.length} />
            <QuickAction href="/bills" icon={ReceiptText} label="Bills" tint="blue" />
            <QuickAction href="/messages" icon={MessageSquare} label="Ask the clinic" tint="violet" />
          </View>

          {newResults.length ? (
            <Section
              title="New results"
              titleAccessory={<Badge label={`${newResults.length} new`} tone="danger" />}
              right={
                <Link href="/results" asChild>
                  <Pressable accessibilityRole="link" hitSlop={10}>
                    <Text variant="bodySm" weight={600} color={colors.link}>
                      See all
                    </Text>
                  </Pressable>
                </Link>
              }>
              <ResultHeroCard result={newResults[0]} timeZone={timeZone} />
              {newResults.slice(1).map((r) => (
                <ResultCompactCard key={r.id} result={r} timeZone={timeZone} />
              ))}
              <View style={styles.inline}>
                <Text variant="bodySm" muted>
                  Your doctor will go over these at your next visit. Questions now?{' '}
                </Text>
                <Link href="/messages" asChild>
                  <Pressable accessibilityRole="link" hitSlop={8}>
                    <Text variant="bodySm" weight={600} color={colors.link}>
                      Message the clinic
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </Section>
          ) : null}

          <Section title="My records">
            <Card padded={false}>
              <ListRow divider={false} icon={Pill} title="Prescriptions" subtitle={activeRx.length ? `${activeRx.map((p) => p.drug).join(', ')} · active` : 'No active prescriptions'} href="/medicines" />
              <ListRow icon={FlaskConical} title="Results history" subtitle={`${data.results.length} results released`} href="/results" />
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}

type Tint = 'teal' | 'amber' | 'blue' | 'violet';

function QuickAction({ href, icon: Icon, label, tint, count }: { href: Href; icon: LucideIcon; label: string; tint: Tint; count?: number }) {
  const { colors, scheme } = useTheme();
  const t = colors.quickTints[tint];
  return (
      <Pressable accessibilityRole="link" accessibilityLabel={count ? `${label}, ${count} new` : label} onPress={() => router.push(href)} style={({ pressed }) => [styles.qa, pressed && { opacity: 0.8 }]}>
        <View style={[styles.qaIcon, { backgroundColor: t.bg }, scheme === 'dark' && { borderWidth: 1, borderColor: colors.cardBorder }]}>
          <Icon size={24} color={t.fg} />
          {count ? (
            <View style={[styles.qaCount, { backgroundColor: colors.dangerDot }]}>
              <Text weight={700} color={scheme === 'dark' ? colors.background : '#FFFFFF'} style={{ fontSize: 11, lineHeight: 14 }}>
                {count}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="small" weight={600} align="center">
          {label}
        </Text>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14 },
  bannerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quick: { flexDirection: 'row', gap: 10 },
  qa: { flex: 1, alignItems: 'center', gap: 8 },
  qaIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  qaCount: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  inline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});
