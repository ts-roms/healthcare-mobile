import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { PortalAppointment } from '@/data/types';
import { APPOINTMENT_STATUS } from '@/domain/wording';
import { formatTime, partsInZone, relativeDays } from '@/lib/format';
import { Button, Text, useTheme } from '@/ui';

type Action = { label: string; onPress: () => void };
type Props = { appointment: PortalAppointment; now: Date; action?: Action; secondary?: Action };

/** Teal hero card for the next booked visit (bordered card in dark mode). Times are in the visit's own facility zone. */
export function NextVisitCard({ appointment: a, now, action, secondary }: Props) {
  const timeZone = a.timeZone;
  const { colors, shadow } = useTheme();
  const h = colors.hero;
  const p = partsInZone(a.startsAt, timeZone);
  const when = relativeDays(a.startsAt, now, timeZone);

  return (
    <View
      accessibilityLabel={`Your next visit, ${when}: ${a.visitType} with ${a.practitionerName}, ${p.weekday} ${p.day} ${p.month} at ${formatTime(a.startsAt, timeZone)}, ${a.modality === 'telemedicine' ? 'online' : a.facilityName}`}
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
            {APPOINTMENT_STATUS[a.status]}
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
            {a.visitType} with {a.practitionerName}
          </Text>
          <Text variant="bodySm" color={h.fgMuted}>
            {formatTime(a.startsAt, timeZone)} · {a.modality === 'telemedicine' ? 'Online' : a.facilityName}
          </Text>
        </View>
      </View>
      {a.reason ? (
        <View style={[styles.note, { backgroundColor: h.noteBg }]}>
          <Text variant="bodySm" color={h.noteFg}>
            Reason: {a.reason}
          </Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button label={action?.label ?? 'See my visits'} size="md" colors={{ bg: h.primaryBg, fg: h.primaryFg }} style={{ flex: 1 }} onPress={action?.onPress ?? (() => router.navigate('/visits'))} />
        {secondary ? <Button label={secondary.label} size="md" variant="secondary" colors={{ bg: 'transparent', fg: h.fg, border: h.secondaryBorder }} style={{ flex: 1 }} onPress={secondary.onPress} /> : null}
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
