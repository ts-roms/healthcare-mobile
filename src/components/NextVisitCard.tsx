import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { Appointment } from '@/data/types';
import { formatTime, partsInZone, relativeDays } from '@/lib/format';
import { Button, Text, useTheme } from '@/ui';

type Props = { appointment: Appointment; timeZone: string; now: Date; action?: { label: string; onPress: () => void } };

/** Teal hero card for the next booked visit (bordered card in dark mode). */
export function NextVisitCard({ appointment: a, timeZone, now, action }: Props) {
  const { colors, shadow } = useTheme();
  const h = colors.hero;
  const p = partsInZone(a.startsAt, timeZone);
  const when = relativeDays(a.startsAt, now, timeZone);

  return (
    <View
      accessibilityLabel={`Your next visit, ${when}: ${a.service} with ${a.doctorName}, ${p.weekday} ${p.day} ${p.month} at ${formatTime(a.startsAt, timeZone)}, ${a.location}`}
      style={[styles.card, { backgroundColor: h.bg, borderColor: h.border, borderWidth: h.border === 'transparent' ? 0 : 1, boxShadow: shadow.hero }]}>
      {h.border === 'transparent' ? (
        <>
          <View pointerEvents="none" style={styles.ring} />
          <View pointerEvents="none" style={styles.blob} />
        </>
      ) : null}
      <View style={styles.top}>
        <Text variant="caption" weight={600} color={h.fgMuted}>
          Your next visit · {when}
        </Text>
        <View style={[styles.pill, { backgroundColor: h.pillBg }]}>
          <Text variant="small" weight={700} color={h.pillFg}>
            Booked
          </Text>
        </View>
      </View>
      <View style={styles.main}>
        <View style={[styles.date, { backgroundColor: h.dateBg }]}>
          <Text weight={700} color={h.dateFg} style={styles.dateSmall}>
            {p.monthShort.toUpperCase()}
          </Text>
          <Text weight={800} color={h.dateFg} style={styles.dateNum}>
            {p.day}
          </Text>
          <Text weight={600} color={h.dateFg} style={styles.dateSmall}>
            {p.weekdayShort}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight={700} color={h.fg} style={{ fontSize: 17, lineHeight: 22 }}>
            {a.service === 'Follow-up consultation' ? 'Follow-up' : a.service} with {a.doctorName}
          </Text>
          <Text variant="bodySm" color={h.fgMuted}>
            {formatTime(a.startsAt, timeZone)} · {a.mode === 'online' ? 'Online' : a.location} · {a.specialty}
          </Text>
        </View>
      </View>
      {a.instructions ? (
        <View style={[styles.note, { backgroundColor: h.noteBg }]}>
          <Text variant="bodySm" color={h.noteFg}>
            {a.instructions}
          </Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button label={action?.label ?? 'See my visits'} size="md" colors={{ bg: h.primaryBg, fg: h.primaryFg }} style={{ flex: 1 }} onPress={action?.onPress ?? (() => router.navigate('/visits'))} />
        {/* "Add to calendar" needs expo-calendar and a calendar permission (decision D9). */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 20, gap: 14, overflow: 'hidden' },
  ring: { position: 'absolute', right: -48, top: -64, width: 190, height: 190, borderRadius: 999, borderWidth: 30, borderColor: 'rgba(255,255,255,0.07)' },
  blob: { position: 'absolute', right: 48, bottom: -72, width: 124, height: 124, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  main: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  date: { width: 60, minHeight: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  dateSmall: { fontSize: 11, lineHeight: 14, letterSpacing: 0.66 },
  dateNum: { fontSize: 24, lineHeight: 26 },
  note: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  actions: { flexDirection: 'row', gap: 8 },
});
