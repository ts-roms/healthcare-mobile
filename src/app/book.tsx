import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { ApiError } from '@/data/api';
import { useApi } from '@/data/useApi';
import type { BookingDay, BookingDoctor, BookingSlot } from '@/data/types';
import { formatTime, partsInZone, price } from '@/lib/format';
import { useMe } from '@/lib/me';
import { Avatar, BottomActionBar, Button, Card, ErrorState, Header, Loading, Notice, Screen, Section, Text, useTheme } from '@/ui';

export default function BookScreen() {
  const { colors, shadow } = useTheme();
  const { timeZone } = useMe();
  const services = useApi(api.getBookingServices);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // What the person tapped. The effective choice falls back to the first available option,
  // and a pick that no longer fits (other doctor, other day) is ignored.
  const [pickedService, setServiceId] = useState<string | null>(null);
  const [pickedDoctor, setDoctorId] = useState<string | null>(null);
  const [pickedDate, setDate] = useState<string | null>(null);
  const [pickedSlot, setSlot] = useState<string | null>(null);

  // Each list remembers the request it answers, so stale answers are never shown.
  const [doctorList, setDoctorList] = useState<{ key: string; list: BookingDoctor[] } | null>(null);
  const [dayList, setDayList] = useState<{ key: string; list: BookingDay[] } | null>(null);
  const [slotList, setSlotList] = useState<{ key: string; list: BookingSlot[] } | null>(null);

  const serviceId = pickedService ?? services.data?.[0]?.id ?? null;
  const doctors = doctorList?.key === serviceId ? doctorList.list : [];
  const doctorId = doctors.find((d) => d.id === pickedDoctor)?.id ?? doctors[0]?.id ?? null;
  const days = dayList?.key === doctorId ? dayList.list : [];
  const date = days.find((d) => d.date === pickedDate && d.available)?.date ?? days.find((d) => d.available)?.date ?? null;
  const slotKey = `${doctorId}|${date}`;
  const slots = slotList?.key === slotKey ? slotList.list : [];
  const slot = slots.find((s) => s.startsAt === pickedSlot && s.available)?.startsAt ?? null;

  useEffect(() => {
    if (!serviceId) return;
    api.getBookingDoctors(serviceId).then((list) => setDoctorList({ key: serviceId, list }));
  }, [serviceId]);

  useEffect(() => {
    if (!doctorId) return;
    api.getBookingDays(doctorId).then((list) => setDayList({ key: doctorId, list }));
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || !date) return;
    api.getBookingSlots(doctorId, date).then((list) => setSlotList({ key: `${doctorId}|${date}`, list }));
  }, [doctorId, date]);

  const service = services.data?.find((s) => s.id === serviceId);
  const doctor = doctors.find((d) => d.id === doctorId);
  const dayParts = date ? partsInZone(`${date}T12:00:00+08:00`, timeZone) : null;
  const summary = slot && dayParts && doctor ? `${dayParts.weekdayShort}, ${dayParts.day} ${dayParts.monthShort} · ${formatTime(slot, timeZone)} · ${doctor.name.replace(/^Dr\. \S+ /, 'Dr. ')}` : 'Pick a day and time';

  const confirm = async () => {
    if (!serviceId || !doctorId || !slot) return;
    setBusy(true);
    setError(null);
    try {
      await api.bookAppointment({ serviceId, doctorId, startsAt: slot });
      router.dismissTo('/visits');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'We couldn’t book that time. Try again.');
      setBusy(false);
    }
  };

  const tile = (on: boolean, disabled = false) => [
    styles.tile,
    disabled
      ? { backgroundColor: colors.disabled.bg, borderColor: colors.disabled.bg, borderWidth: 1 }
      : on
        ? { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1, boxShadow: shadow.primary }
        : { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, boxShadow: shadow.card },
  ];

  return (
    <Screen
      header={<Header title="Book a visit" leading="close" />}
      contentStyle={{ gap: 22 }}
      footer={
        <BottomActionBar>
          <View style={styles.summary}>
            <Text variant="bodySm" muted style={{ flex: 1 }}>
              {summary}
            </Text>
            {service?.price != null ? (
              <Text variant="bodySm" weight={700}>
                {price(service.price)}
              </Text>
            ) : null}
          </View>
          <Button label="Confirm booking" onPress={confirm} loading={busy} disabled={!slot} />
        </BottomActionBar>
      }>
      {services.error ? <ErrorState message={services.error.message} onRetry={services.reload} /> : null}
      {!services.data && !services.error ? <Loading /> : null}
      {error ? (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      ) : null}
      {services.data ? (
        <>
          <Section title="1 · What for" eyebrow>
            {services.data.map((s) => (
              <Card key={s.id} selected={s.id === serviceId} onPress={() => setServiceId(s.id)} accessibilityLabel={`${s.name}, ${s.durationMin} minutes, ${s.mode === 'online' ? 'video call' : 'in person'}${s.price != null ? `, ${price(s.price)}` : ''}`} style={styles.service}>
                <View style={[styles.radio, { borderColor: s.id === serviceId ? colors.primary : colors.inputBorder }]}>{s.id === serviceId ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Text weight={600}>{s.name}</Text>
                  <Text variant="caption" muted>
                    {s.durationMin} min · {s.mode === 'online' ? 'video call' : 'in person'}
                  </Text>
                </View>
                {s.price != null ? (
                  <Text variant="bodySm" weight={700}>
                    {price(s.price)}
                  </Text>
                ) : null}
              </Card>
            ))}
          </Section>

          <Section title="2 · Doctor" eyebrow>
            <View style={styles.grid2}>
              {doctors.map((d) => (
                <Card key={d.id} selected={d.id === doctorId} onPress={() => setDoctorId(d.id)} accessibilityLabel={`${d.name}, ${d.specialty}`} style={styles.doctor}>
                  <Avatar initials={d.initials} size={40} />
                  <Text variant="bodySm" weight={700}>
                    {d.name}
                  </Text>
                  <Text variant="small" muted>
                    {d.specialty}
                  </Text>
                </Card>
              ))}
            </View>
          </Section>

          <Section title="3 · Day" eyebrow right={dayParts ? <Text variant="bodySm" weight={600}>{`${dayParts.month} ${dayParts.year}`}</Text> : null}>
            <View style={styles.days}>
              {days.map((d) => {
                const p = partsInZone(`${d.date}T12:00:00+08:00`, timeZone);
                const on = d.date === date;
                const fg = !d.available ? colors.disabled.fg : on ? colors.onPrimary : colors.text;
                return (
                  <Pressable key={d.date} disabled={!d.available} onPress={() => setDate(d.date)} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !d.available }} accessibilityLabel={`${p.weekday} ${p.day} ${p.month}${d.available ? '' : ', fully booked'}`} style={[...tile(on, !d.available), styles.day]}>
                    <Text variant="small" weight={600} color={fg}>
                      {p.weekdayShort}
                    </Text>
                    <Text weight={800} color={fg} style={{ fontSize: 18, lineHeight: 22 }}>
                      {p.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="4 · Time" eyebrow>
            <View style={styles.times}>
              {slots.map((s) => {
                const on = s.startsAt === slot;
                const label = formatTime(s.startsAt, timeZone);
                return (
                  <Pressable key={s.startsAt} disabled={!s.available} onPress={() => setSlot(s.startsAt)} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !s.available }} accessibilityLabel={`${label}${s.available ? '' : ', already booked'}`} style={[...tile(on, !s.available), styles.time]}>
                    <Text variant="bodySm" weight={600} color={!s.available ? colors.disabled.fg : on ? colors.onPrimary : colors.text} style={!s.available ? { textDecorationLine: 'line-through' } : undefined}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text variant="caption" muted>
              Greyed-out times are already booked.
            </Text>
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  service: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, paddingVertical: 14 },
  radio: { width: 20, height: 20, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 999 },
  grid2: { flexDirection: 'row', gap: 10 },
  doctor: { flex: 1, gap: 6, borderRadius: 16, padding: 14 },
  days: { flexDirection: 'row', gap: 6 },
  tile: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  day: { flex: 1, minHeight: 64 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { width: '31.5%', flexGrow: 1, minHeight: 44, borderRadius: 12 },
});
