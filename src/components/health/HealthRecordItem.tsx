import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { HealthRecordIcon } from '@/components/health/HealthRecordIcon';
import { colors } from '@/constants/colors';
import type { HealthRecord } from '@/types/health';
import { getRecordDescription } from '@/utils/health';

/**
 * 건강 탭 타임라인의 기록 한 줄
 */
export function HealthRecordItem({ record }: { record: HealthRecord }) {
  return (
    <View style={styles.item}>
      <View style={styles.left}>
        <View style={styles.iconCircle}>
          <HealthRecordIcon type={record.type} />
        </View>

        <View style={styles.line} />
      </View>

      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/record/[id]',
            params: { id: record.id },
          })
        }
      >
        <View style={styles.header}>
          <AppText variant="body1">{record.title}</AppText>

          <AppText variant="label" color="tertiary">
            {new Date(record.occurredAt).toLocaleDateString('ko-KR')}
          </AppText>
        </View>

        <AppText variant="body2" color="secondary" style={styles.detail}>
          {getRecordDescription(record)}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: 12,
  },

  left: {
    width: 40,
    alignItems: 'center',
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  line: {
    width: 2,
    flex: 1,
    minHeight: 50,
    backgroundColor: colors.neutral[200],
  },

  card: {
    flex: 1,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  header: {
    gap: 4,
  },

  detail: {
    marginTop: 8,
  },
});
