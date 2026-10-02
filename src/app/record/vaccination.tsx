import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import { toDateString } from '@/utils/date';
import { scheduleCareNotification } from '@/utils/notification';

type RepeatPreset = 'NONE' | 'MONTHLY' | 'SIX_MONTHS' | 'YEARLY';

export default function VaccinationRecordScreen() {
  const [vaccinationName, setVaccinationName] = useState('');

  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>('NONE');

  const pet = usePetStore((state) => state.pet);

  const addRecord = useHealthStore((state) => state.addRecord);
  const addSchedule = useCareScheduleStore((state) => state.addSchedule);

  const updateSchedule = useCareScheduleStore((state) => state.updateSchedule);

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
    if (!pet || !isValid) {
      return;
    }

    const now = new Date().toISOString();

    const name = vaccinationName.trim();

    addRecord({
      id: `vaccination-${Date.now()}`,
      petId: pet.id,
      type: 'VACCINATION',

      title: `${name} 예방`,

      vaccinationName: name,

      occurredAt: now,

      createdAt: now,
    });

    if (nextDueDate) {
      const scheduleId = `care-${Date.now()}`;

      const dueDate = toDateString(nextDueDate);

      const repeat = getRepeat();

      addSchedule({
        id: scheduleId,
        petId: pet.id,
        type: 'VACCINATION',
        name,
        dueDate,

        repeat,

        notificationEnabled: true,

        createdAt: now,
      });

      const notificationId = await scheduleCareNotification({
        scheduleId,
        petName: pet.name,
        careName: name,
        dueDate,
      });

      if (notificationId) {
        updateSchedule(scheduleId, {
          notificationId,
        });
      }
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
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

                  if (selectedDate) {
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
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="예방 기록하기"
          disabled={!isValid}
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

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
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
