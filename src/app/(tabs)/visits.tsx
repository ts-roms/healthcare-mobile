import { router } from 'expo-router';
import { Calendar, CalendarPlus } from 'lucide-react-native';

import { NextVisitCard } from '@/components/NextVisitCard';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { formatDate, formatTime } from '@/lib/format';
import { useMe } from '@/lib/me';
import { Badge, Button, Card, EmptyState, ErrorState, ListRow, Loading, PageTitle, Screen, Section } from '@/ui';

export default function VisitsScreen() {
  const { timeZone } = useMe();
  const now = new Date();
  const { data, error, reload } = useApi(api.getAppointments);

  const upcoming = data?.filter((a) => a.status === 'booked' && new Date(a.startsAt) > now) ?? [];
  const past = (data?.filter((a) => !upcoming.includes(a)) ?? []).reverse();

  return (
    <Screen tabBar header={<PageTitle title="Visits" />}>
      <Button label="Book a visit" icon={CalendarPlus} onPress={() => router.push('/book')} />
      {error && !data ? <ErrorState message={error.message} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && upcoming.length === 0 ? <EmptyState icon={Calendar} title="No upcoming visits" body="Book a visit and it will show here." /> : null}
      {upcoming.length ? <NextVisitCard appointment={upcoming[0]} timeZone={timeZone} now={now} action={{ label: 'Book another visit', onPress: () => router.push('/book') }} /> : null}
      {upcoming.length > 1 ? (
        <Section title="Also coming up">
          <Card padded={false}>
            {upcoming.slice(1).map((a, i) => (
              <ListRow key={a.id} divider={i > 0} icon={Calendar} title={`${a.service} · ${a.doctorName}`} subtitle={`${formatDate(a.startsAt, timeZone)} · ${formatTime(a.startsAt, timeZone)}`} trailing={<Badge label="Booked" tone="info" size="sm" />} />
            ))}
          </Card>
        </Section>
      ) : null}
      {past.length ? (
        <Section title="Past visits">
          <Card padded={false}>
            {past.map((a, i) => (
              <ListRow key={a.id} divider={i > 0} title={`${a.service} · ${a.doctorName}`} subtitle={`${formatDate(a.startsAt, timeZone)} · ${a.location}`} trailing={<Badge label={a.status === 'cancelled' ? 'Cancelled' : 'Done'} tone="neutral" size="sm" />} />
            ))}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
