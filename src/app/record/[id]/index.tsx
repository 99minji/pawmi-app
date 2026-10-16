import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { HealthRecordIcon } from '@/components/health/HealthRecordIcon';
import { colors } from '@/constants/colors';
import { shadows } from '@/constants/theme';
import { deleteHealthRecordById } from '@/services/health';
import { useHealthStore } from '@/stores/useHealthStore';
import type { HealthRecord } from '@/types/health';

export default function HealthRecordDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const record = useHealthStore((state) =>
    state.records.find((item) => item.id === id),
  );

  const removeRecord = useHealthStore((state) => state.removeRecord);

  if (!record) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          기록을 찾을 수 없어요.
        </AppText>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('기록을 삭제할까요?', '삭제한 기록은 다시 되돌릴 수 없어요.', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHealthRecordById(record.id);

            removeRecord(record.id);

            router.back();
          } catch (error) {
            console.log('DELETE HEALTH RECORD ERROR:', error);

            Alert.alert('삭제하지 못했어요', '잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconCircle}>
          <HealthRecordIcon type={record.type} size={24} />
        </View>

        <AppText variant="heading1" style={styles.title}>
          {record.title}
        </AppText>

        <AppText variant="body2" color="secondary" style={styles.date}>
          {new Date(record.occurredAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </AppText>

        <View style={styles.card}>
          <DetailContent record={record} />
        </View>

        {record.memo ? (
          <View style={styles.section}>
            <AppText variant="heading2">메모</AppText>

            <View style={styles.memoCard}>
              <AppText variant="body1" color="secondary">
                {record.memo}
              </AppText>
            </View>
          </View>
        ) : null}

        <Pressable
          style={styles.editButton}
          onPress={() =>
            router.push({
              pathname: '/record/[id]/edit',
              params: {
                id: record.id,
              },
            })
          }
        >
          <Pencil size={18} color={colors.primary[700]} />

          <AppText variant="body1" color="brand">
            기록 수정
          </AppText>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={18} color={colors.error[500]} />

          <AppText
            variant="body1"
            style={{
              color: colors.error[500],
            }}
          >
            기록 삭제
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function DetailContent({ record }: { record: HealthRecord }) {
  switch (record.type) {
    case 'WEIGHT':
      return (
        <>
          <DetailRow label="체중" value={`${record.weightKg}kg`} />
        </>
      );

    case 'SYMPTOM':
      return <DetailRow label="증상" value={record.symptom} />;

    case 'MEDICATION':
      return (
        <>
          <DetailRow label="약 이름" value={record.medicationName} />

          {record.dosageText ? (
            <DetailRow label="복용 정보" value={record.dosageText} />
          ) : null}
        </>
      );

    case 'VACCINATION':
      return <DetailRow label="예방접종" value={record.vaccinationName} />;

    case 'VET_VISIT':
      return (
        <>
          <DetailRow label="방문 이유" value={record.visitReason} />

          {record.clinicName ? (
            <DetailRow label="병원" value={record.clinicName} />
          ) : null}
        </>
      );
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="body2" color="secondary">
        {label}
      </AppText>

      <AppText variant="body1">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  title: {
    marginTop: 16,
  },

  date: {
    marginTop: 6,
  },

  card: {
    marginTop: 28,
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.surface.card,
    ...shadows.card,
  },

  detailRow: {
    gap: 6,
    paddingVertical: 10,
  },

  section: {
    marginTop: 28,
  },

  memoCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface.card,
  },

  editButton: {
    minHeight: 52,
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
  },

  deleteButton: {
    minHeight: 52,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.error[50],
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
});
