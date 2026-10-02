import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { HealthRecord } from '@/types/health';
import {
  HeartPulse,
  Hospital,
  Pill,
  Scale,
  ShieldCheck,
} from 'lucide-react-native';
import { useMemo } from 'react';

const renderRecordMeta = (record: HealthRecord) => {
  switch (record.type) {
    case 'WEIGHT':
      return `${record.weightKg}kg`;

    case 'SYMPTOM':
      return record.symptom;

    case 'MEDICATION':
      return record.dosageText ?? '복용 정보 없음';

    case 'VACCINATION':
      return record.vaccinationName;

    case 'VET_VISIT':
      return record.visitReason;

    default:
      return '';
  }
};

const renderRecordIcon = (record: HealthRecord) => {
  switch (record.type) {
    case 'WEIGHT':
      return <Scale size={20} color={colors.primary[700]} />;

    case 'SYMPTOM':
      return <HeartPulse size={20} color={colors.primary[700]} />;

    case 'MEDICATION':
      return <Pill size={20} color={colors.primary[700]} />;

    case 'VACCINATION':
      return <ShieldCheck size={20} color={colors.primary[700]} />;

    case 'VET_VISIT':
      return <Hospital size={20} color={colors.primary[700]} />;
  }
};

export default function HealthScreen() {
  const pet = usePetStore((state) => state.pet);

  const allRecords = useHealthStore((state) => state.records);

  const records = useMemo(
    () => allRecords.filter((record) => record.petId === pet?.id),
    [allRecords, pet?.id],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="heading1">건강 기록</AppText>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="heading2">아직 기록이 없어요</AppText>

          <AppText
            variant="body1"
            color="secondary"
            style={styles.emptyDescription}
          >
            체중이나 증상을 기록하면 여기에서 확인할 수 있어요.
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {records.map((record) => (
            <View key={record.id} style={styles.timelineItem}>
              <View style={styles.iconBox}>{renderRecordIcon(record)}</View>

              <View style={styles.timelineContent}>
                <AppText variant="body1">{record.title}</AppText>

                <AppText variant="body2" color="secondary" style={styles.meta}>
                  {renderRecordMeta(record)}
                </AppText>

                <AppText variant="label" color="tertiary" style={styles.date}>
                  {new Date(record.occurredAt).toLocaleDateString('ko-KR')}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function RecordIcon({ type }: { type: HealthRecord['type'] }) {
  if (type === 'SYMPTOM') {
    return <HeartPulse size={20} color={colors.primary[700]} />;
  }

  return <Scale size={20} color={colors.primary[700]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  content: {
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  empty: {
    marginTop: 80,
    alignItems: 'center',
  },

  emptyDescription: {
    marginTop: 8,
    textAlign: 'center',
  },

  list: {
    marginTop: 28,
    gap: 12,
  },

  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  timelineContent: {
    flex: 1,
  },

  meta: {
    marginTop: 4,
  },

  date: {
    marginTop: 8,
  },
});
