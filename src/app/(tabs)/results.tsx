import { Link } from 'expo-router';
import { FlaskConical, Info } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ResultRow, spokenResult } from '@/components/ResultCards';
import * as api from '@/data/api';
import { useApi } from '@/data/useApi';
import { groupResults } from '@/domain/results';
import { formatDate } from '@/lib/format';
import { useMe } from '@/lib/me';
import { Card, ChipGroup, EmptyState, ErrorState, Loading, Notice, PageTitle, Screen, Text } from '@/ui';

type Filter = 'all' | 'outside';

export default function ResultsScreen() {
  const { timeZone } = useMe();
  const [filter, setFilter] = useState<Filter>('all');
  const { data, error, reload } = useApi(api.getResults);
  // Search is in the design, but GET /portal/results has no search parameter yet (Needs API).

  const groups = data ? groupResults(data, filter) : [];

  return (
    <Screen
      tabBar
      header={
        <PageTitle title="Results">
          <ChipGroup
            accessibilityLabel="Filter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'outside', label: 'Outside usual range' },
            ]}
          />
        </PageTitle>
      }
      contentStyle={{ gap: 18 }}>
      {error && !data ? <ErrorState message={error.message} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && groups.length === 0 ? (
        <EmptyState icon={FlaskConical} title={filter === 'all' ? 'No results yet' : 'Nothing outside the usual range'} body={filter === 'all' ? 'Results appear here once your doctor has released them.' : undefined} />
      ) : null}
      {groups.map((g) => (
        <View key={g.key} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <Text weight={700} accessibilityRole="header">
              {formatDate(g.collectedAt, timeZone)}
            </Text>
            <Text variant="caption" muted>
              Lab order {g.orderNo}
            </Text>
          </View>
          <Card padded={false}>
            {g.items.map((r, i) => (
              <Link key={r.id} href={{ pathname: '/results/[id]', params: { id: r.id } }} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={spokenResult(r)}>
                  {({ pressed }) => (
                    <View style={{ opacity: pressed ? 0.7 : 1 }}>
                      <ResultRow result={r} first={i === 0} />
                    </View>
                  )}
                </Pressable>
              </Link>
            ))}
          </Card>
        </View>
      ))}
      {data ? (
        <Notice tone="info" icon={Info}>
          You see results once your doctor has reviewed and released them.
        </Notice>
      ) : null}
    </Screen>
  );
}
