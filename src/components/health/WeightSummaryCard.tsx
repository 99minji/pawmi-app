import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import type { WeightRecord } from '@/types/health';

const CHART_SIZE = 7;

/**
 * 최근 체중과 직전 기록 대비 변화, 최근 7개 막대 차트
 *
 * @param records 오래된순으로 정렬된 체중 기록
 */
export function WeightSummaryCard({ records }: { records: WeightRecord[] }) {
  const latestWeight = records.at(-1)?.weightKg;

  const previousWeight = records.at(-2)?.weightKg;

  if (latestWeight === undefined) {
    return null;
  }

  const weightDiff =
    previousWeight !== undefined ? latestWeight - previousWeight : null;

  return (
    <View style={styles.card}>
      <View>
        <AppText variant="body2" color="secondary">
          최근 체중
        </AppText>

        <AppText variant="heading1" style={styles.value}>
          {latestWeight}kg
        </AppText>

        {weightDiff !== null && (
          <AppText variant="body2" color="secondary">
            이전 기록보다 {weightDiff > 0 ? '+' : ''}
            {weightDiff.toFixed(1)}kg
          </AppText>
        )}
      </View>

      <WeightMiniChart records={records.slice(-CHART_SIZE)} />
    </View>
  );
}

function WeightMiniChart({ records }: { records: WeightRecord[] }) {
  const values = records.map((record) => record.weightKg);

  const min = Math.min(...values);
  const max = Math.max(...values);

  const range = max - min || 1;

  return (
    <View style={styles.chart}>
      {records.map((record) => {
        const ratio = (record.weightKg - min) / range;

        return (
          <View
            key={record.id}
            style={[styles.chartBar, { height: 18 + ratio * 42 }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 150,
    marginBottom: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderRadius: 24,
    backgroundColor: colors.accent.yellowLight,
  },

  value: {
    marginTop: 6,
    marginBottom: 4,
  },

  chart: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },

  chartBar: {
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.yellowDeep,
    opacity: 0.55,
  },
});
