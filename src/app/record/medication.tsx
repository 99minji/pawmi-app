import { router } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { createMedicationRecord } from '@/services/health';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareSchedule } from '@/types/care';
import { dateToOccurredAt } from '@/utils/date';

export default function MedicationRecordScreen() {
  const schedules = useCareScheduleStore((state) => state.schedules);

  const [medicationName, setMedicationName] = useState('');

  const [dosageText, setDosageText] = useState('');

  const [memo, setMemo] = useState('');

  const [occurredDate, setOccurredDate] = useState(() => new Date());

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );

  const [saving, setSaving] = useState(false);

  const pet = usePetStore((state) => state.pet);

  const addRecord = useHealthStore((state) => state.addRecord);

  const isValid = medicationName.trim().length > 0;

  /**
   * 복약 일정에 등록했던 약 목록
   *
   * 완료된 일정도 포함하고, 반복 일정처럼 같은 약(이름+복용량)이 여러 번 있으면 하나만 보여준다.
   */
  const medicationSchedules = useMemo(() => {
    const medicationMap = new Map<string, CareSchedule>();

    schedules
      .filter(
        (schedule) =>
          schedule.petId === pet?.id && schedule.type === 'MEDICATION',
      )
      .forEach((schedule) => {
        const key = [
          schedule.name.trim().toLowerCase(),
          schedule.dosageText?.trim().toLowerCase() ?? '',
        ].join('|');

        if (!medicationMap.has(key)) {
          medicationMap.set(key, schedule);
        }
      });

    return Array.from(medicationMap.values());
  }, [schedules, pet?.id]);

  const handleSelectSchedule = (schedule: CareSchedule) => {
    setSelectedScheduleId(schedule.id);

    setMedicationName(schedule.name);

    setDosageText(schedule.dosageText ?? '');
  };

  const handleSave = async () => {
    if (!pet || saving) {
      return;
    }

    const trimmedName = medicationName.trim();

    if (!trimmedName) {
      Alert.alert('약 이름을 입력해주세요');

      return;
    }

    setSaving(true);

    try {
      const record = await createMedicationRecord(
        pet.id,
        trimmedName,
        dosageText,
        memo,
        dateToOccurredAt(occurredDate),
      );

      addRecord(record);

      router.back();
    } catch (error) {
      console.log('CREATE MEDICATION ERROR:', error);

      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
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
        <View>
          <AppText variant="heading1">먹인 약을 기록해볼까요?</AppText>

          <AppText variant="body1" color="secondary" style={styles.description}>
            약 이름과 복용 정보를 남겨두면 나중에 쉽게 확인할 수 있어요.
          </AppText>
        </View>

        {medicationSchedules.length > 0 && (
          <View style={styles.section}>
            <AppText variant="heading2">등록된 약</AppText>

            <AppText variant="body2" color="secondary">
              복약 일정에 등록된 약을 선택하면 바로 기록할 수 있어요.
            </AppText>

            <View style={styles.medicationList}>
              {medicationSchedules.map((schedule) => {
                const selected = selectedScheduleId === schedule.id;

                return (
                  <Pressable
                    key={schedule.id}
                    onPress={() => handleSelectSchedule(schedule)}
                    style={[
                      styles.medicationCard,
                      selected && styles.medicationCardSelected,
                    ]}
                  >
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <AppText variant="body1">{schedule.name}</AppText>

                      {schedule.dosageText && (
                        <AppText
                          variant="body2"
                          color="secondary"
                          style={{
                            marginTop: 4,
                          }}
                        >
                          {schedule.dosageText}
                        </AppText>
                      )}
                    </View>

                    {selected && (
                      <AppText variant="label" color="brand">
                        선택됨
                      </AppText>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <AppText variant="label" style={styles.label}>
              약 이름
            </AppText>

            <TextInput
              value={medicationName}
              onChangeText={(value) => {
                setMedicationName(value);
                setSelectedScheduleId(null);
              }}
              placeholder="예: 하트가드"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label">복용량</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={dosageText}
              onChangeText={(value) => {
                setDosageText(value);
                setSelectedScheduleId(null);
              }}
              placeholder="예: 1정"
              placeholderTextColor={colors.neutral[400]}
              maxLength={50}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <DateField
            label="복용 날짜"
            value={occurredDate}
            onChange={setOccurredDate}
            maximumDate={new Date()}
          />

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label">복용 메모</AppText>

              <AppText variant="label" color="tertiary">
                선택
              </AppText>
            </View>

            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="예: 저녁 식후에 사료에 섞어서 먹였어요"
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
          label={saving ? '기록 중...' : '기록하기'}
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

  section: {
    marginTop: 36,
    gap: 8,
  },

  form: {
    marginTop: 36,
    gap: 28,
  },

  field: {
    gap: 10,
  },

  label: {
    marginBottom: 2,
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

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  medicationList: {
    gap: 10,
    marginTop: 12,
  },

  medicationCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },

  medicationCardSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
});
