import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Check, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { CustomRepeatInput } from '@/components/care/CustomRepeatInput';
import { MedicationNotificationSetting } from '@/components/care/MedicationNotificationSetting';
import { MedicationTimeList } from '@/components/care/MedicationTimeList';
import { RepeatSelector } from '@/components/care/RepeatSelector';
import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';

import { colors } from '@/constants/colors';

import { useCareScheduleStore } from '@/stores/useCareScheduleStore';

import type { CareRepeat, CareSchedule, RepeatUnit } from '@/types/care';

import {
  createCareSchedules,
  deleteCareScheduleById,
  updateCareScheduleById,
} from '@/services/care';
import { usePetStore } from '@/stores/usePetStore';
import {
  getRepeatFromPreset,
  getRepeatOptions,
  getRepeatPreset,
  parseCustomRepeat,
  type RepeatPreset,
} from '@/utils/care';
import {
  cancelCareNotification,
  DEFAULT_NOTIFICATION_TIME,
  scheduleCareNotification,
} from '@/utils/notification';

export default function CareGroupDetailScreen() {
  const { groupId, dueDate } = useLocalSearchParams<{
    groupId: string;
    dueDate: string;
  }>();

  const schedules = useCareScheduleStore((state) => state.schedules);

  const groupSchedules = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          schedule.scheduleGroupId === groupId && schedule.dueDate === dueDate,
      )
      .sort((a, b) =>
        (a.notificationTime ?? '').localeCompare(b.notificationTime ?? ''),
      );
  }, [schedules, groupId, dueDate]);

  if (groupSchedules.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          복약 일정을 찾을 수 없어요.
        </AppText>
      </View>
    );
  }

  return (
    <CareGroupDetailForm
      key={`${groupId}-${dueDate}`}
      groupId={groupId}
      dueDate={dueDate}
      schedules={groupSchedules}
    />
  );
}

function CareGroupDetailForm({
  groupId,
  dueDate,
  schedules: groupSchedules,
}: {
  groupId: string;
  dueDate: string;
  schedules: CareSchedule[];
}) {
  const baseSchedule =
    groupSchedules.find((schedule) => !schedule.completedAt) ??
    groupSchedules[0];

  const pet = usePetStore((state) => state.pet);

  const replaceSchedule = useCareScheduleStore(
    (state) => state.replaceSchedule,
  );

  const addScheduleFromDb = useCareScheduleStore(
    (state) => state.addScheduleFromDb,
  );

  const removeScheduleFromStore = useCareScheduleStore(
    (state) => state.removeScheduleFromStore,
  );

  const allSchedules = useCareScheduleStore((state) => state.schedules);

  // ─────────────────────────────────────────────
  // 폼 상태
  // ─────────────────────────────────────────────

  const [name, setName] = useState(baseSchedule.name);

  const [dosageText, setDosageText] = useState(baseSchedule.dosageText ?? '');

  /**
   * 현재 회차에 등록돼 있던 전체 시간을 초기값으로 사용한다.
   *
   * 완료된 시간도 포함하는 이유:
   * 이 값은 "앞으로 사용할 복약 시간"을 편집하는 폼이기 때문이다.
   *
   * 예:
   * 오늘 08:00 완료 / 13:00 / 20:00 미완료
   * → 폼 초기값은 08:00 / 13:00 / 20:00
   *
   * 여기서 사용자가 09:00 / 18:00으로 바꾸면
   * 완료된 오늘 08:00 기록은 그대로 두고
   * 미완료/미래 일정에 새 설정을 적용한다.
   */
  const [medicationTimes, setMedicationTimes] = useState(() =>
    Array.from(
      new Set(
        allSchedules
          .filter(
            (schedule) =>
              schedule.scheduleGroupId === groupId &&
              schedule.dueDate >= dueDate &&
              !schedule.completedAt,
          )
          .map((schedule) => schedule.notificationTime)
          .filter((time): time is string => !!time),
      ),
    ).sort(),
  );

  const savedPreset = getRepeatPreset(baseSchedule.repeat);

  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>(savedPreset);

  const [customRepeatInterval, setCustomRepeatInterval] = useState(() =>
    baseSchedule.repeat ? String(baseSchedule.repeat.interval) : '1',
  );

  const [customRepeatUnit, setCustomRepeatUnit] = useState<RepeatUnit>(
    baseSchedule.repeat?.unit ?? 'DAY',
  );

  const [notificationEnabled, setNotificationEnabled] = useState(
    baseSchedule.notificationEnabled,
  );

  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // 파생 값
  // ─────────────────────────────────────────────

  const completedSchedules = useMemo(
    () => groupSchedules.filter((schedule) => !!schedule.completedAt),
    [groupSchedules],
  );

  const pendingSchedules = useMemo(
    () => groupSchedules.filter((schedule) => !schedule.completedAt),
    [groupSchedules],
  );

  const repeat: CareRepeat | undefined =
    repeatPreset === 'CUSTOM'
      ? parseCustomRepeat(customRepeatInterval, customRepeatUnit)
      : getRepeatFromPreset(repeatPreset);

  const customRepeatValid = repeatPreset !== 'CUSTOM' || !!repeat;

  const medicationTimesValid = medicationTimes.length > 0;

  const isValid =
    name.trim().length > 0 && medicationTimesValid && customRepeatValid;

  const repeatOptions = getRepeatOptions(baseSchedule.type);

  // ─────────────────────────────────────────────
  // 저장
  // ─────────────────────────────────────────────

  const handleSave = async () => {
    if (!pet || !isValid || saving) {
      return;
    }

    setSaving(true);

    try {
      const times = [
        ...new Set(medicationTimes.map((time) => time.trim())),
      ].sort();

      const originalTimes = [
        ...new Set(
          groupSchedules
            .map((schedule) => schedule.notificationTime)
            .filter((time): time is string => !!time),
        ),
      ];

      const removedTimes = originalTimes.filter(
        (time) => !times.includes(time),
      );

      const futureSchedulesToDelete = allSchedules.filter(
        (schedule) =>
          schedule.scheduleGroupId === groupId &&
          schedule.dueDate > dueDate &&
          !schedule.completedAt &&
          !!schedule.notificationTime &&
          removedTimes.includes(schedule.notificationTime),
      );

      for (const schedule of futureSchedulesToDelete) {
        await deleteCareScheduleById(schedule.id);
        removeScheduleFromStore(schedule.id);

        try {
          await cancelCareNotification(schedule.id);
        } catch (error) {
          console.log('DELETE REMOVED TIME NOTIFICATION ERROR:', error);
        }
      }

      const pending = [...pendingSchedules].sort((a, b) =>
        (a.notificationTime ?? '').localeCompare(b.notificationTime ?? ''),
      );

      /**
       * 기존 미완료 일정과 새 시간을 앞에서부터 대응시킨다.
       *
       * 기존 3개 → 새 2개
       * update 2 + delete 1
       *
       * 기존 2개 → 새 3개
       * update 2 + create 1
       */
      const updateCount = Math.min(pending.length, times.length);

      const updatedSchedules: CareSchedule[] = [];

      // 1. 기존 row 재사용
      for (let index = 0; index < updateCount; index += 1) {
        const current = pending[index];
        const time = times[index];

        const updated = await updateCareScheduleById(current.id, {
          name: name.trim(),
          dueDate,
          repeat,
          dosageText: dosageText.trim() || undefined,
          notificationEnabled,
          notificationTime: time,
        });

        updatedSchedules.push(updated);
        replaceSchedule(updated);
      }

      // 2. 시간이 줄어든 경우 남는 기존 row 삭제
      const schedulesToDelete = pending.slice(updateCount);

      for (const schedule of schedulesToDelete) {
        await deleteCareScheduleById(schedule.id);

        removeScheduleFromStore(schedule.id);

        try {
          await cancelCareNotification(schedule.id);
        } catch (error) {
          console.log('DELETE GROUP NOTIFICATION ERROR:', error);
        }
      }

      // 3. 시간이 늘어난 경우 부족한 row 생성
      const timesToCreate = times.slice(updateCount);

      let createdSchedules: CareSchedule[] = [];

      if (timesToCreate.length > 0) {
        createdSchedules = await createCareSchedules(
          timesToCreate.map((time) => ({
            petId: pet.id,
            type: 'MEDICATION',
            name: name.trim(),
            dueDate,
            repeat,
            dosageText: dosageText.trim() || undefined,
            scheduleGroupId: groupId,
            notificationEnabled,
            notificationTime: time,
          })),
        );

        createdSchedules.forEach(addScheduleFromDb);
      }

      /**
       * 4. 알림 재설정
       *
       * deterministic notification id를 쓰고 있으므로
       * 업데이트된 기존 row는 먼저 취소한 뒤 다시 예약한다.
       */
      for (const schedule of updatedSchedules) {
        try {
          await cancelCareNotification(schedule.id);

          if (schedule.notificationEnabled) {
            await scheduleCareNotification({
              scheduleId: schedule.id,
              petName: pet.name,
              careName: schedule.name,
              dueDate: schedule.dueDate,
              notificationTime:
                schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
            });
          }
        } catch (error) {
          console.log('UPDATE GROUP NOTIFICATION ERROR:', error);
        }
      }

      for (const schedule of createdSchedules) {
        if (!schedule.notificationEnabled) {
          continue;
        }

        try {
          await scheduleCareNotification({
            scheduleId: schedule.id,
            petName: pet.name,
            careName: schedule.name,
            dueDate: schedule.dueDate,
            notificationTime:
              schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
          });
        } catch (error) {
          console.log('CREATE GROUP NOTIFICATION ERROR:', error);
        }
      }

      router.back();
    } catch (error) {
      console.log('UPDATE MEDICATION GROUP ERROR:', error);

      Alert.alert(
        '복약 일정을 수정하지 못했어요',
        '잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // 삭제
  // ─────────────────────────────────────────────

  const handleDelete = () => {
    if (saving) {
      return;
    }

    const schedulesToDelete = allSchedules.filter(
      (schedule) =>
        schedule.scheduleGroupId === groupId &&
        schedule.dueDate >= dueDate &&
        !schedule.completedAt,
    );

    if (schedulesToDelete.length === 0) {
      Alert.alert(
        '삭제할 일정이 없어요',
        '이미 완료한 복약 기록은 삭제하지 않아요.',
      );
      return;
    }

    Alert.alert(
      '남은 복약 일정을 삭제할까요?',
      '이미 완료한 복약 기록은 유지되고, 오늘부터 남아 있는 이 복약 일정은 모두 삭제돼요.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',

          onPress: async () => {
            setSaving(true);

            try {
              for (const schedule of schedulesToDelete) {
                await deleteCareScheduleById(schedule.id);

                removeScheduleFromStore(schedule.id);

                try {
                  await cancelCareNotification(schedule.id);
                } catch (error) {
                  console.log('DELETE GROUP NOTIFICATION ERROR:', error);
                }
              }

              router.back();
            } catch (error) {
              console.log('DELETE MEDICATION GROUP ERROR:', error);

              Alert.alert('삭제하지 못했어요', '잠시 후 다시 시도해주세요.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <AppText variant="heading1">복약 일정 수정</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          투약 시간과 반복 주기를 한 번에 변경할 수 있어요.
        </AppText>

        {/* 현재 일정 요약 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <CalendarDays size={22} color={colors.primary[700]} />
          </View>

          <View style={styles.summaryText}>
            <AppText variant="heading2">{baseSchedule.name}</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.summaryDescription}
            >
              {formatDate(dueDate)} · 완료 {completedSchedules.length} · 남음{' '}
              {pendingSchedules.length}
            </AppText>
          </View>
        </View>

        {/* 완료된 시간 */}
        {completedSchedules.length > 0 && (
          <View style={styles.section}>
            <AppText variant="heading2">오늘 완료한 시간</AppText>

            <View style={styles.completedTimeList}>
              {completedSchedules.map((schedule) => (
                <View key={schedule.id} style={styles.completedTimeRow}>
                  <View style={styles.completedIcon}>
                    <Check size={14} color={colors.primary[700]} />
                  </View>

                  <AppText variant="body1" color="secondary">
                    {schedule.notificationTime ?? '-'}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 관리 이름 */}
        <View style={styles.section}>
          <AppText variant="heading2">관리 이름</AppText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="예: 안약 A"
            placeholderTextColor={colors.neutral[400]}
            style={styles.input}
          />
        </View>

        {/* 복용량 */}
        <View style={styles.section}>
          <AppText variant="heading2">복용량</AppText>

          <TextInput
            value={dosageText}
            onChangeText={setDosageText}
            placeholder="예: 1정, 2ml, 1방울"
            placeholderTextColor={colors.neutral[400]}
            style={styles.input}
          />
        </View>

        {/* 투약 시간 */}
        <View style={styles.section}>
          <MedicationTimeList
            times={medicationTimes}
            onChange={setMedicationTimes}
          />

          <AppText variant="body2" color="secondary" style={styles.helperText}>
            여기에서 설정한 시간은 앞으로 남은 복약 일정에 적용돼요.
          </AppText>
        </View>

        {/* 반복 */}
        <View style={styles.section}>
          <AppText variant="heading2">반복</AppText>

          <RepeatSelector
            options={repeatOptions}
            value={repeatPreset}
            onChange={setRepeatPreset}
          />

          {repeatPreset === 'CUSTOM' && (
            <CustomRepeatInput
              interval={customRepeatInterval}
              onIntervalChange={setCustomRepeatInterval}
              unit={customRepeatUnit}
              onUnitChange={setCustomRepeatUnit}
            />
          )}
        </View>

        {/* 알림 */}
        <View style={styles.section}>
          <AppText variant="heading2">알림</AppText>

          <MedicationNotificationSetting
            enabled={notificationEnabled}
            onEnabledChange={setNotificationEnabled}
          />
        </View>

        {/* 편집 정책 안내 */}
        <View style={styles.noticeBox}>
          <AppText variant="body2" color="secondary" style={styles.noticeText}>
            이미 완료한 복약 기록은 변경되지 않아요. 변경사항은 아직 완료하지
            않은 일정에 적용돼요.
          </AppText>
        </View>

        {/* 삭제 */}
        <Pressable
          style={[styles.deleteButton, saving && styles.disabledButton]}
          disabled={saving}
          onPress={handleDelete}
        >
          <Trash2 size={18} color={colors.error[500]} />

          <AppText variant="body1" style={styles.deleteText}>
            복약 일정 삭제
          </AppText>
        </Pressable>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? '저장 중...' : '복약 일정 저장하기'}
          disabled={!isValid || saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);

  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(
    2,
    '0',
  )}`;
}

const styles = StyleSheet.create({
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

  description: {
    marginTop: 8,
    marginBottom: 24,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 32,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
  },

  summaryIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary[100],
  },

  summaryText: {
    flex: 1,
  },

  summaryDescription: {
    marginTop: 4,
  },

  section: {
    marginBottom: 28,
    gap: 12,
  },

  input: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: colors.neutral[900],
  },

  helperText: {
    lineHeight: 21,
  },

  completedTimeList: {
    gap: 8,
  },

  completedTimeRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
  },

  completedIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary[100],
  },

  noticeBox: {
    padding: 16,
    marginBottom: 28,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
  },

  noticeText: {
    lineHeight: 22,
  },

  deleteButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.error[50],
  },

  deleteText: {
    color: colors.error[500],
  },

  disabledButton: {
    opacity: 0.5,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: colors.neutral[50],
  },
});
