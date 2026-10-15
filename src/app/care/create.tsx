import { randomUUID } from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AiScheduleInput } from '@/components/care/AiScheduleInput';
import {
  CARE_TYPES,
  CareTypeSelector,
} from '@/components/care/CareTypeSelector';
import { CustomRepeatInput } from '@/components/care/CustomRepeatInput';
import { MedicationNotificationSetting } from '@/components/care/MedicationNotificationSetting';
import { MedicationTimeList } from '@/components/care/MedicationTimeList';
import { NotificationSetting } from '@/components/care/NotificationSetting';
import { AppText } from '@/components/common/AppText';
import { DateField } from '@/components/common/DateField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { parseCareSchedule } from '@/services/ai';
import { createCareSchedules } from '@/services/care';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareRepeat, CareScheduleType, RepeatUnit } from '@/types/care';
import {
  getRepeatFromPreset,
  getRepeatOptions,
  getRepeatPreset,
  isValidTime,
  parseCustomRepeat,
  type RepeatPreset,
} from '@/utils/care';
import { toDateString } from '@/utils/date';
import {
  DEFAULT_NOTIFICATION_TIME,
  requestNotificationPermission,
  scheduleCareNotification,
} from '@/utils/notification';

export default function CareCreateScreen() {
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();

  const pet = usePetStore((state) => state.pet);

  const addScheduleFromDb = useCareScheduleStore(
    (state) => state.addScheduleFromDb,
  );

  // ─────────────────────────────────────────────
  // 폼 상태
  // ─────────────────────────────────────────────
  const [type, setType] = useState<CareScheduleType>(
    () =>
      CARE_TYPES.find((item) => item.value === typeParam)?.value ?? 'HEARTWORM',
  );
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState(new Date());

  // 반복 (프리셋 또는 사용자 지정)
  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>('NONE');
  const [customRepeatInterval, setCustomRepeatInterval] = useState('1');
  const [customRepeatUnit, setCustomRepeatUnit] = useState<RepeatUnit>('DAY');

  // 투약 전용
  const [dosageText, setDosageText] = useState('');
  const [medicationTimes, setMedicationTimes] = useState([
    DEFAULT_NOTIFICATION_TIME,
  ]);

  // 알림 (투약은 medicationTimes 각각이 알림 시간)
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState(
    DEFAULT_NOTIFICATION_TIME,
  );

  // AI 자연어 입력
  const [aiInput, setAiInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // 파생 값 / 검증
  // ─────────────────────────────────────────────
  const isMedication = type === 'MEDICATION';

  const repeat: CareRepeat | undefined =
    repeatPreset === 'CUSTOM'
      ? parseCustomRepeat(customRepeatInterval, customRepeatUnit)
      : getRepeatFromPreset(repeatPreset);

  const customRepeatValid = repeatPreset !== 'CUSTOM' || !!repeat;

  const medicationTimesValid =
    !isMedication ||
    (medicationTimes.length > 0 && medicationTimes.every(isValidTime));

  const isValid =
    name.trim().length > 0 && medicationTimesValid && customRepeatValid;

  // ─────────────────────────────────────────────
  // 폼 변경
  // ─────────────────────────────────────────────
  const handleTypeChange = (nextType: CareScheduleType) => {
    setType(nextType);
    setRepeatPreset('NONE');

    if (nextType !== 'MEDICATION') {
      setDosageText('');
      setMedicationTimes([DEFAULT_NOTIFICATION_TIME]);
    }
  };

  /**
   * 반복 설정을 폼에 채운다.
   *
   * 해당 관리 종류의 프리셋에 없는 주기(예: 3일마다)는 사용자 지정으로 채운다.
   */
  const applyRepeat = (careType: CareScheduleType, value?: CareRepeat) => {
    const preset = getRepeatPreset(value);

    const isAvailablePreset = getRepeatOptions(careType).some(
      (option) => option.value === preset && preset !== 'CUSTOM',
    );

    if (!value || isAvailablePreset) {
      setRepeatPreset(preset);
      return;
    }

    setRepeatPreset('CUSTOM');
    setCustomRepeatInterval(String(value.interval));
    setCustomRepeatUnit(value.unit);
  };

  // ─────────────────────────────────────────────
  // AI 자연어 일정 분석
  //
  // LLM 결과를 바로 저장하지 않고 폼에만 채운다.
  // ─────────────────────────────────────────────
  const handleAnalyze = async () => {
    const text = aiInput.trim();

    if (!text || analyzing) {
      return;
    }

    setAnalyzing(true);

    try {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';

      const result = await parseCareSchedule({
        text,
        today: toDateString(new Date()),
        timezone,
      });

      setType(result.type);
      setName(result.name ?? '');
      setDosageText(
        result.type === 'MEDICATION' ? (result.dosageText ?? '') : '',
      );

      if (result.dueDate) {
        setDueDate(parseLocalDate(result.dueDate));
      }

      applyRepeat(result.type, result.repeat);

      if (result.notificationTime) {
        setNotificationTime(result.notificationTime);

        if (result.type === 'MEDICATION') {
          setMedicationTimes([result.notificationTime]);
        }
      }

      // LLM이 알림 ON으로 판단했더라도 권한 확인을 우회하지 않는다.
      if (!result.notificationEnabled) {
        setNotificationEnabled(false);
        return;
      }

      const granted = await requestNotificationPermission();

      setNotificationEnabled(granted);

      if (!granted) {
        Alert.alert(
          '일정은 정리했어요',
          '알림 권한이 허용되지 않아 알림은 꺼진 상태예요. 필요하면 아래에서 직접 켜주세요.',
        );
      }
    } catch (error) {
      console.log('PARSE CARE ERROR:', error);

      Alert.alert(
        '일정을 정리하지 못했어요',
        '표현을 조금 바꿔서 다시 시도해주세요.',
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // ─────────────────────────────────────────────
  // 저장
  //
  // 투약은 시간마다 일정 1개씩 만들고,
  // 시간이 여러 개면 같은 scheduleGroupId로 묶는다.
  // ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!pet || !isValid || saving) {
      return;
    }

    setSaving(true);

    try {
      // 투약 시간: 중복 제거 + 시간순 정렬
      const times = isMedication
        ? [...new Set(medicationTimes.map((time) => time.trim()))].sort()
        : [notificationTime];

      const scheduleGroupId =
        isMedication && times.length > 1 ? randomUUID() : undefined;

      const schedules = await createCareSchedules(
        times.map((time) => ({
          petId: pet.id,
          type,
          name: name.trim(),
          dueDate: toDateString(dueDate),
          repeat,
          dosageText: isMedication ? dosageText.trim() || undefined : undefined,
          scheduleGroupId,
          notificationEnabled,
          // 알림이 꺼져 있어도 시간은 저장한다. (투약은 해당 회차의 시간으로도 사용)
          notificationTime: time,
        })),
      );

      schedules.forEach(addScheduleFromDb);

      if (notificationEnabled) {
        const results = await Promise.allSettled(
          schedules.map((schedule) =>
            scheduleCareNotification({
              scheduleId: schedule.id,
              petName: pet.name,
              careName: schedule.name,
              dueDate: schedule.dueDate,
              notificationTime:
                schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
            }),
          ),
        );
        const hasNotificationFailure = results.some(
          (result) => result.status === 'rejected',
        );

        if (hasNotificationFailure) {
          Alert.alert(
            '일정은 예약했어요',
            '일부 알림을 설정하지 못했어요. 일정은 정상적으로 저장됐어요.',
          );
        }
      }

      router.back();
    } catch (error) {
      console.log('CREATE CARE ERROR:', error);

      Alert.alert('일정을 예약하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  if (!pet) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="heading1">관리 일정을 예약해볼까요?</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          {pet.name}에게 필요한 관리를 미리 등록해두세요.
        </AppText>

        <AiScheduleInput
          value={aiInput}
          onChange={setAiInput}
          analyzing={analyzing}
          onAnalyze={handleAnalyze}
        />

        {/* 관리 종류 */}
        <View style={styles.section}>
          <AppText variant="heading2">관리 종류</AppText>

          <CareTypeSelector value={type} onChange={handleTypeChange} />
        </View>

        {/* 관리 이름 */}
        <View style={styles.section}>
          <AppText variant="heading2">관리 이름</AppText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={getNamePlaceholder(type)}
            placeholderTextColor={colors.neutral[400]}
            style={styles.input}
          />
        </View>

        {/* 복용량 · 투약 시간 */}
        {isMedication && (
          <>
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

            <View style={styles.section}>
              <MedicationTimeList
                times={medicationTimes}
                onChange={setMedicationTimes}
              />
            </View>
          </>
        )}

        {/* 예정일 */}
        <View style={styles.section}>
          <AppText variant="heading2">예정일</AppText>

          <DateField
            value={dueDate}
            onChange={setDueDate}
            minimumDate={new Date()}
          />
        </View>

        {/* 반복 */}
        <View style={styles.section}>
          <AppText variant="heading2">반복</AppText>

          <View style={styles.repeatOptions}>
            {getRepeatOptions(type).map((item) => {
              const selected = repeatPreset === item.value;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => setRepeatPreset(item.value)}
                  style={[
                    styles.repeatChip,
                    selected && styles.repeatChipSelected,
                  ]}
                >
                  <AppText
                    variant="body2"
                    color={selected ? 'inverse' : 'secondary'}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {repeatPreset === 'CUSTOM' && (
          <CustomRepeatInput
            interval={customRepeatInterval}
            onIntervalChange={setCustomRepeatInterval}
            unit={customRepeatUnit}
            onUnitChange={setCustomRepeatUnit}
            style={styles.customRepeat}
          />
        )}

        {/* 알림 */}
        <View style={styles.section}>
          <AppText variant="heading2">알림</AppText>

          {isMedication ? (
            <MedicationNotificationSetting
              enabled={notificationEnabled}
              onEnabledChange={setNotificationEnabled}
            />
          ) : (
            <NotificationSetting
              enabled={notificationEnabled}
              onEnabledChange={setNotificationEnabled}
              time={notificationTime}
              onTimeChange={setNotificationTime}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? '예약 중...' : '일정 예약하기'}
          disabled={!isValid || saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

/**
 * YYYY-MM-DD를 로컬 Date(정오)로 변환한다.
 *
 * new Date('2026-10-14')는 UTC로 파싱되어 날짜가 밀릴 수 있다.
 */
function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day, 12, 0, 0);
}

function getNamePlaceholder(type: CareScheduleType) {
  switch (type) {
    case 'HEARTWORM':
      return '예: 심장사상충 예방약';

    case 'MEDICATION':
      return '예: 심장약';

    case 'VACCINATION':
      return '예: 광견병 예방접종';

    case 'CHECKUP':
      return '예: 정기 건강검진';
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

  description: {
    marginTop: 8,
    marginBottom: 24,
  },

  section: {
    marginBottom: 32,
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

  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  repeatChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  repeatChipSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },

  customRepeat: {
    marginTop: 4,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: colors.neutral[50],
  },
});
