import { HeartPulse } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { HealthRecordItem } from '@/components/health/HealthRecordItem';
import {
  RecordFilterChips,
  type RecordFilter,
} from '@/components/health/RecordFilterChips';
import { WeightSummaryCard } from '@/components/health/WeightSummaryCard';
import { colors } from '@/constants/colors';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { isWeightRecord, sortByLatest } from '@/utils/health';

export default function HealthScreen() {
  const pet = usePetStore((state) => state.pet);

  const allRecords = useHealthStore((state) => state.records);

  const [filter, setFilter] = useState<RecordFilter>('ALL');

  /**
   * 현재 반려동물의 기록 (최신순)
   */
  const petRecords = useMemo(
    () => sortByLatest(allRecords.filter((record) => record.petId === pet?.id)),
    [allRecords, pet?.id],
  );

  const records = useMemo(
    () =>
      filter === 'ALL'
        ? petRecords
        : petRecords.filter((record) => record.type === filter),
    [petRecords, filter],
  );

  /**
   * 체중 기록 (오래된순, 차트용)
   */
  const weightRecords = useMemo(
    () => petRecords.filter(isWeightRecord).reverse(),
    [petRecords],
  );

  if (!pet) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          반려동물 정보를 불러오고 있어요.
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <AppText variant="heading1">건강</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          {pet.name}의 건강 변화를 기록으로 확인해보세요.
        </AppText>
      </View>

      <WeightSummaryCard records={weightRecords} />

      <RecordFilterChips value={filter} onChange={setFilter} />

      {records.length === 0 ? (
        <View style={styles.emptyCard}>
          <HeartPulse size={28} color={colors.primary[600]} />

          <AppText variant="body1" style={styles.emptyTitle}>
            아직 기록이 없어요
          </AppText>

          <AppText variant="body2" color="secondary">
            체중이나 증상, 투약 기록을 남기면 여기에 모아볼 수 있어요.
          </AppText>
        </View>
      ) : (
        <View>
          {records.map((record) => (
            <HealthRecordItem key={record.id} record={record} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 24,
  },

  description: {
    marginTop: 8,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },

  emptyCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
  },

  emptyTitle: {
    marginTop: 12,
    marginBottom: 6,
  },
});
