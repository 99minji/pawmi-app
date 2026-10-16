import BottomSheet from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MedicationGroupCard } from '@/components/care/MedicationGroupCard';
import { TodayTaskCard } from '@/components/care/TodayTaskCard';
import { AppText } from '@/components/common/AppText';
import { AnimatedPetAvatar } from '@/components/pet/AnimatedPetAvatar';
import { QuickRecordSheet } from '@/components/record/QuickRecordSheet';
import { colors } from '@/constants/colors';
import { getPetAvatar, restSleepSource } from '@/constants/petAvatars';
import { useIsNightTime } from '@/hooks/useIsNightTime';
import { useTodayDateString } from '@/hooks/useTodayDateString';
import { completeCareSchedule } from '@/services/care';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareSchedule, CareSuggestion } from '@/types/care';
import { addRepeatToDate } from '@/utils/care';
import { getCareSuggestions } from '@/utils/careEngine';
import { dateToOccurredAt, toDateString } from '@/utils/date';
import { getCareAvatarEndTime } from '@/utils/healthInsight';
import {
  cancelCareNotification,
  DEFAULT_NOTIFICATION_TIME,
  scheduleCareNotification,
} from '@/utils/notification';
import { formatBreed, formatGender, formatPetAge } from '@/utils/pet';
import { buildTodayItems, getActiveSchedules } from '@/utils/todaySchedule';

// 스크롤 후 카드 위에 남겨둘 여백
const SCROLL_TOP_OFFSET = 24;

// 아바타를 탭했을 때 happy 상태를 보여주는 시간
const TAP_HAPPY_DURATION = 3000;

// 완료 처리 후 모든 완료 버튼을 잠가두는 시간
const COMPLETE_LOCK_DURATION = 800;

type AvatarState = 'idle' | 'happy' | 'care' | 'rest' | 'sick';

// 개발 중 아바타 상태 확인용. 확인이 끝나면 null로 되돌린다. (프로덕션에서는 항상 무시)
const DEBUG_AVATAR_STATE: AvatarState | null = null;

export default function TodayScreen() {
  // ─────────────────────────────────────────────
  // Store
  // ─────────────────────────────────────────────
  const pet = usePetStore((state) => state.pet);

  const allRecords = useHealthStore((state) => state.records);
  const addRecord = useHealthStore((state) => state.addRecord);

  const schedules = useCareScheduleStore((state) => state.schedules);
  const replaceSchedule = useCareScheduleStore(
    (state) => state.replaceSchedule,
  );
  const addScheduleFromDb = useCareScheduleStore(
    (state) => state.addScheduleFromDb,
  );

  const pendingScheduleId = useNotificationStore(
    (state) => state.pendingScheduleId,
  );
  const clearPendingScheduleId = useNotificationStore(
    (state) => state.clearPendingScheduleId,
  );

  const todayDateString = useTodayDateString();
  const isNightTime = useIsNightTime();

  const quickRecordSheetRef = useRef<BottomSheet>(null);

  // ─────────────────────────────────────────────
  // 데이터 가공
  // ─────────────────────────────────────────────

  // 현재 반려동물의 건강 기록
  const records = useMemo(
    () => allRecords.filter((record) => record.petId === pet?.id),
    [allRecords, pet?.id],
  );

  // 오늘 해야 할(오늘 예정 + 놓친) 미완료 일정
  const activeSchedules = useMemo(
    () => getActiveSchedules(schedules, pet?.id, todayDateString),
    [schedules, pet?.id, todayDateString],
  );

  // 화면에 그릴 단위 (일반 카드 / 하루 여러 번 투약 묶음 카드)
  const todayItems = useMemo(
    () => buildTodayItems(activeSchedules, schedules, pet?.id),
    [activeSchedules, schedules, pet?.id],
  );

  const careSuggestions = useMemo(
    () => (pet ? getCareSuggestions({ pet, records, schedules }) : []),
    [pet, records, schedules],
  );

  // ─────────────────────────────────────────────
  // 아바타 상태
  // ─────────────────────────────────────────────

  // 건강 기록을 남긴 뒤 1분 동안 아바타를 care 상태로 보여준다.
  const careAvatarEndTime = useMemo(
    () => getCareAvatarEndTime(records),
    [records],
  );

  // 종료 시각이 되면 다시 그려서 idle 상태로 되돌린다.
  const [expiredCareAvatarEndTime, setExpiredCareAvatarEndTime] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (careAvatarEndTime === null) {
      return;
    }

    const timer = setTimeout(
      () => setExpiredCareAvatarEndTime(careAvatarEndTime),
      careAvatarEndTime - Date.now(),
    );

    return () => clearTimeout(timer);
  }, [careAvatarEndTime]);

  const isCareAvatar =
    careAvatarEndTime !== null &&
    careAvatarEndTime !== expiredCareAvatarEndTime;

  // 오늘 완료한 일정이 있고 남은 일정이 없으면 happy 상태로 보여준다.
  const hasCompletedAllToday = useMemo(
    () =>
      activeSchedules.length === 0 &&
      schedules.some(
        (schedule) =>
          schedule.petId === pet?.id &&
          !!schedule.completedAt &&
          toDateString(new Date(schedule.completedAt)) === todayDateString,
      ),
    [activeSchedules, schedules, pet?.id, todayDateString],
  );

  // 아바타를 탭하면 잠깐 happy 상태로 반응한다.
  const [isTapHappy, setIsTapHappy] = useState(false);

  const tapHappyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tapHappyTimerRef.current) {
        clearTimeout(tapHappyTimerRef.current);
      }
    };
  }, []);

  const handleAvatarPress = () => {
    if (tapHappyTimerRef.current) {
      clearTimeout(tapHappyTimerRef.current);
    }

    setIsTapHappy(true);

    tapHappyTimerRef.current = setTimeout(
      () => setIsTapHappy(false),
      TAP_HAPPY_DURATION,
    );
  };

  // ─────────────────────────────────────────────
  // 알림으로 진입한 일정 카드로 스크롤
  // ─────────────────────────────────────────────
  const scrollViewRef = useRef<ScrollView>(null);

  // 카드 위치를 찾기 위한 레이아웃 정보
  const taskListYRef = useRef<number | null>(null);
  const taskCardYRef = useRef<Record<string, number>>({});

  // 목록과 카드의 레이아웃이 모두 잡힌 뒤에만 스크롤하고 대기 상태를 비운다.
  const scrollToPendingSchedule = useCallback(() => {
    if (!pendingScheduleId) {
      return;
    }

    const taskListY = taskListYRef.current;
    const taskCardY = taskCardYRef.current[pendingScheduleId];

    if (taskListY === null || taskCardY === undefined) {
      return;
    }

    scrollViewRef.current?.scrollTo({
      y: Math.max(taskListY + taskCardY - SCROLL_TOP_OFFSET, 0),
      animated: true,
    });

    clearPendingScheduleId();
  }, [pendingScheduleId, clearPendingScheduleId]);

  useEffect(() => {
    if (!pendingScheduleId || !pet) {
      return;
    }

    // 오늘 할 일에 없는 일정(완료됐거나 날짜가 지난 일정)이면 스크롤하지 않는다.
    if (
      !activeSchedules.some((schedule) => schedule.id === pendingScheduleId)
    ) {
      clearPendingScheduleId();
      return;
    }

    // 앱 실행 중 알림을 누른 경우 이미 레이아웃이 잡혀 있으므로 바로 스크롤한다.
    scrollToPendingSchedule();
  }, [
    pendingScheduleId,
    pet,
    activeSchedules,
    clearPendingScheduleId,
    scrollToPendingSchedule,
  ]);

  // 카드 레이아웃이 잡히면 위치를 기록한다. (묶음 카드는 그룹 내 모든 일정이 같은 위치)
  const registerCardLayout = (scheduleIds: string[], y: number) => {
    scheduleIds.forEach((id) => {
      taskCardYRef.current[id] = y;
    });

    scrollToPendingSchedule();
  };

  // ─────────────────────────────────────────────
  // 오늘 할 일 완료
  // ─────────────────────────────────────────────
  const [completingScheduleId, setCompletingScheduleId] = useState<
    string | null
  >(null);

  // 완료 버튼 연타 시 state 반영 전에 두 번째 요청이 들어가지 않도록 즉시 잠근다.
  const completingRef = useRef(false);

  // 완료 직후 다음 회차 카드가 같은 자리에 나타나 연타로 함께 완료되지 않도록
  // 모든 완료 버튼을 잠깐 잠근다.
  const [isCompleteLocked, setIsCompleteLocked] = useState(false);

  const completeUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (completeUnlockTimerRef.current) {
        clearTimeout(completeUnlockTimerRef.current);
      }
    };
  }, []);

  /**
   * 완료 처리, HealthRecord 생성, 반복 일정의 다음 일정 생성은
   * DB 트랜잭션 하나(complete_care_schedule RPC)로 처리한다.
   * 이미 완료된 일정이면 DB가 아무것도 만들지 않는다.
   */
  const handleCompleteSchedule = async (schedule: CareSchedule) => {
    if (!pet || completingRef.current) {
      return;
    }

    completingRef.current = true;
    setIsCompleteLocked(true);
    setCompletingScheduleId(schedule.id);

    try {
      // 다음 예정일은 실제 완료일이 아니라 기존 dueDate 기준으로 계산
      const nextDueDate = schedule.repeat
        ? addRepeatToDate(
            schedule.dueDate,
            schedule.repeat,
            schedule.repeatAnchorDay,
          )
        : null;

      const result = await completeCareSchedule(
        schedule.id,
        dateToOccurredAt(new Date()),
        nextDueDate,
      );

      replaceSchedule(result.schedule);

      if (result.record) {
        addRecord(result.record);
      }

      if (result.next) {
        addScheduleFromDb(result.next);
      }

      // 알림 처리는 DB 반영 이후라 실패해도 완료 자체는 유지된다.
      try {
        await cancelCareNotification(schedule.id);

        if (result.next?.notificationEnabled) {
          await scheduleCareNotification({
            scheduleId: result.next.id,
            petName: pet.name,
            careName: result.next.name,
            dueDate: result.next.dueDate,
            notificationTime:
              result.next.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
          });
        }
      } catch (error) {
        console.log('COMPLETE CARE NOTIFICATION ERROR:', error);
      }
    } catch (error) {
      console.log('COMPLETE CARE ERROR:', error);

      Alert.alert('완료 처리하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setCompletingScheduleId(null);

      completeUnlockTimerRef.current = setTimeout(() => {
        completingRef.current = false;
        setIsCompleteLocked(false);
      }, COMPLETE_LOCK_DURATION);
    }
  };

  // ─────────────────────────────────────────────
  // 기타 액션
  // ─────────────────────────────────────────────
  const openQuickRecordSheet = () => {
    quickRecordSheetRef.current?.expand();
  };

  const handleCareSuggestionAction = (suggestion: CareSuggestion) => {
    if (!suggestion.action) {
      return;
    }

    switch (suggestion.action.type) {
      case 'CREATE_CARE':
        router.push({
          pathname: '/care/create',
          params: {
            type: suggestion.action.careType,
          },
        });
        break;

      case 'CREATE_WEIGHT_RECORD':
        router.push('/record/weight');
        break;
    }
  };

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  if (!pet) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          반려동물 정보를 불러오고 있어요.
        </AppText>
      </View>
    );
  }

  const avatar = getPetAvatar(pet.avatarBreed);

  // 우선순위: 탭 반응 > 건강 기록 직후(care) > 밤 시간(rest) > 오늘 할 일 완료(happy) > idle
  const avatarState: AvatarState =
    __DEV__ && DEBUG_AVATAR_STATE
      ? DEBUG_AVATAR_STATE
      : isTapHappy
        ? 'happy'
        : isCareAvatar
          ? 'care'
          : isNightTime
            ? 'rest'
            : hasCompletedAllToday
              ? 'happy'
              : 'idle';

  const avatarSource = {
    happy: avatar.happy,
    care: avatar.care,
    rest: avatar.rest,
    sick: avatar.sick,
    idle: avatar.idleBody,
  }[avatarState];

  const tailSource = avatarState === 'idle' ? avatar.idleTail : undefined;

  const sleepSource = avatarState === 'rest' ? restSleepSource : undefined;

  // 상태가 바뀌는 순간 한 번 통통 튀는 반응
  const avatarReaction = isTapHappy ? 'happy' : isCareAvatar ? 'care' : 'idle';

  const primarySuggestion = careSuggestions[0];

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
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
          </View>

          <View style={styles.avatarArea}>
            <View style={styles.avatarGlow} />

            <Pressable onPress={handleAvatarPress}>
              <AnimatedPetAvatar
                size={220}
                source={avatarSource}
                tailSource={tailSource}
                tailLayout={avatar.tailLayout}
                sleepSource={sleepSource}
                reaction={avatarReaction}
              />
            </Pressable>
          </View>

          <View style={styles.petSummary}>
            <View style={styles.petSummaryText}>
              <AppText variant="heading2">{pet.name}</AppText>

              <AppText
                variant="body2"
                color="secondary"
                style={styles.petDescription}
              >
                {formatBreed(pet)} · {formatPetAge(pet)} ·{' '}
                {formatGender(pet.gender)}
              </AppText>
            </View>

            <Pressable
              style={styles.profileButton}
              onPress={() => router.push('/pet/edit')}
            >
              <ChevronRight size={20} color={colors.primary[700]} />
            </Pressable>
          </View>
        </View>

        {/* 오늘 할 일 */}
        <AppText variant="heading2" style={styles.sectionTitle}>
          오늘 할 일
        </AppText>

        {todayItems.length > 0 ? (
          <View
            style={styles.taskList}
            onLayout={(event) => {
              taskListYRef.current = event.nativeEvent.layout.y;

              scrollToPendingSchedule();
            }}
          >
            {todayItems.map((item) =>
              item.kind === 'MEDICATION_GROUP' ? (
                <MedicationGroupCard
                  key={item.key}
                  dueDate={item.dueDate}
                  schedules={item.schedules}
                  todayDateString={todayDateString}
                  completingScheduleId={completingScheduleId}
                  disabled={isCompleteLocked}
                  onComplete={handleCompleteSchedule}
                  onLayout={(event) =>
                    registerCardLayout(
                      item.schedules.map((schedule) => schedule.id),
                      event.nativeEvent.layout.y,
                    )
                  }
                  onPress={() => {
                    const groupId = item.schedules[0]?.scheduleGroupId;

                    if (!groupId) {
                      return;
                    }

                    router.push({
                      pathname: '/care/group/[groupId]',
                      params: {
                        groupId,
                        dueDate: item.dueDate,
                      },
                    });
                  }}
                />
              ) : (
                <TodayTaskCard
                  key={item.key}
                  schedule={item.schedule}
                  todayDateString={todayDateString}
                  isCompleting={completingScheduleId === item.schedule.id}
                  disabled={isCompleteLocked}
                  onComplete={handleCompleteSchedule}
                  onLayout={(event) =>
                    registerCardLayout(
                      [item.schedule.id],
                      event.nativeEvent.layout.y,
                    )
                  }
                />
              ),
            )}
          </View>
        ) : (
          <View style={styles.emptyTaskCard}>
            <AppText variant="body2" color="secondary">
              오늘 예정된 관리가 없어요.
            </AppText>

            <AppText
              variant="label"
              color="tertiary"
              style={styles.taskDescription}
            >
              관리 일정은 반려동물 탭에서 예약할 수 있어요.
            </AppText>
          </View>
        )}

        {primarySuggestion && (
          <View style={styles.careSuggestionCard}>
            <AppText variant="label" color="brand">
              포우미가 챙겨봤어요
            </AppText>

            <AppText variant="body1" style={styles.careSuggestionTitle}>
              {primarySuggestion.title}
            </AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.careSuggestionDescription}
            >
              {primarySuggestion.description}
            </AppText>

            {primarySuggestion.action && (
              <Pressable
                style={styles.careSuggestionAction}
                onPress={() => handleCareSuggestionAction(primarySuggestion)}
              >
                <AppText variant="label" color="brand">
                  {primarySuggestion.action.type === 'CREATE_CARE'
                    ? '일정 추가하기'
                    : '기록 남기기'}
                </AppText>
              </Pressable>
            )}
          </View>
        )}

        {/* 건강 기록 */}
        <AppText variant="heading2" style={styles.sectionTitle}>
          건강 기록
        </AppText>

        <Pressable
          style={styles.quickRecordButton}
          onPress={openQuickRecordSheet}
        >
          <View style={styles.quickRecordIcon}>
            <Plus size={22} color={colors.primary[700]} />
          </View>

          <View style={styles.quickRecordContent}>
            <AppText variant="body1">건강 기록 남기기</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.quickRecordDescription}
            >
              체중, 증상, 투약 등 이미 있었던 일을 기록해요.
            </AppText>
          </View>

          <ChevronRight size={20} color={colors.neutral[400]} />
        </Pressable>
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

  taskList: {
    gap: 10,
    marginBottom: 28,
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

  careSuggestionCard: {
    marginBottom: 28,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },

  careSuggestionTitle: {
    marginTop: 8,
  },

  careSuggestionDescription: {
    marginTop: 6,
  },

  careSuggestionAction: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.primary[100],
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
