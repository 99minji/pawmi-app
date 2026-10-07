import {
  Bell,
  ChevronRight,
  HeartPulse,
  Hospital,
  Pill,
  Plus,
  ShieldCheck,
} from 'lucide-react-native';
import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { AnimatedPetAvatar } from '@/components/pet/AnimatedPetAvatar';
import { QuickRecordSheet } from '@/components/record/QuickRecordSheet';
import { colors } from '@/constants/colors';
import { petAvatars } from '@/constants/petAvatars';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareSchedule } from '@/types/care';
import { addRepeatToDate } from '@/utils/care';
import { getHealthInsight, hasRecentRecord } from '@/utils/healthInsight';
import { createId } from '@/utils/id';
import {
  cancelCareNotification,
  DEFAULT_NOTIFICATION_TIME,
  scheduleCareNotification,
} from '@/utils/notification';
import { formatGender, formatPetAge } from '@/utils/pet';
import BottomSheet from '@gorhom/bottom-sheet';

const renderScheduleIcon = (type: CareSchedule['type']) => {
  switch (type) {
    case 'VACCINATION':
      return <ShieldCheck size={20} color={colors.primary[700]} />;

    case 'MEDICATION':
      return <Pill size={20} color={colors.primary[700]} />;

    case 'HEARTWORM':
      return <HeartPulse size={20} color={colors.primary[700]} />;

    case 'CHECKUP':
      return <Hospital size={20} color={colors.primary[700]} />;
  }
};

const getScheduleTitle = (schedule: CareSchedule) => {
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
};

export default function TodayScreen() {
  const pet = usePetStore((state) => state.pet);

  const allRecords = useHealthStore((state) => state.records);

  const addRecord = useHealthStore((state) => state.addRecord);

  const schedules = useCareScheduleStore((state) => state.schedules);

  const addSchedule = useCareScheduleStore((state) => state.addSchedule);

  const updateSchedule = useCareScheduleStore((state) => state.updateSchedule);

  const completeSchedule = useCareScheduleStore(
    (state) => state.completeSchedule,
  );

  const quickRecordSheetRef = useRef<BottomSheet>(null);

  /**
   * 현재 반려동물의 건강 기록
   */
  const records = useMemo(
    () => allRecords.filter((record) => record.petId === pet?.id),
    [allRecords, pet?.id],
  );

  const healthInsight = useMemo(() => getHealthInsight(records), [records]);

  /**
   * 최근 24시간 동안 건강 기록이 있는지
   *
   * 있으면 아바타를 care 상태로 보여준다.
   */
  const hasRecentCareRecord = useMemo(
    () => hasRecentRecord(records),
    [records],
  );

  const todayDateString = useMemo(() => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, '0');

    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }, []);

  /**
   * 오늘 해야 할 관리 일정
   */
  const todaySchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          schedule.petId === pet?.id &&
          schedule.dueDate === todayDateString &&
          !schedule.completedAt,
      ),
    [schedules, pet?.id, todayDateString],
  );

  const openQuickRecordSheet = () => {
    quickRecordSheetRef.current?.expand();
  };

  /**
   * 오늘 할 일 완료
   *
   * 1. CareSchedule 완료 처리
   * 2. 실제 수행 이력을 HealthRecord에 남김
   * 3. 반복 일정이면 다음 일정과 알림을 등록
   */
  const handleCompleteSchedule = async (schedule: CareSchedule) => {
    if (!pet) {
      return;
    }

    const now = new Date().toISOString();

    completeSchedule(schedule.id);

    try {
      await cancelCareNotification(schedule.notificationId);
    } catch (error) {
      console.warn('알림 취소에 실패했어요.', error);
    }

    if (schedule.type === 'VACCINATION') {
      addRecord({
        id: createId('vaccination'),
        petId: pet.id,
        type: 'VACCINATION',
        title: `${schedule.name} 예방`,
        vaccinationName: schedule.name,
        occurredAt: now,
        createdAt: now,
      });
    }

    if (!schedule.repeat) {
      return;
    }

    const nextDueDate = addRepeatToDate(schedule.dueDate, schedule.repeat);

    const nextScheduleId = createId('care');

    const notificationEnabled = schedule.notificationEnabled ?? true;

    const notificationTime =
      schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME;

    addSchedule({
      id: nextScheduleId,
      petId: schedule.petId,
      type: schedule.type,
      name: schedule.name,
      dueDate: nextDueDate,
      repeat: schedule.repeat,
      notificationEnabled,
      notificationTime,
      createdAt: now,
    });

    if (!notificationEnabled) {
      return;
    }

    const notificationId = await scheduleCareNotification({
      scheduleId: nextScheduleId,
      petName: pet.name,
      careName: schedule.name,
      dueDate: nextDueDate,
      notificationTime,
    });

    if (notificationId) {
      updateSchedule(nextScheduleId, { notificationId });
    }
  };

  if (!pet) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          반려동물 정보를 불러오고 있어요.
        </AppText>
      </View>
    );
  }

  /**
   * 아바타 상태
   */
  const avatarSource = hasRecentCareRecord
    ? petAvatars.POMERANIAN.care
    : petAvatars.POMERANIAN.idleBody;

  const tailSource = hasRecentCareRecord
    ? undefined
    : petAvatars.POMERANIAN.idleTail;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleArea}>
              <AppText variant="label" color="brand" style={styles.heroEyebrow}>
                오늘의 포우미
              </AppText>

              <AppText variant="heading1">
                오늘도 {pet.name}의 하루를{'\n'}
                챙겨볼까요?
              </AppText>
            </View>

            <Pressable style={styles.iconButton}>
              <Bell size={22} color={colors.neutral[800]} />
            </Pressable>
          </View>

          <View style={styles.avatarArea}>
            <View style={styles.avatarGlow} />

            <AnimatedPetAvatar
              size={220}
              source={avatarSource}
              tailSource={tailSource}
            />
          </View>

          <View style={styles.petSummary}>
            <View style={styles.petSummaryText}>
              <AppText variant="heading2">{pet.name}</AppText>

              <AppText
                variant="body2"
                color="secondary"
                style={styles.petDescription}
              >
                {pet.breed ?? '포메라니안'} · {formatPetAge(pet)} ·{' '}
                {formatGender(pet.gender)}
              </AppText>
            </View>

            <Pressable style={styles.profileButton}>
              <ChevronRight size={20} color={colors.primary[700]} />
            </Pressable>
          </View>
        </View>

        {/* 오늘 할 일 */}
        <AppText variant="heading2" style={styles.sectionTitle}>
          오늘 할 일
        </AppText>

        {todaySchedules.length > 0 ? (
          <View style={styles.taskList}>
            {todaySchedules.map((schedule) => (
              <View key={schedule.id} style={styles.taskCard}>
                <View style={styles.taskIcon}>
                  {renderScheduleIcon(schedule.type)}
                </View>

                <View style={styles.taskContent}>
                  <AppText variant="body1">
                    {getScheduleTitle(schedule)}
                  </AppText>

                  <AppText
                    variant="label"
                    color="tertiary"
                    style={styles.taskDescription}
                  >
                    오늘 예정
                  </AppText>
                </View>

                <Pressable
                  style={styles.completeButton}
                  onPress={() => handleCompleteSchedule(schedule)}
                >
                  <AppText variant="label" color="inverse">
                    완료
                  </AppText>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTaskCard}>
            <AppText variant="body2" color="secondary">
              오늘 예정된 관리가 없어요.
            </AppText>
          </View>
        )}

        {/* 최근 변화 */}
        <AppText variant="heading2" style={styles.sectionTitle}>
          최근 변화
        </AppText>

        <View style={styles.insightCard}>
          <HeartPulse size={22} color={colors.primary[700]} />

          <View style={styles.insightContent}>
            {healthInsight ? (
              <>
                <AppText variant="body1">{healthInsight.title}</AppText>

                <AppText
                  variant="body2"
                  color="secondary"
                  style={styles.insightDescription}
                >
                  {healthInsight.description}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="body1">아직 확인할 변화가 없어요</AppText>

                <AppText
                  variant="body2"
                  color="secondary"
                  style={styles.insightDescription}
                >
                  건강 기록을 쌓으면 변화를 정리해서 보여드릴게요.
                </AppText>
              </>
            )}
          </View>
        </View>

        {/* 빠른 기록 */}
        <AppText variant="heading2" style={styles.sectionTitle}>
          빠른 기록
        </AppText>

        <Pressable
          style={styles.quickRecordButton}
          onPress={openQuickRecordSheet}
        >
          <View style={styles.quickRecordIcon}>
            <Plus size={22} color={colors.primary[700]} />
          </View>

          <View style={styles.quickRecordContent}>
            <AppText variant="body1">건강 기록 추가하기</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.quickRecordDescription}
            >
              체중, 증상, 투약 등을 빠르게 남겨보세요.
            </AppText>
          </View>

          <ChevronRight size={20} color={colors.neutral[400]} />
        </Pressable>

        {/* 최근 기록 */}
        <AppText variant="heading2" style={styles.sectionTitle}>
          최근 기록
        </AppText>

        {records.length === 0 ? (
          <AppText variant="body2" color="secondary">
            아직 기록이 없어요.
          </AppText>
        ) : (
          <View style={styles.recentList}>
            {records.slice(0, 3).map((record) => (
              <View key={record.id} style={styles.recentRecord}>
                <AppText variant="body1">{record.title}</AppText>

                <AppText variant="body2" color="secondary">
                  {new Date(record.occurredAt).toLocaleDateString('ko-KR')}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <QuickRecordSheet ref={quickRecordSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
  },

  hero: {
    backgroundColor: colors.primary[50],
    borderRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    marginBottom: 32,
    overflow: 'hidden',
  },

  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },

  heroTitleArea: {
    flex: 1,
  },

  heroEyebrow: {
    marginBottom: 8,
  },

  avatarArea: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  avatarGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary[100],
  },

  petSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  petSummaryText: {
    flex: 1,
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },

  petDescription: {
    marginTop: 4,
  },

  sectionTitle: {
    marginBottom: 12,
    marginTop: 4,
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 16,
  },

  taskList: {
    gap: 10,
    marginBottom: 28,
  },

  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  taskContent: {
    flex: 1,
    marginLeft: 12,
  },

  taskDescription: {
    marginTop: 4,
  },

  emptyTaskCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
  },

  completeButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
  },

  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary[100],
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },

  insightContent: {
    flex: 1,
    marginLeft: 12,
  },

  insightDescription: {
    marginTop: 4,
  },

  recentList: {
    gap: 10,
  },

  recentRecord: {
    backgroundColor: colors.neutral[0],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
    gap: 4,
  },

  quickRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral[0],
    marginBottom: 28,
  },

  quickRecordIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  quickRecordContent: {
    flex: 1,
    marginLeft: 12,
  },

  quickRecordDescription: {
    marginTop: 4,
  },
});
