import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Repeat2, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { NotificationSetting } from '@/components/care/NotificationSetting';
import { RepeatSelector } from '@/components/care/RepeatSelector';
import { AppText } from '@/components/common/AppText';
import { DateField } from '@/components/common/DateField';
import { PrimaryButton } from '@/components/common/PrimaryButton';

import { colors } from '@/constants/colors';

import {
  deleteCareScheduleById,
  updateCareScheduleById,
} from '@/services/care';

import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { usePetStore } from '@/stores/usePetStore';

import type { CareSchedule } from '@/types/care';

import {
  formatScheduleType,
  getRepeatFromPreset,
  getRepeatOptions,
  getRepeatPreset,
  type RepeatPreset,
} from '@/utils/care';

import { parseDateString, toDateString } from '@/utils/date';
import {
  cancelCareNotification,
  DEFAULT_NOTIFICATION_TIME,
  scheduleCareNotification,
} from '@/utils/notification';

export default function CareDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const schedule = useCareScheduleStore((state) =>
    state.schedules.find((item) => item.id === id),
  );

  if (!schedule) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          일정을 찾을 수 없어요.
        </AppText>
      </View>
    );
  }

  return <CareDetailForm key={schedule.id} schedule={schedule} />;
}

function CareDetailForm({ schedule }: { schedule: CareSchedule }) {
  const pet = usePetStore((state) => state.pet);

  const replaceSchedule = useCareScheduleStore(
    (state) => state.replaceSchedule,
  );

  const removeScheduleFromStore = useCareScheduleStore(
    (state) => state.removeScheduleFromStore,
  );

  const [dueDate, setDueDate] = useState(() =>
    parseDateString(schedule.dueDate),
  );

  const typeRepeatOptions = getRepeatOptions(schedule.type);

  const savedPreset = getRepeatPreset(schedule.repeat);

  /**
   * 기존 데이터가 현재 UI 프리셋에 없는 값이라면
   * 수정하지 않는 한 기존 값을 유지할 수 있도록 한다.
   */
  const hasCustomRepeat = !typeRepeatOptions.some(
    (option) => option.value === savedPreset,
  );

  const repeatOptions = hasCustomRepeat
    ? [
        {
          label: '기존 설정 유지',
          value: 'CUSTOM' as const,
        },
        ...typeRepeatOptions,
      ]
    : typeRepeatOptions;

  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>(
    hasCustomRepeat ? 'CUSTOM' : savedPreset,
  );

  const [dosageText, setDosageText] = useState(schedule.dosageText ?? '');

  const [notificationEnabled, setNotificationEnabled] = useState(
    schedule.notificationEnabled,
  );

  const [notificationTime, setNotificationTime] = useState(
    schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
  );

  const [saving, setSaving] = useState(false);

  const repeat =
    repeatPreset === 'CUSTOM'
      ? schedule.repeat
      : getRepeatFromPreset(repeatPreset);

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const updatedSchedule = await updateCareScheduleById(schedule.id, {
        name: schedule.name,
        dueDate: toDateString(dueDate),
        repeat,

        dosageText:
          schedule.type === 'MEDICATION'
            ? dosageText.trim() || undefined
            : undefined,

        notificationEnabled,

        // OFF여도 시간은 유지해서, 다시 켰을 때 사용자가 고른 시간이 남도록 한다.
        notificationTime,
      });

      replaceSchedule(updatedSchedule);

      // 기존 알림을 지우고, 알림이 켜져 있으면 수정된 날짜/시간으로 다시 예약한다.
      if (updatedSchedule.notificationEnabled && pet) {
        await scheduleCareNotification({
          scheduleId: updatedSchedule.id,
          petName: pet.name,
          careName: updatedSchedule.name,
          dueDate: updatedSchedule.dueDate,
          notificationTime:
            updatedSchedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
        });
      } else {
        await cancelCareNotification(updatedSchedule.id);
      }

      router.back();
    } catch (error) {
      console.log('UPDATE CARE ERROR:', error);

      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (saving) {
      return;
    }

    Alert.alert('일정을 삭제할까요?', '삭제한 일정은 다시 되돌릴 수 없어요.', [
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
            await deleteCareScheduleById(schedule.id);

            removeScheduleFromStore(schedule.id);

            await cancelCareNotification(schedule.id);

            router.back();
          } catch (error) {
            console.log('DELETE CARE ERROR:', error);

            Alert.alert('삭제하지 못했어요', '잠시 후 다시 시도해주세요.');
          } finally {
            setSaving(false);
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
        <AppText variant="heading1">관리 일정</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          예정일과 반복 주기를 변경할 수 있어요.
        </AppText>

        {/* 일정 요약 */}
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

          <DateField
            value={dueDate}
            onChange={setDueDate}
            minimumDate={new Date()}
          />
        </View>

        {/* 복용량 */}
        {schedule.type === 'MEDICATION' && (
          <View style={styles.section}>
            <AppText variant="heading2">복용량</AppText>

            <TextInput
              value={dosageText}
              onChangeText={setDosageText}
              placeholder="예: 1정, 2ml"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
            />
          </View>
        )}

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

          <NotificationSetting
            enabled={notificationEnabled}
            onEnabledChange={setNotificationEnabled}
            time={notificationTime}
            onTimeChange={setNotificationTime}
          />
        </View>

        {/* 삭제 */}
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
        <PrimaryButton
          label={saving ? '저장 중...' : '변경사항 저장하기'}
          disabled={saving}
          onPress={handleSave}
        />
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
    gap: 12,
  },

  input: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: colors.neutral[900],
  },

  sectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
});
