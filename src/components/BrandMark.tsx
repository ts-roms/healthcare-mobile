import { HeartPulse } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text, useTheme } from '@/ui';

export function BrandMark() {
  const { colors, shadow } = useTheme();
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="MyHealth">
      <View style={[styles.mark, { backgroundColor: colors.primary, boxShadow: shadow.primary }]}>
        <HeartPulse size={24} color={colors.onPrimary} strokeWidth={2.2} />
      </View>
      <Text weight={800} color={colors.primaryDeep} style={styles.word}>
        MyHealth
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  word: { fontSize: 22, lineHeight: 28, letterSpacing: -0.44 },
});
