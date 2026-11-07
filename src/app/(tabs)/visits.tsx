import { router } from 'expo-router';
import { Calendar, CalendarPlus, Video } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { NextVisitCard } from '@/components/NextVisitCard';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import type { PortalAppointment } from '@/data/types';
import { APPOINTMENT_STATUS, bookingMessage } from '@/domain/wording';
import { formatDate, formatTime } from '@/lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, ListRow, Loading, Notice, PageTitle, Screen, Section } from '@/ui';

const byStart = (a: PortalAppointment, b: PortalAppointment) => a.startsAt.localeCompare(b.startsAt);

/** `GET /portal/appointments`: upcoming and the past year, in each visit's own facility time zone. */
export default function VisitsScreen() {
  const now = new Date();
  const { data, error, reload } = useApi(api.getAppointments);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const upcoming = (data?.upcoming ?? []).filter((a) => a.status !== 'cancelled').sort(byStart);
  const past = [...(data?.past ?? []), ...(data?.upcoming ?? []).filter((a) => a.status === 'cancelled')].sort(byStart).reverse();

  const cancel = (a: PortalAppointment) => {
    const run = async () => {
      try {
        await api.cancelAppointment(a.id, a.version);
        setMessage({ tone: 'success', text: 'Your visit was cancelled.' });
        reload();
      } catch (e) {
        setMessage({ tone: 'danger', text: e instanceof api.ApiError ? bookingMessage(e.code, api.patientMessage(e)) : api.patientMessage(e) });
      }
    };
    const question = `Cancel ${a.visitType} with ${a.practitionerName} on ${formatDate(a.startsAt, a.timeZone)} at ${formatTime(a.startsAt, a.timeZone)}?`;
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(question)) void run();
      return;
    }
    Alert.alert('Cancel this visit?', question, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel visit', style: 'destructive', onPress: () => void run() },
    ]);
  };

  return (
    <Screen tabBar header={<PageTitle title="Visits" />}>
      <Button label="Book a visit" icon={CalendarPlus} onPress={() => router.push('/book')} />
      {message ? (
        <Notice tone={message.tone} role={message.tone === 'danger' ? 'alert' : undefined}>
          {message.text}
        </Notice>
      ) : null}
      {error && !data ? <ErrorState message={api.patientMessage(error)} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && upcoming.length === 0 ? <EmptyState icon={Calendar} title="No upcoming visits" body="Book a visit and it will show here." /> : null}
      {upcoming[0] ? (
        <NextVisitCard
          appointment={upcoming[0]}
          now={now}
          action={
            upcoming[0].modality === 'telemedicine'
              ? { label: 'Open the consultation', onPress: () => router.push({ pathname: '/consult', params: { id: upcoming[0]!.id } }) }
              : { label: 'Book another visit', onPress: () => router.push('/book') }
          }
          secondary={upcoming[0].canCancel ? { label: 'Cancel', onPress: () => cancel(upcoming[0]!) } : undefined}
        />
      ) : null}
      {upcoming.length > 1 ? (
        <Section title="Also coming up">
          <Card padded={false}>
            {upcoming.slice(1).map((a, i) => (
              <ListRow
                key={a.id}
                divider={i > 0}
                icon={a.modality === 'telemedicine' ? Video : Calendar}
                title={`${a.visitType} · ${a.practitionerName}`}
                subtitle={`${formatDate(a.startsAt, a.timeZone)} · ${formatTime(a.startsAt, a.timeZone)}`}
                trailing={
                  a.canCancel ? (
                    <Button label="Cancel" variant="ghost" size="md" onPress={() => cancel(a)} style={{ paddingHorizontal: 8 }} />
                  ) : (
                    <Badge label={APPOINTMENT_STATUS[a.status]} tone="info" size="sm" />
                  )
                }
              />
            ))}
          </Card>
        </Section>
      ) : null}
      {past.length ? (
        <Section title="Past visits">
          <Card padded={false}>
            {past.map((a, i) => (
              <ListRow
                key={a.id}
                divider={i > 0}
                title={`${a.visitType} · ${a.practitionerName}`}
                subtitle={`${formatDate(a.startsAt, a.timeZone)} · ${a.facilityName}`}
                trailing={<Badge label={APPOINTMENT_STATUS[a.status]} tone={a.status === 'no_show' ? 'warning' : 'neutral'} size="sm" />}
              />
            ))}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
