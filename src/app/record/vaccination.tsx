import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { DateField } from '@/components/common/DateField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { createCareSchedule } from '@/services/care';
import { createVaccinationRecord } from '@/services/health';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { dateToOccurredAt, toDateString } from '@/utils/date';
import {
  DEFAULT_NOTIFICATION_TIME,
  scheduleCareNotification,
} from '@/utils/notification';

type RepeatPreset = 'NONE' | 'MONTHLY' | 'SIX_MONTHS' | 'YEARLY';

export default function VaccinationRecordScreen() {
  const [vaccinationName, setVaccinationName] = useState('');

  const [memo, setMemo] = useState('');

  const [occurredDate, setOccurredDate] = useState(() => new Date());

  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>('NONE');

  const [saving, setSaving] = useState(false);

  const pet = usePetStore((state) => state.pet);

  const addRecord = useHealthStore((state) => state.addRecord);
  const addScheduleFromDb = useCareScheduleStore(
    (state) => state.addScheduleFromDb,
  );

  const isValid = vaccinationName.trim().length > 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRepeat = () => {
    switch (repeatPreset) {
      case 'MONTHLY':
        return {
          unit: 'MONTH' as const,
          interval: 1,
        };

      case 'SIX_MONTHS':
        return {
          unit: 'MONTH' as const,
          interval: 6,
        };

      case 'YEARLY':
        return {
          unit: 'YEAR' as const,
          interval: 1,
        };

      default:
        return undefined;
    }
  };

  const handleSave = async () => {
    if (!pet || saving) {
      return;
    }

    const trimmedName = vaccinationName.trim();

    if (!trimmedName) {
      Alert.alert('예방접종 이름을 입력해주세요');

      return;
    }

    setSaving(true);

    try {
      const record = await createVaccinationRecord(
        pet.id,
        trimmedName,
        memo,
        dateToOccurredAt(occurredDate),
      );

      addRecord(record);
    } catch (error) {
      console.log('CREATE VACCINATION ERROR:', error);

      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해주세요.');

      setSaving(false);

      return;
    }

    if (nextDueDate) {
      try {
        await saveNextSchedule(trimmedName, toDateString(nextDueDate));
      } catch (error) {
        console.log('CREATE CARE SCHEDULE ERROR:', error);

        // 예방 기록은 이미 저장됐으므로 재시도로 기록이 중복되지 않게 화면은 닫는다.
        Alert.alert(
          '다음 예정일을 등록하지 못했어요',
          '예방 기록은 저장됐어요. 반려동물 탭의 예정된 관리에서 다시 예약해주세요.',
        );
      }
    }

    setSaving(false);

    router.back();
  };

  /**
   * 다음 예정일을 서버에 저장하고,
   * 홈의 오늘 할 일과 알림을 위해 로컬 일정에도 추가한다.
   */
  const saveNextSchedule = async (name: string, dueDate: string) => {
    if (!pet) {
      return;
    }

    const created = await createCareSchedule({
      petId: pet.id,
      type: 'VACCINATION',
      name,
      dueDate,
      repeat: getRepeat(),
      notificationEnabled: false,
      notificationTime: DEFAULT_NOTIFICATION_TIME,
    });

    addScheduleFromDb(created);

    if (created.notificationEnabled) {
      await scheduleCareNotification({
        scheduleId: created.id,
        petName: pet.name,
        careName: created.name,
        dueDate: created.dueDate,
        notificationTime: created.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="heading1">예방 관리를 기록해볼까요?</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          다음 관리 예정일도 함께 남겨두면 놓치지 않도록 챙길 수 있어요.
        </AppText>

        <View style={styles.form}>
          <View style={styles.field}>
            <AppText variant="label">예방 항목</AppText>

            <TextInput
              value={vaccinationName}
              onChangeText={setVaccinationName}
              placeholder="예: 심장사상충"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
            />
          </View>

          <DateField
            label="접종 날짜"
            value={occurredDate}
            onChange={setOccurredDate}
            maximumDate={new Date()}
          />

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label">다음 예정일</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <AppText
                variant="body1"
                color={nextDueDate ? 'primary' : 'tertiary'}
              >
                {nextDueDate ? formatDate(nextDueDate) : '날짜를 선택해주세요'}
              </AppText>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={nextDueDate ?? new Date()}
                mode="date"
                locale="ko-KR"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);

                  // Android는 취소(dismissed) 시에도 기존 value로 onChange를 호출한다.
                  if (event.type === 'set' && selectedDate) {
                    setNextDueDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <AppText variant="label">반복</AppText>

            <View style={styles.repeatOptions}>
              {[
                {
                  label: '반복 없음',
                  value: 'NONE',
                },
                {
                  label: '매월',
                  value: 'MONTHLY',
                },
                {
                  label: '6개월마다',
                  value: 'SIX_MONTHS',
                },
                {
                  label: '매년',
                  value: 'YEARLY',
                },
              ].map((item) => {
                const selected = repeatPreset === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setRepeatPreset(item.value as RepeatPreset)}
                    style={[
                      styles.repeatOption,
                      selected && styles.repeatOptionSelected,
                    ]}
                  >
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

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label">메모</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="예: 동물병원에서 접종, 접종 후 특이 반응 없음"
              placeholderTextColor={colors.neutral[400]}
              multiline
              maxLength={200}
              style={[styles.input, styles.memoInput]}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? '기록 중...' : '예방 기록하기'}
          disabled={!isValid || saving}
          onPress={handleSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 24,
  },

  description: {
    marginTop: 8,
    maxWidth: 320,
  },

  form: {
    marginTop: 36,
    gap: 28,
  },

  field: {
    gap: 10,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  input: {
    height: 56,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    borderRadius: 14,

    backgroundColor: colors.neutral[0],

    paddingHorizontal: 16,

    fontFamily: 'Pretendard-Regular',

    fontSize: 16,

    color: colors.neutral[900],
  },

  memoInput: {
    height: 110,
    paddingTop: 16,
    paddingBottom: 16,
  },

  dateButton: {
    height: 56,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    borderRadius: 14,

    backgroundColor: colors.neutral[0],

    paddingHorizontal: 16,

    justifyContent: 'center',
  },

  repeatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  repeatOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  repeatOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
