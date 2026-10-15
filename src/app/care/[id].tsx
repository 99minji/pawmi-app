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

import { CustomRepeatInput } from '@/components/care/CustomRepeatInput';
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

import type { CareRepeat, CareSchedule, RepeatUnit } from '@/types/care';

import {
  formatScheduleType,
  getRepeatFromPreset,
  getRepeatOptions,
  getRepeatPreset,
  parseCustomRepeat,
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

  /**
   * 예정일
   */
  const [dueDate, setDueDate] = useState(() =>
    parseDateString(schedule.dueDate),
  );

  /**
   * 여러 시간으로 묶인 투약 일정인지
   *
   * 예:
   * 안약 A
   * 08:00 / 13:00 / 20:00
   *
   * 현재 detail 화면에서는 한 occurrence만 수정하게 되므로
   * 그룹 투약의 반복 주기 변경은 막는다.
   */
  const isGroupedMedication =
    schedule.type === 'MEDICATION' && !!schedule.scheduleGroupId;

  /**
   * 반복
   */
  const savedPreset = getRepeatPreset(schedule.repeat);

  const repeatOptions = getRepeatOptions(schedule.type);

  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>(savedPreset);

  /**
   * Custom Repeat
   *
   * 기존 custom 값이 있으면 그대로 초기값으로 사용한다.
   *
   * 예:
   * { unit: 'DAY', interval: 3 }
   * → 3 / 일
   */
  const [customRepeatInterval, setCustomRepeatInterval] = useState(() =>
    schedule.repeat ? String(schedule.repeat.interval) : '1',
  );

  const [customRepeatUnit, setCustomRepeatUnit] = useState<RepeatUnit>(
    schedule.repeat?.unit ?? 'DAY',
  );

  /**
   * 투약량
   */
  const [dosageText, setDosageText] = useState(schedule.dosageText ?? '');

  /**
   * 알림
   */
  const [notificationEnabled, setNotificationEnabled] = useState(
    schedule.notificationEnabled,
  );

  const [notificationTime, setNotificationTime] = useState(
    schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
  );

  const [saving, setSaving] = useState(false);

  /**
   * 실제 저장할 repeat
   *
   * 그룹 복약 일정은 현재 개별 반복 변경을 막고 있으므로
   * 기존 repeat을 그대로 유지한다.
   */
  const repeat: CareRepeat | undefined = isGroupedMedication
    ? schedule.repeat
    : repeatPreset === 'CUSTOM'
      ? parseCustomRepeat(customRepeatInterval, customRepeatUnit)
      : getRepeatFromPreset(repeatPreset);

  const customRepeatValid =
    isGroupedMedication || repeatPreset !== 'CUSTOM' || !!repeat;

  /**
   * 반복 설정 변경
   */
  const handleRepeatChange = (value: RepeatPreset) => {
    if (isGroupedMedication) {
      return;
    }

    setRepeatPreset(value);

    /**
     * CUSTOM으로 처음 진입할 때
     * 값이 비어 있으면 기본값으로 보정한다.
     */
    if (value === 'CUSTOM' && !customRepeatInterval) {
      setCustomRepeatInterval('1');
    }
  };

  /**
   * 저장
   */
  const handleSave = async () => {
    if (saving || !customRepeatValid) {
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

        /**
         * 알림을 꺼도 시간을 유지한다.
         *
         * 나중에 다시 ON 했을 때
         * 사용자가 선택했던 시간을 복구할 수 있다.
         */
        notificationTime,
      });

      /**
       * DB 저장이 성공했으면
       * 이 시점부터 일정 저장 자체는 성공이다.
       */
      replaceSchedule(updatedSchedule);

      /**
       * 알림 처리는 DB 저장과 분리한다.
       *
       * 기기 알림 예약이 실패했다고
       * 이미 저장된 일정까지 "저장 실패"로 보여주면 안 된다.
       */
      try {
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
      } catch (error) {
        console.log('UPDATE CARE NOTIFICATION ERROR:', error);

        Alert.alert(
          '일정은 저장했어요',
          '알림 설정만 반영하지 못했어요. 잠시 후 다시 설정해주세요.',
        );
      }

      router.back();
    } catch (error) {
      console.log('UPDATE CARE ERROR:', error);

      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 삭제
   */
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
            /**
             * DB 삭제가 primary success
             */
            await deleteCareScheduleById(schedule.id);

            removeScheduleFromStore(schedule.id);

            /**
             * 알림 삭제 실패는
             * DB 일정 삭제를 실패로 취급하지 않는다.
             */
            try {
              await cancelCareNotification(schedule.id);
            } catch (error) {
              console.log('DELETE CARE NOTIFICATION ERROR:', error);
            }

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
        keyboardShouldPersistTaps="handled"
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
              placeholder="예: 1정, 2ml, 1방울"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
            />
          </View>
        )}

        {/* 반복 */}
        <View style={styles.section}>
          <AppText variant="heading2">반복</AppText>

          <View style={styles.repeatInfoRow}>
            <Repeat2 size={18} color={colors.primary[700]} />

            <AppText
              variant="body2"
              color="secondary"
              style={styles.repeatInfoText}
            >
              {isGroupedMedication
                ? '여러 시간으로 등록된 복약 일정은 반복 주기를 개별 수정할 수 없어요.'
                : '필요한 주기를 선택해주세요.'}
            </AppText>
          </View>

          <View
            pointerEvents={isGroupedMedication ? 'none' : 'auto'}
            style={
              isGroupedMedication ? styles.repeatSelectorDisabled : undefined
            }
          >
            <RepeatSelector
              options={repeatOptions}
              value={repeatPreset}
              onChange={handleRepeatChange}
            />
          </View>

          {/* 사용자 지정 반복 */}
          {repeatPreset === 'CUSTOM' && !isGroupedMedication && (
            <CustomRepeatInput
              interval={customRepeatInterval}
              onIntervalChange={setCustomRepeatInterval}
              unit={customRepeatUnit}
              onUnitChange={setCustomRepeatUnit}
            />
          )}

          {/* 그룹 복약 안내 */}
          {isGroupedMedication && (
            <View style={styles.repeatNoticeBox}>
              <AppText
                variant="body2"
                color="secondary"
                style={styles.repeatNoticeText}
              >
                같은 약의 시간별 일정은 하나의 복약 일정으로 관리되고 있어요.
                반복 주기 변경은 그룹 편집 기능에서 지원할 예정이에요.
              </AppText>
            </View>
          )}
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
          style={[styles.deleteButton, saving && styles.buttonDisabled]}
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
          disabled={saving || !customRepeatValid}
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

  repeatSelectorDisabled: {
    opacity: 0.45,
  },

  groupEditNotice: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
  },

  repeatInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },

  repeatInfoText: {
    flex: 1,
    flexShrink: 1,
    lineHeight: 22,
  },

  repeatNoticeBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
  },

  repeatNoticeText: {
    flexShrink: 1,
    lineHeight: 22,
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

  buttonDisabled: {
    opacity: 0.5,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: colors.neutral[50],
  },
});
