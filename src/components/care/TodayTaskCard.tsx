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

type TodayTaskCardProps = {
  schedule: CareSchedule;
  todayDateString: string;
  // 이 카드가 지금 완료 처리 중인지
  isCompleting: boolean;
  // 완료 버튼 전체 잠금
  disabled: boolean;
  onComplete: (schedule: CareSchedule) => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

/**
 * 홈 "오늘 할 일"의 일반 일정 카드
 */
export function TodayTaskCard({
  schedule,
  todayDateString,
  isCompleting,
  disabled,
  onComplete,
  onLayout,
}: TodayTaskCardProps) {
  const isOverdue = schedule.dueDate < todayDateString;

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.icon}>
        <ScheduleTypeIcon type={schedule.type} />
      </View>

      <View style={styles.content}>
        <AppText variant="body1">{getScheduleTitle(schedule)}</AppText>

        {schedule.type === 'MEDICATION' && schedule.dosageText && (
          <AppText variant="body2" color="secondary" style={styles.subText}>
            복용량 {schedule.dosageText}
          </AppText>
        )}

        <AppText
          variant="label"
          color={isOverdue ? 'error' : 'tertiary'}
          style={styles.subText}
        >
          {isOverdue ? '놓친 일정' : '오늘 예정'}
        </AppText>
      </View>

      <Pressable
        style={[styles.completeButton, isCompleting && styles.disabled]}
        disabled={disabled}
        onPress={() => onComplete(schedule)}
      >
        <AppText variant="label" color="inverse">
          {isCompleting ? '처리 중' : '완료'}
        </AppText>
      </Pressable>
    </View>
  );
}

function getScheduleTitle(schedule: CareSchedule) {
  switch (schedule.type) {
    case 'VACCINATION':
      return `${schedule.name} 예방하는 날이에요`;

    case 'MEDICATION':
      return `${schedule.name} 먹이는 날이에요`;

    case 'HEARTWORM':
      return `${schedule.name} 예방하는 날이에요`;

    case 'CHECKUP':
      return `${schedule.name} 확인하는 날이에요`;

    default:
      return `${schedule.name} 관리하는 날이에요`;
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 16,
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  content: {
    flex: 1,
    marginLeft: 12,
  },

  subText: {
    marginTop: 4,
  },

  completeButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
  },

  disabled: {
    opacity: 0.5,
  },
});
