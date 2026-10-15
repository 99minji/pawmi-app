import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { ScheduleTypeIcon } from '@/components/care/ScheduleTypeIcon';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import type { CareSchedule } from '@/types/care';

type MedicationGroupCardProps = {
  dueDate: string;
  // 같은 그룹·같은 날짜의 투약 일정 (시간순, 완료한 시간 포함)
  schedules: CareSchedule[];
  todayDateString: string;
  completingScheduleId: string | null;
  // 완료 버튼 전체 잠금
  disabled: boolean;
  onComplete: (schedule: CareSchedule) => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

/**
 * 홈 "오늘 할 일"의 하루 여러 번 투약 카드
 *
 * 안약 A · 1방울
 *   ✓ 08:00   완료
 *   ○ 13:00   [완료]
 */
export function MedicationGroupCard({
  dueDate,
  schedules,
  todayDateString,
  completingScheduleId,
  disabled,
  onComplete,
  onLayout,
}: MedicationGroupCardProps) {
  const firstSchedule = schedules[0];

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <ScheduleTypeIcon type="MEDICATION" />
        </View>

        <View style={styles.title}>
          <AppText variant="body1">
            {firstSchedule.name}
            {firstSchedule.dosageText ? ` · ${firstSchedule.dosageText}` : ''}
          </AppText>

          <AppText variant="label" color="tertiary" style={styles.subText}>
            {dueDate < todayDateString ? '놓친 일정' : '오늘 예정'}
          </AppText>
        </View>
      </View>

      <View style={styles.timeList}>
        {schedules.map((schedule) => {
          const completed = !!schedule.completedAt;

          return (
            <View key={schedule.id} style={styles.timeRow}>
              <View style={styles.timeInfo}>
                <View
                  style={[
                    styles.timeStatus,
                    completed && styles.timeStatusDone,
                  ]}
                >
                  <AppText
                    variant="label"
                    color={completed ? 'inverse' : 'secondary'}
                  >
                    {completed ? '✓' : ''}
                  </AppText>
                </View>

                <AppText
                  variant="body2"
                  color={completed ? 'tertiary' : 'primary'}
                >
                  {schedule.notificationTime ?? '시간 미정'}
                </AppText>
              </View>

              {completed ? (
                <AppText variant="label" color="tertiary">
                  완료
                </AppText>
              ) : (
                <Pressable
                  disabled={disabled}
                  style={[styles.completeButton, disabled && styles.disabled]}
                  onPress={() => onComplete(schedule)}
                >
                  <AppText variant="label" color="inverse">
                    {completingScheduleId === schedule.id ? '처리 중' : '완료'}
                  </AppText>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  title: {
    flex: 1,
    marginLeft: 12,
  },

  subText: {
    marginTop: 4,
  },

  timeList: {
    marginTop: 12,
    marginLeft: 52,
    gap: 4,
  },

  timeRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  timeStatus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[0],
  },

  timeStatusDone: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },

  completeButton: {
    minWidth: 52,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
  },

  disabled: {
    opacity: 0.5,
  },
});
