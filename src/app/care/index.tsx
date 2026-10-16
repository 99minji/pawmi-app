import { router } from 'expo-router';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScheduleTypeIcon } from '@/components/care/ScheduleTypeIcon';
import { AppText } from '@/components/common/AppText';
import { colors } from '@/constants/colors';
import { useTodayDateString } from '@/hooks/useTodayDateString';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareRepeat } from '@/types/care';
import { formatScheduleType } from '@/utils/care';
import { formatKoreanTime, parseDateString } from '@/utils/date';
import { buildTodayItems, type TodayScheduleItem } from '@/utils/todaySchedule';

export default function CareListScreen() {
  const pet = usePetStore((state) => state.pet);

  const schedules = useCareScheduleStore((state) => state.schedules);

  const todayDateString = useTodayDateString();

  /**
   * 현재 반려동물의 전체 일정을 화면 단위로 묶어
   * 남은 회차가 있는 일정과 모두 완료한 일정으로 나눈다.
   *
   * 하루 여러 번 투약은 Today 화면과 같은 기준(groupId:dueDate)으로 한 칸에 묶는다.
   */
  const { upcomingItems, completedItems } = useMemo(() => {
    const petSchedules = schedules
      .filter((schedule) => schedule.petId === pet?.id)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const items = buildTodayItems(petSchedules, schedules, pet?.id);

    const upcoming: TodayScheduleItem[] = [];
    const completed: TodayScheduleItem[] = [];

    for (const item of items) {
      if (getItemSchedules(item).some((schedule) => !schedule.completedAt)) {
        upcoming.push(item);
      } else {
        completed.push(item);
      }
    }

    // 완료한 일정은 최근 회차부터
    completed.reverse();

    return { upcomingItems: upcoming, completedItems: completed };
  }, [schedules, pet?.id]);

  const openCareCreate = () => {
    router.push('/care/create');
  };

  const openItem = (item: TodayScheduleItem) => {
    if (item.kind === 'SINGLE') {
      router.push({
        pathname: '/care/[id]',
        params: { id: item.schedule.id },
      });
      return;
    }

    const groupId = item.schedules[0]?.scheduleGroupId;

    if (!groupId) {
      return;
    }

    router.push({
      pathname: '/care/group/[groupId]',
      params: { groupId, dueDate: item.dueDate },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.neutral[800]} />
          </Pressable>

          <AppText variant="heading1">예정된 관리</AppText>
        </View>

        <Pressable
          style={styles.addScheduleButton}
          onPress={openCareCreate}
          hitSlop={8}
        >
          <Plus size={16} color={colors.primary[700]} />

          <AppText variant="label" color="brand">
            일정 추가
          </AppText>
        </Pressable>
      </View>

      <AppText variant="body1" color="secondary" style={styles.description}>
        {pet ? `${pet.name}의 ` : ''}관리 일정을 확인하고 수정할 수 있어요.
      </AppText>

      {/* 예정된 일정 */}
      <AppText variant="heading2" style={styles.sectionTitle}>
        예정된 일정
      </AppText>

      {upcomingItems.length > 0 ? (
        <View style={styles.scheduleList}>
          {upcomingItems.map((item) => (
            <ScheduleRow
              key={item.key}
              item={item}
              todayDateString={todayDateString}
              onPress={() => openItem(item)}
            />
          ))}
        </View>
      ) : (
        <Pressable style={styles.emptyScheduleCard} onPress={openCareCreate}>
          <View style={styles.emptyScheduleIcon}>
            <CalendarDays size={22} color={colors.primary[700]} />
          </View>

          <View style={styles.emptyText}>
            <AppText variant="body1">예정된 관리가 없어요</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.emptyDescription}
            >
              심장사상충, 접종, 검진 일정을 등록해두면 앞으로의 관리를 한눈에
              확인할 수 있어요.
            </AppText>
          </View>

          <ChevronRight size={18} color={colors.neutral[400]} />
        </Pressable>
      )}

      {/* 완료한 일정 */}
      {completedItems.length > 0 && (
        <>
          <AppText variant="heading2" style={styles.sectionTitle}>
            완료한 일정
          </AppText>

          <View style={styles.scheduleList}>
            {completedItems.map((item) => (
              <ScheduleRow
                key={item.key}
                item={item}
                todayDateString={todayDateString}
                onPress={() => openItem(item)}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function ScheduleRow({
  item,
  todayDateString,
  onPress,
}: {
  item: TodayScheduleItem;
  todayDateString: string;
  onPress: () => void;
}) {
  const itemSchedules = getItemSchedules(item);
  const baseSchedule = itemSchedules[0];

  const isCompleted = itemSchedules.every((schedule) => !!schedule.completedAt);
  const isOverdue = !isCompleted && baseSchedule.dueDate < todayDateString;

  // 묶음 투약은 시간 목록을, 일반 일정은 종류를 함께 보여준다.
  const detail =
    item.kind === 'MEDICATION_GROUP'
      ? item.schedules
          .map((schedule) =>
            schedule.notificationTime
              ? formatKoreanTime(schedule.notificationTime)
              : null,
          )
          .filter(Boolean)
          .join(' · ')
      : formatScheduleType(baseSchedule.type);

  return (
    <Pressable
      style={({ pressed }) => [styles.scheduleCard, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View
        style={[styles.scheduleIcon, isCompleted && styles.scheduleIconDone]}
      >
        <ScheduleTypeIcon type={baseSchedule.type} />
      </View>

      <View style={styles.scheduleContent}>
        <AppText variant="body1">{baseSchedule.name}</AppText>

        <AppText variant="body2" color="secondary" style={styles.scheduleDate}>
          {formatScheduleDate(baseSchedule.dueDate)}
          {detail ? ` · ${detail}` : ''}
        </AppText>
      </View>

      <View style={styles.scheduleRight}>
        {isCompleted ? (
          <View style={styles.statusBadge}>
            <AppText variant="label" color="tertiary">
              완료
            </AppText>
          </View>
        ) : isOverdue ? (
          <View style={styles.overdueBadge}>
            <AppText variant="label" style={styles.overdueText}>
              지난 일정
            </AppText>
          </View>
        ) : (
          baseSchedule.repeat && (
            <View style={styles.repeatBadge}>
              <AppText variant="label" color="brand">
                {formatRepeat(baseSchedule.repeat)}
              </AppText>
            </View>
          )
        )}

        <ChevronRight size={18} color={colors.neutral[400]} />
      </View>
    </Pressable>
  );
}

function getItemSchedules(item: TodayScheduleItem) {
  return item.kind === 'SINGLE' ? [item.schedule] : item.schedules;
}

function formatScheduleDate(dateString: string) {
  return parseDateString(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRepeat(repeat: CareRepeat) {
  switch (repeat.unit) {
    case 'DAY':
      return repeat.interval === 1 ? '매일' : `${repeat.interval}일마다`;

    case 'WEEK':
      return repeat.interval === 1 ? '매주' : `${repeat.interval}주마다`;

    case 'MONTH':
      return repeat.interval === 1 ? '매월' : `${repeat.interval}개월마다`;

    case 'YEAR':
      return repeat.interval === 1 ? '매년' : `${repeat.interval}년마다`;
  }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  backButton: {
    width: 32,
    height: 40,
    justifyContent: 'center',
    marginLeft: -6,
  },

  description: {
    marginTop: 8,
    marginBottom: 28,
  },

  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primary[50],
  },

  sectionTitle: {
    marginBottom: 12,
  },

  scheduleList: {
    gap: 10,
    marginBottom: 32,
  },

  scheduleCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
  },

  pressed: {
    opacity: 0.6,
  },

  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  scheduleIconDone: {
    backgroundColor: colors.neutral[100],
  },

  scheduleContent: {
    flex: 1,
    marginLeft: 12,
  },

  scheduleDate: {
    marginTop: 4,
  },

  scheduleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },

  repeatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
  },

  overdueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.warning[50],
  },

  overdueText: {
    color: colors.neutral[700],
  },

  emptyScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
    marginBottom: 32,
  },

  emptyScheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  emptyText: {
    flex: 1,
  },

  emptyDescription: {
    marginTop: 4,
  },
});
