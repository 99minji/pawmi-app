import { colors } from '@/constants/colors';
import { updateHealthRecordById } from '@/services/health';
import { useHealthStore } from '@/stores/useHealthStore';
import { HealthRecord } from '@/types/health';
import { dateToOccurredAt, parseDateString } from '@/utils/date';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../common/AppText';
import { DateField } from '../common/DateField';
import { PrimaryButton } from '../common/PrimaryButton';

export default function HealthRecordEditForm({
  record,
}: {
  record: HealthRecord;
}) {
  const replaceRecord = useHealthStore((state) => state.replaceRecord);

  const [saving, setSaving] = useState(false);

  const [memo, setMemo] = useState(record.memo ?? '');

  const [occurredDate, setOccurredDate] = useState(
    parseDateString(record.occurredAt.slice(0, 10)),
  );

  const [weight, setWeight] = useState(
    record.type === 'WEIGHT' ? String(record.weightKg) : '',
  );

  const [symptom, setSymptom] = useState(
    record.type === 'SYMPTOM' ? record.symptom : '',
  );

  const [medicationName, setMedicationName] = useState(
    record.type === 'MEDICATION' ? record.medicationName : '',
  );

  const [dosageText, setDosageText] = useState(
    record.type === 'MEDICATION' ? (record.dosageText ?? '') : '',
  );

  const [vaccinationName, setVaccinationName] = useState(
    record.type === 'VACCINATION' ? record.vaccinationName : '',
  );

  const [visitReason, setVisitReason] = useState(
    record.type === 'VET_VISIT' ? record.visitReason : '',
  );

  const [clinicName, setClinicName] = useState(
    record.type === 'VET_VISIT' ? (record.clinicName ?? '') : '',
  );

  const handleSave = async () => {
    if (saving) {
      return;
    }

    if (record.type === 'SYMPTOM' && !symptom.trim()) {
      Alert.alert('증상을 입력해주세요');

      return;
    }

    if (record.type === 'MEDICATION' && !medicationName.trim()) {
      Alert.alert('약 이름을 입력해주세요');

      return;
    }

    if (record.type === 'VACCINATION' && !vaccinationName.trim()) {
      Alert.alert('예방접종 이름을 입력해주세요');

      return;
    }

    if (record.type === 'VET_VISIT' && !visitReason.trim()) {
      Alert.alert('방문 이유를 입력해주세요');

      return;
    }

    try {
      const occurredAt = dateToOccurredAt(occurredDate);

      let updatedRecord: HealthRecord;

      if (record.type === 'WEIGHT') {
        const weightKg = Number(weight);

        if (Number.isNaN(weightKg) || weightKg <= 0) {
          Alert.alert('체중을 확인해주세요');

          return;
        }
      }

      setSaving(true);

      switch (record.type) {
        case 'WEIGHT': {
          const weightKg = Number(weight);

          if (Number.isNaN(weightKg) || weightKg <= 0) {
            Alert.alert('체중을 확인해주세요');

            return;
          }

          updatedRecord = await updateHealthRecordById(record.id, {
            type: 'WEIGHT',
            weightKg,
            memo,
            occurredAt,
          });

          break;
        }

        case 'SYMPTOM':
          updatedRecord = await updateHealthRecordById(record.id, {
            type: 'SYMPTOM',
            symptom: symptom.trim(),
            memo,
            occurredAt,
          });

          break;

        case 'MEDICATION':
          updatedRecord = await updateHealthRecordById(record.id, {
            type: 'MEDICATION',
            medicationName: medicationName.trim(),
            dosageText,
            memo,
            occurredAt,
          });

          break;

        case 'VACCINATION':
          updatedRecord = await updateHealthRecordById(record.id, {
            type: 'VACCINATION',
            vaccinationName: vaccinationName.trim(),
            memo,
            occurredAt,
          });

          break;

        case 'VET_VISIT':
          updatedRecord = await updateHealthRecordById(record.id, {
            type: 'VET_VISIT',
            visitReason: visitReason.trim(),
            clinicName,
            memo,
            occurredAt,
          });

          break;
      }

      replaceRecord(updatedRecord);

      router.back();
    } catch (error) {
      console.log('UPDATE HEALTH ERROR:', error);

      Alert.alert('수정하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="heading1">기록을 수정해볼까요?</AppText>

        <View style={styles.form}>
          {record.type === 'WEIGHT' && (
            <Field
              label="체중"
              value={weight}
              onChangeText={setWeight}
              suffix="kg"
            />
          )}

          {record.type === 'SYMPTOM' && (
            <Field label="증상" value={symptom} onChangeText={setSymptom} />
          )}

          {record.type === 'MEDICATION' && (
            <>
              <Field
                label="약 이름"
                value={medicationName}
                onChangeText={setMedicationName}
              />

              <Field
                label="복용 정보"
                value={dosageText}
                onChangeText={setDosageText}
              />
            </>
          )}

          {record.type === 'VACCINATION' && (
            <Field
              label="예방접종"
              value={vaccinationName}
              onChangeText={setVaccinationName}
            />
          )}

          {record.type === 'VET_VISIT' && (
            <>
              <Field
                label="방문 이유"
                value={visitReason}
                onChangeText={setVisitReason}
              />

              <Field
                label="병원"
                value={clinicName}
                onChangeText={setClinicName}
              />
            </>
          )}

          <DateField
            label="기록 날짜"
            value={occurredDate}
            onChange={setOccurredDate}
            maximumDate={new Date()}
          />

          <Field label="메모" value={memo} onChangeText={setMemo} multiline />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={saving ? '저장 중...' : '수정 내용 저장하기'}
          disabled={saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  suffix,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>

      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          keyboardType={suffix === 'kg' ? 'decimal-pad' : 'default'}
          style={[styles.input, multiline && styles.multilineInput]}
        />

        {suffix ? <AppText variant="body1">{suffix}</AppText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },

  form: {
    marginTop: 32,
    gap: 28,
  },

  field: {
    gap: 10,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  input: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 16,

    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: 16,

    backgroundColor: colors.surface.card,

    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: colors.neutral[900],
  },

  multilineInput: {
    minHeight: 120,
    paddingTop: 16,
    paddingBottom: 16,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.background.primary,
  },
});
