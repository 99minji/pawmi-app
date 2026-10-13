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

import { HeartPulse, Hospital, Pill, ShieldCheck } from 'lucide-react-native';

import { NotificationSetting } from '@/components/care/NotificationSetting';
import { AppText } from '@/components/common/AppText';
import { DateField } from '@/components/common/DateField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';

import { createCareSchedule } from '@/services/care';

import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { usePetStore } from '@/stores/usePetStore';

import type { CareScheduleType } from '@/types/care';

import {
  getRepeatFromPreset,
  getRepeatOptions,
  type RepeatPreset,
} from '@/utils/care';
import { toDateString } from '@/utils/date';
import {
  DEFAULT_NOTIFICATION_TIME,
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

  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const [notificationTime, setNotificationTime] = useState(
    DEFAULT_NOTIFICATION_TIME,
  );

  const [saving, setSaving] = useState(false);

  const isValid = name.trim().length > 0;

  const repeatOptions = getRepeatOptions(type);

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
      >
        <AppText variant="heading1">관리 일정을 예약해볼까요?</AppText>

        <AppText variant="body1" color="secondary" style={styles.description}>
          {pet.name}에게 필요한 관리를 미리 등록해두세요.
        </AppText>

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

        <View style={styles.section}>
          <AppText variant="heading2">예정일</AppText>

          <DateField
            value={dueDate}
            onChange={setDueDate}
            minimumDate={new Date()}
          />
        </View>

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
    marginBottom: 32,
  },

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
