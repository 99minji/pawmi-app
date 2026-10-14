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

import {
  HeartPulse,
  Hospital,
  Pill,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

import { NotificationSetting } from '@/components/care/NotificationSetting';
import { AppText } from '@/components/common/AppText';
import { DateField } from '@/components/common/DateField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';

import { parseCareSchedule } from '@/services/ai';
import { createCareSchedule } from '@/services/care';

import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { usePetStore } from '@/stores/usePetStore';

import type { CareRepeat, CareScheduleType } from '@/types/care';

import {
  getRepeatFromPreset,
  getRepeatOptions,
  type RepeatPreset,
} from '@/utils/care';

import { toDateString } from '@/utils/date';

import {
  DEFAULT_NOTIFICATION_TIME,
  requestNotificationPermission,
  scheduleCareNotification,
} from '@/utils/notification';

const CARE_TYPES: {
  label: string;
  value: CareScheduleType;
}[] = [
  {
    label: '심장사상충',
    value: 'HEARTWORM',
  },
  {
    label: '투약',
    value: 'MEDICATION',
  },
  {
    label: '예방접종',
    value: 'VACCINATION',
  },
  {
    label: '정기검진',
    value: 'CHECKUP',
  },
];

export default function CareCreateScreen() {
  const { type: typeParam } = useLocalSearchParams<{
    type?: string;
  }>();

  const pet = usePetStore((state) => state.pet);

  const addScheduleFromDb = useCareScheduleStore(
    (state) => state.addScheduleFromDb,
  );

  const [type, setType] = useState<CareScheduleType>(
    () =>
      CARE_TYPES.find((item) => item.value === typeParam)?.value ?? 'HEARTWORM',
  );

  const [name, setName] = useState('');

  const [dueDate, setDueDate] = useState(new Date());

  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>('NONE');

  const [dosageText, setDosageText] = useState('');

  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const [notificationTime, setNotificationTime] = useState(
    DEFAULT_NOTIFICATION_TIME,
  );

  /*
   * AI 자연어 입력
   */
  const [aiInput, setAiInput] = useState('');

  const [analyzing, setAnalyzing] = useState(false);

  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length > 0;

  const repeatOptions = getRepeatOptions(type);

  /**
   * 자연어 일정 분석
   *
   * LLM 결과를 바로 저장하지 않고
   * 기존 일정 생성 폼에만 채운다.
   */
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

      /*
       * 관리 종류
       */
      setType(result.type);

      /*
       * 관리 이름
       */
      setName(result.name ?? '');

      /*
       * 복용량
       *
       * MEDICATION이 아니면
       * 기존 복용량을 제거한다.
       */
      setDosageText(
        result.type === 'MEDICATION' ? (result.dosageText ?? '') : '',
      );

      /*
       * 예정일
       *
       * YYYY-MM-DD를 그대로
       * new Date()에 넣으면 UTC로
       * 해석될 수 있으므로
       * local Date로 만든다.
       */
      if (result.dueDate) {
        setDueDate(parseLocalDate(result.dueDate));
      }

      /*
       * 반복
       */
      setRepeatPreset(getRepeatPresetFromRepeat(result.repeat));

      /*
       * 알림 시간
       */
      if (result.notificationTime) {
        setNotificationTime(result.notificationTime);
      }

      /*
       * 사용자가 시간을 명확하게
       * 말해서 LLM이 알림 ON으로
       * 판단한 경우 권한을 확인한다.
       *
       * 단순히 state만 true로 만들면
       * NotificationSetting의
       * 권한 요청 로직을 우회하게 된다.
       */
      if (result.notificationEnabled) {
        const granted = await requestNotificationPermission();

        if (granted) {
          setNotificationEnabled(true);
        } else {
          setNotificationEnabled(false);

          Alert.alert(
            '일정은 정리했어요',
            '알림 권한이 허용되지 않아 알림은 꺼진 상태예요. 필요하면 아래에서 직접 켜주세요.',
          );
        }
      } else {
        setNotificationEnabled(false);
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

  const handleSave = async () => {
    if (!pet || !isValid || saving) {
      return;
    }

    setSaving(true);

    try {
      const schedule = await createCareSchedule({
        petId: pet.id,

        type,

        name: name.trim(),

        dueDate: toDateString(dueDate),

        repeat: getRepeatFromPreset(repeatPreset),

        dosageText:
          type === 'MEDICATION' ? dosageText.trim() || undefined : undefined,

        notificationEnabled,

        notificationTime,
      });

      addScheduleFromDb(schedule);

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

      router.back();
    } catch (error) {
      console.log('CREATE CARE ERROR:', error);

      Alert.alert('일정을 예약하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

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

        {/* AI 자연어 입력 */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIcon}>
              <Sparkles size={18} color={colors.primary[700]} />
            </View>

            <View style={styles.aiTitleArea}>
              <AppText variant="body1">포우미에게 말해보세요</AppText>

              <AppText
                variant="body2"
                color="secondary"
                style={styles.aiDescription}
              >
                평소 말하듯 적으면 일정으로 정리해드려요.
              </AppText>
            </View>
          </View>

          <TextInput
            value={aiInput}
            onChangeText={setAiInput}
            placeholder="예: 매일 저녁 8시에 심장약 1정 먹여야 해"
            placeholderTextColor={colors.neutral[400]}
            multiline
            textAlignVertical="top"
            editable={!analyzing}
            style={styles.aiInput}
          />

          <Pressable
            disabled={!aiInput.trim() || analyzing}
            onPress={handleAnalyze}
            style={({ pressed }) => [
              styles.aiButton,

              (!aiInput.trim() || analyzing) && styles.aiButtonDisabled,

              pressed && !analyzing && styles.aiButtonPressed,
            ]}
          >
            <Sparkles size={16} color={colors.neutral[0]} />

            <AppText variant="label" color="inverse">
              {analyzing ? '정리 중...' : '일정으로 정리하기'}
            </AppText>
          </Pressable>
        </View>

        {/* 관리 종류 */}
        <View style={styles.section}>
          <AppText variant="heading2">관리 종류</AppText>

          <View style={styles.typeGrid}>
            {CARE_TYPES.map((item) => {
              const selected = type === item.value;

              return (
                <Pressable
                  key={item.value}
                  style={[styles.typeCard, selected && styles.typeCardSelected]}
                  onPress={() => {
                    setType(item.value);

                    setRepeatPreset('NONE');

                    if (item.value !== 'MEDICATION') {
                      setDosageText('');
                    }
                  }}
                >
                  {renderTypeIcon(item.value)}

                  <AppText
                    variant="body2"
                    color={selected ? 'brand' : 'primary'}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 관리 이름 */}
        <View style={styles.section}>
          <AppText variant="heading2">관리 이름</AppText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={getPlaceholder(type)}
            placeholderTextColor={colors.neutral[400]}
            style={styles.input}
          />
        </View>

        {/* 복용량 */}
        {type === 'MEDICATION' && (
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
            {repeatOptions.map((item) => {
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
 * LLM에서 받은 repeat을
 * 현재 UI의 RepeatPreset으로 변환한다.
 *
 * 현재 UI에서 지원하는
 * 1일 / 1주 / 1개월 / 1년 반복만
 * 자동 적용한다.
 */
function getRepeatPresetFromRepeat(repeat?: CareRepeat): RepeatPreset {
  if (!repeat) {
    return 'NONE';
  }

  if (repeat.unit === 'DAY' && repeat.interval === 1) {
    return 'DAILY';
  }

  if (repeat.unit === 'WEEK' && repeat.interval === 1) {
    return 'WEEKLY';
  }

  if (repeat.unit === 'MONTH' && repeat.interval === 1) {
    return 'MONTHLY';
  }

  if (repeat.unit === 'YEAR' && repeat.interval === 1) {
    return 'YEARLY';
  }

  return 'NONE';
}

/**
 * YYYY-MM-DD를 로컬 Date로 변환한다.
 *
 * new Date('2026-10-14') 형태는
 * UTC로 파싱될 가능성이 있으므로
 * 직접 년/월/일을 넣는다.
 */
function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day, 12, 0, 0);
}

function getPlaceholder(type: CareScheduleType) {
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

function renderTypeIcon(type: CareScheduleType) {
  const props = {
    size: 22,
    color: colors.primary[700],
  };

  switch (type) {
    case 'HEARTWORM':
      return <HeartPulse {...props} />;

    case 'MEDICATION':
      return <Pill {...props} />;

    case 'VACCINATION':
      return <ShieldCheck {...props} />;

    case 'CHECKUP':
      return <Hospital {...props} />;
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

  /*
   * AI
   */
  aiCard: {
    marginBottom: 32,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },

  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  aiIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  aiTitleArea: {
    flex: 1,
    marginLeft: 12,
  },

  aiDescription: {
    marginTop: 3,
  },

  aiInput: {
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
    fontFamily: 'Pretendard-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.neutral[900],
  },

  aiButton: {
    minHeight: 46,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
  },

  aiButtonDisabled: {
    opacity: 0.45,
  },

  aiButtonPressed: {
    opacity: 0.8,
  },

  /*
   * 기존 form
   */
  section: {
    marginBottom: 32,
    gap: 12,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  typeCard: {
    width: '48%',
    minHeight: 92,
    padding: 16,
    gap: 10,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  typeCardSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
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

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: colors.neutral[50],
  },
});
