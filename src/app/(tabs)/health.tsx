import { HeartPulse } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { HealthRecordItem } from '@/components/health/HealthRecordItem';
import {
  RecordFilterChips,
  type RecordFilter,
} from '@/components/health/RecordFilterChips';
import { WeightSummaryCard } from '@/components/health/WeightSummaryCard';
import { colors } from '@/constants/colors';
import { useTodayDateString } from '@/hooks/useTodayDateString';
import { explainHealthSummary } from '@/services/ai';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { HealthSummaryExplanation } from '@/types/ai';
import {
  HEALTH_RECORD_TYPE_LABELS,
  isWeightRecord,
  sortByLatest,
} from '@/utils/health';
import { buildPetHealthSummary } from '@/utils/healthSummary';

type ExplanationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success';
      data: HealthSummaryExplanation;
    }
  | { status: 'error' };

export default function HealthScreen() {
  const pet = usePetStore((state) => state.pet);

  const allRecords = useHealthStore((state) => state.records);

  const schedules = useCareScheduleStore((state) => state.schedules);

  const [filter, setFilter] = useState<RecordFilter>('ALL');

  const [explanationState, setExplanationState] = useState<ExplanationState>({
    status: 'idle',
  });

  const todayDateString = useTodayDateString();

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

  const weightRecords = useMemo(
    () => petRecords.filter(isWeightRecord).reverse(),
    [petRecords],
  );

  const summary = useMemo(() => {
    if (!pet) {
      return null;
    }

    return buildPetHealthSummary({
      records: petRecords,
      schedules,
      petId: pet.id,
      today: todayDateString,
    });
  }, [petRecords, schedules, pet, todayDateString]);

  useEffect(() => {
    if (!summary || !pet) {
      return;
    }

    let cancelled = false;

    const loadExplanation = async () => {
      // async 함수 내부이므로 effect 본문에서
      // 직접 setState 하는 패턴을 피할 수 있음
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      setExplanationState({
        status: 'loading',
      });

      try {
        const result = await explainHealthSummary(summary, pet.name);

        if (cancelled) {
          return;
        }

        setExplanationState({
          status: 'success',
          data: result,
        });
      } catch (error) {
        console.log('EXPLAIN HEALTH SUMMARY ERROR:', error);

        if (cancelled) {
          return;
        }

        setExplanationState({
          status: 'error',
        });
      }
    };

    loadExplanation();

    return () => {
      cancelled = true;
    };
  }, [summary, pet]);

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

      {explanationState.status === 'loading' ? (
        <View style={styles.summaryCard}>
          <AppText variant="body2" color="secondary">
            최근 건강 기록을 정리하고 있어요...
          </AppText>
        </View>
      ) : explanationState.status === 'success' ? (
        <View style={styles.summaryCard}>
          <AppText variant="heading2">{explanationState.data.headline}</AppText>

          <View style={styles.summaryList}>
            {explanationState.data.items.map((item) => (
              <AppText key={item} variant="body2" color="secondary">
                • {item}
              </AppText>
            ))}
          </View>
        </View>
      ) : null}

      <WeightSummaryCard records={weightRecords} />

      <RecordFilterChips value={filter} onChange={setFilter} />

      {records.length === 0 ? (
        <View style={styles.emptyCard}>
          <HeartPulse size={28} color={colors.primary[600]} />

          <AppText variant="body1" style={styles.emptyTitle}>
            {filter === 'ALL'
              ? '아직 기록이 없어요'
              : `${HEALTH_RECORD_TYPE_LABELS[filter]} 기록이 없어요`}
          </AppText>

          <AppText variant="body2" color="secondary">
            {filter === 'ALL'
              ? '체중이나 증상, 투약 기록을 남기면 여기에 모아볼 수 있어요.'
              : '다른 종류를 선택하거나 새 기록을 남겨보세요.'}
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

  summaryCard: {
    marginBottom: 24,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  summaryList: {
    marginTop: 12,
    gap: 8,
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
