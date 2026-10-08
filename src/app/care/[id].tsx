import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, CalendarDays, Repeat2, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { RepeatSelector } from '@/components/care/RepeatSelector';
import { SettingCard } from '@/components/care/SettingCard';
import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import {
  completeCareScheduleById,
  createCareSchedule,
  deleteCareScheduleById,
  updateCareScheduleById,
} from '@/services/care';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareSchedule } from '@/types/care';
import {
  addRepeatToDate,
  formatScheduleType,
  getRepeatFromPreset,
  getRepeatPreset,
  REPEAT_OPTIONS,
  type RepeatPreset,
} from '@/utils/care';
import {
  formatKoreanDate,
  formatKoreanTime,
  parseDateString,
  parseTimeString,
  toDateString,
  toTimeString,
} from '@/utils/date';
import {
  cancelCareNotification,
  DEFAULT_NOTIFICATION_TIME,
  scheduleCareNotification,
} from '@/utils/notification';

export default function CareDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const pet = usePetStore((state) => state.pet);

  const schedule = useCareScheduleStore((state) =>
    state.schedules.find((item) => item.id === id),
  );

  // 스토어 hydration 전에는 schedule이 없으므로, 준비된 뒤에 폼을 마운트해 초기값을 맞춘다.
  if (!schedule || !pet) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          일정을 찾을 수 없어요.
        </AppText>
      </View>
    );
  }

  return (
    <CareDetailForm key={schedule.id} schedule={schedule} petName={pet.name} />
  );
}

function CareDetailForm({
  schedule,
  petName,
}: {
  schedule: CareSchedule;
  petName: string;
}) {
  const addScheduleFromDb = useCareScheduleStore(
    (state) => state.addScheduleFromDb,
  );

  const replaceSchedule = useCareScheduleStore(
    (state) => state.replaceSchedule,
  );

  const removeScheduleFromStore = useCareScheduleStore(
    (state) => state.removeScheduleFromStore,
  );

  const [dueDate, setDueDate] = useState(() =>
    parseDateString(schedule.dueDate),
  );

  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>(() =>
    getRepeatPreset(schedule.repeat),
  );

  const [notificationEnabled, setNotificationEnabled] = useState(
    schedule.notificationEnabled ?? true,
  );

  const [notificationTime, setNotificationTime] = useState(
    schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);

  const [saving, setSaving] = useState(false);

  // 프리셋에 없는 기존 반복 설정은 저장 시 사라지지 않도록 유지 옵션으로 노출한다.
  const hasCustomRepeat = getRepeatPreset(schedule.repeat) === 'CUSTOM';

  const repeatOptions = hasCustomRepeat
    ? [{ label: '기존 설정 유지', value: 'CUSTOM' as const }, ...REPEAT_OPTIONS]
    : REPEAT_OPTIONS;

  const repeat =
    repeatPreset === 'CUSTOM'
      ? schedule.repeat
      : getRepeatFromPreset(repeatPreset);

  /**
   * 저장 · 완료 · 삭제 공통 처리
   *
   * 중복 실행을 막고, 성공하면 화면을 닫고, 실패하면 알림을 띄운다.
   */
  const runAction = async (action: () => Promise<void>, errorTitle: string) => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      await action();

      router.back();
    } catch (error) {
      console.log(`${errorTitle}:`, error);

      Alert.alert(errorTitle, '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () =>
    runAction(async () => {
      const updatedSchedule = await updateCareScheduleById(schedule.id, {
        name: schedule.name,
        dueDate: toDateString(dueDate),
        repeat,
      });

      // 알림 설정은 서버에 없으므로 기존 예약을 지우고 다시 예약한 뒤 로컬에 함께 저장한다.
      await cancelCareNotification(schedule.notificationId);

      const notificationId = notificationEnabled
        ? await scheduleCareNotification({
            scheduleId: updatedSchedule.id,
            petName,
            careName: updatedSchedule.name,
            dueDate: updatedSchedule.dueDate,
            notificationTime,
          })
        : null;

      replaceSchedule({
        ...updatedSchedule,
        notificationEnabled,
        notificationTime,
        notificationId: notificationId ?? undefined,
      });
    }, '저장하지 못했어요');

  const handleComplete = () =>
    runAction(async () => {
      const completedSchedule = await completeCareScheduleById(schedule.id);

      replaceSchedule(completedSchedule);

      if (!schedule.repeat) {
        return;
      }

      const nextSchedule = await createCareSchedule({
        petId: schedule.petId,
        type: schedule.type,
        name: schedule.name,
        dueDate: addRepeatToDate(schedule.dueDate, schedule.repeat),
        repeat: schedule.repeat,
      });

      addScheduleFromDb(nextSchedule);
    }, '완료 처리하지 못했어요');

  const handleDelete = () => {
    Alert.alert('일정을 삭제할까요?', '삭제한 일정은 다시 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          runAction(async () => {
            await deleteCareScheduleById(schedule.id);

            removeScheduleFromStore(schedule.id);

            try {
              await cancelCareNotification(schedule.notificationId);
            } catch (error) {
              console.warn('알림 취소에 실패했어요.', error);
            }
          }, '삭제하지 못했어요'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="heading1">관리 일정</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          날짜와 반복 주기를 변경할 수 있어요.
        </AppText>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <CalendarDays size={22} color={colors.primary[700]} />
          </View>

          <View style={styles.summaryText}>
            <AppText variant="heading2">{schedule.name}</AppText>

            <AppText
              variant="body2"
              color="secondary"
              style={styles.summaryDescription}
            >
              {formatScheduleType(schedule.type)}
            </AppText>
          </View>
        </View>

        {/* 예정일 */}
        <View style={styles.section}>
          <AppText variant="heading2">예정일</AppText>

          <SettingCard
            icon={CalendarDays}
            title="관리 날짜"
            description={formatKoreanDate(dueDate)}
            onPress={() => setShowDatePicker(true)}
          />

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              locale="ko-KR"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }

                // Android는 취소(dismissed) 시에도 기존 value로 onChange를 호출한다.
                if (event.type === 'set' && selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* 반복 */}
        <View style={styles.section}>
          <AppText variant="heading2">반복</AppText>

          <View style={styles.sectionHint}>
            <Repeat2 size={18} color={colors.primary[700]} />

            <AppText variant="body2" color="secondary">
              필요한 주기를 선택해주세요.
            </AppText>
          </View>

          <RepeatSelector
            options={repeatOptions}
            value={repeatPreset}
            onChange={setRepeatPreset}
          />
        </View>

        {/* 알림 */}
        <View style={styles.section}>
          <AppText variant="heading2">알림</AppText>

          <SettingCard
            icon={Bell}
            title="관리 알림"
            description="예정일에 알림을 보내드려요."
            right={
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{
                  false: colors.neutral[300],
                  true: colors.primary[300],
                }}
                thumbColor={
                  notificationEnabled ? colors.primary[700] : colors.neutral[0]
                }
              />
            }
          />

          {notificationEnabled && (
            <SettingCard
              title="알림 시간"
              description={`예정일 ${formatKoreanTime(notificationTime)}`}
              right={
                <AppText variant="body1" color="brand">
                  {formatKoreanTime(notificationTime)}
                </AppText>
              }
              onPress={() => setShowTimePicker(true)}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={parseTimeString(notificationTime)}
              mode="time"
              locale="ko-KR"
              is24Hour={false}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowTimePicker(false);
                }

                if (event.type === 'set' && selectedDate) {
                  setNotificationTime(toTimeString(selectedDate));
                }
              }}
            />
          )}
        </View>

        <Pressable
          style={styles.deleteButton}
          disabled={saving}
          onPress={handleDelete}
        >
          <Trash2 size={18} color={colors.error[500]} />

          <AppText variant="body1" style={styles.deleteText}>
            일정 삭제
          </AppText>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        {!schedule.completedAt && (
          <PrimaryButton
            label={saving ? '처리 중...' : '오늘 관리 완료'}
            disabled={saving}
            onPress={handleComplete}
          />
        )}

        <Pressable
          style={styles.saveButton}
          disabled={saving}
          onPress={handleSave}
        >
          <AppText variant="body1" color="brand">
            변경사항 저장하기
          </AppText>
        </Pressable>
      </View>
    </View>
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

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
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
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    marginBottom: 32,
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  },

  sectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },

  deleteButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: colors.error[50],
  },

  deleteText: {
    color: colors.error[500],
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: colors.neutral[50],
  },

  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});
