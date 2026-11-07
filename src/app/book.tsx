import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { BookingSlots } from '@/data/types';
import { bookingDays, bookingMessage } from '@/domain/wording';
import { formatTime, partsInZone } from '@/lib/format';
import { Avatar, BottomActionBar, Button, Card, ErrorState, Header, Loading, Notice, Screen, Section, Text, useTheme } from '@/ui';

const ANY = 'any';
const DAYS_SHOWN = 6;

/**
 * Online booking (`GET /portal/booking/options`, `/booking/slots`, `POST /portal/appointments`). The API decides what is
 * bookable and re-checks every rule; this screen only offers its choices. Prices are not part of the booking API.
 */
export default function BookScreen() {
  const { colors, shadow } = useTheme();
  const options = useApi(api.getBookingOptions);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [pickedType, setVisitType] = useState<string | null>(null);
  const [pickedDoctor, setDoctor] = useState<string>(ANY);
  const [pickedDate, setDate] = useState<string | null>(null);
  const [pickedSlot, setSlot] = useState<string | null>(null);
  const [dayLists, setDayLists] = useState<{ key: string; days: Record<string, BookingSlots> } | null>(null);

  const facility = options.data?.facilities[0];
  const visitTypeId = pickedType ?? options.data?.visitTypes[0]?.id ?? null;
  const visitType = options.data?.visitTypes.find((v) => v.id === visitTypeId);
  const doctorId = facility?.practitioners.some((p) => p.id === pickedDoctor) ? pickedDoctor : ANY;
  const timeZone = facility?.timeZone ?? 'Asia/Manila';
  const days = facility ? bookingDays(new Date(), facility.rules, timeZone, DAYS_SHOWN) : [];
  const key = `${facility?.id}|${visitTypeId}|${doctorId}`;
  const byDay = dayLists?.key === key ? dayLists.days : null;
  const open = (d: string) => (byDay?.[d]?.slots.length ?? 0) > 0;
  const date = days.find((d) => d === pickedDate && open(d)) ?? days.find(open) ?? null;
  const slots = date && byDay ? byDay[date]!.slots : [];
  const slot = slots.find((s) => `${s.startsAt}|${s.practitionerId}` === pickedSlot) ?? null;

  // The slots of the days shown, for the chosen visit type and doctor: a day without open times is greyed out.
  useEffect(() => {
    if (!facility || !visitTypeId) return;
    const k = `${facility.id}|${visitTypeId}|${doctorId}`;
    let live = true;
    const dates = bookingDays(new Date(), facility.rules, facility.timeZone, DAYS_SHOWN);
    Promise.all(
      dates.map((d) =>
        api
          .getBookingSlots({ facilityId: facility.id, visitTypeId, date: d, practitionerId: doctorId === ANY ? undefined : doctorId })
          .catch(() => ({ date: d, timeZone: facility.timeZone, durationMinutes: 0, slots: [] }) as BookingSlots),
      ),
    ).then((lists) => live && setDayLists({ key: k, days: Object.fromEntries(lists.map((l, i) => [dates[i]!, l])) }));
    return () => {
      live = false;
    };
  }, [facility, visitTypeId, doctorId]);

  const summary = slot && date && visitType ? `${dayLabel(date)} · ${formatTime(slot.startsAt, timeZone)} · ${slot.practitionerName}` : 'Pick a day and time';

  const confirm = async () => {
    if (!facility || !visitTypeId || !slot) return;
    setBusy(true);
    setError(null);
    try {
      await api.bookAppointment({ facilityId: facility.id, visitTypeId, practitionerId: slot.practitionerId, startsAt: slot.startsAt });
      router.dismissTo('/visits');
    } catch (e) {
      setError(e instanceof api.ApiError ? bookingMessage(e.code, api.patientMessage(e)) : api.patientMessage(e));
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
          <Text variant="bodySm" muted>
            {summary}
          </Text>
          <Button label="Confirm booking" onPress={confirm} loading={busy} disabled={!slot} />
        </BottomActionBar>
      }>
      {options.error ? <ErrorState message={api.patientMessage(options.error)} onRetry={options.reload} /> : null}
      {!options.data && !options.error ? <Loading /> : null}
      {options.data && !facility ? <Notice tone="info">The clinic doesn’t take bookings in MyHealth yet. Please call the clinic.</Notice> : null}
      {error ? (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      ) : null}
      {options.data && facility ? (
        <>
          <Section title="1 · What for" eyebrow>
            {options.data.visitTypes.map((v) => {
              const on = v.id === visitTypeId;
              return (
                <Card key={v.id} selected={on} onPress={() => setVisitType(v.id)} accessibilityLabel={`${v.name}, ${v.durationMinutes} minutes, ${v.modality === 'telemedicine' ? 'video call' : 'in person'}`} style={styles.service}>
                  <View style={[styles.radio, { borderColor: on ? colors.primary : colors.inputBorder }]}>{on ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
                  <View style={{ flex: 1 }}>
                    <Text weight={600}>{v.name}</Text>
                    <Text variant="caption" muted>
                      {v.durationMinutes} min · {v.modality === 'telemedicine' ? 'video call' : `in person · ${facility.name}`}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </Section>

          <Section title="2 · Doctor" eyebrow>
            <View style={styles.grid2}>
              {[{ id: ANY, displayName: 'Any available doctor', specialty: null }, ...facility.practitioners].map((d) => (
                <Card key={d.id} selected={d.id === doctorId} onPress={() => setDoctor(d.id)} accessibilityLabel={d.specialty ? `${d.displayName}, ${d.specialty}` : d.displayName} style={styles.doctor}>
                  <Avatar initials={d.id === ANY ? '★' : initials(d.displayName)} size={40} />
                  <Text variant="bodySm" weight={700}>
                    {d.displayName}
                  </Text>
                  {d.specialty ? (
                    <Text variant="small" muted>
                      {d.specialty}
                    </Text>
                  ) : null}
                </Card>
              ))}
            </View>
          </Section>

          <Section title="3 · Day" eyebrow right={date ? <Text variant="bodySm" weight={600}>{`${partsInZone(`${date}T12:00:00Z`, 'UTC').month} ${date.slice(0, 4)}`}</Text> : null}>
            {!byDay ? (
              <Loading label="Finding open times" />
            ) : (
              <View style={styles.days}>
                {days.map((d) => {
                  const p = partsInZone(`${d}T12:00:00Z`, 'UTC');
                  const available = open(d);
                  const on = d === date;
                  const fg = !available ? colors.disabled.fg : on ? colors.onPrimary : colors.text;
                  return (
                    <Pressable
                      key={d}
                      disabled={!available}
                      onPress={() => setDate(d)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on, disabled: !available }}
                      accessibilityLabel={`${p.weekday} ${p.day} ${p.month}${available ? '' : ', no open times'}`}
                      style={[...tile(on, !available), styles.day]}>
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
            )}
            {byDay && !date ? <Text variant="caption" muted>No open times in the next days. Try another doctor, or call the clinic.</Text> : null}
          </Section>

          {date ? (
            <Section title="4 · Time" eyebrow>
              <View style={styles.times}>
                {slots.map((s) => {
                  const k = `${s.startsAt}|${s.practitionerId}`;
                  const on = k === pickedSlot;
                  const label = formatTime(s.startsAt, timeZone);
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setSlot(k)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={doctorId === ANY ? `${label} with ${s.practitionerName}` : label}
                      style={[...tile(on), styles.time]}>
                      <Text variant="bodySm" weight={600} color={on ? colors.onPrimary : colors.text}>
                        {label}
                      </Text>
                      {doctorId === ANY ? (
                        <Text variant="small" color={on ? colors.onPrimary : colors.textMuted} numberOfLines={1}>
                          {s.practitionerName}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              <Text variant="caption" muted>
                Only open times are shown. Times are at {facility.name}.
              </Text>
            </Section>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function dayLabel(date: string) {
  const p = partsInZone(`${date}T12:00:00Z`, 'UTC');
  return `${p.weekdayShort}, ${p.day} ${p.monthShort}`;
}

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const styles = StyleSheet.create({
  service: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, paddingVertical: 14 },
  radio: { width: 20, height: 20, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 999 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  doctor: { width: '48%', flexGrow: 1, gap: 6, borderRadius: 16, padding: 14 },
  days: { flexDirection: 'row', gap: 6 },
  tile: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  day: { flex: 1, minHeight: 64 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { width: '31.5%', flexGrow: 1, minHeight: 44, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 4 },
});
