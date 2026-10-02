import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, CalendarDays, Repeat2, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { useCareScheduleStore } from '@/stores/useCareScheduleStore';
import { usePetStore } from '@/stores/usePetStore';
import type { CareRepeat, CareSchedule } from '@/types/care';
import {
  cancelCareNotification,
  scheduleCareNotification,
} from '@/utils/notification';

type RepeatPreset = 'NONE' | 'MONTHLY' | 'SIX_MONTHS' | 'YEARLY';

export default function CareDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const pet = usePetStore((state) => state.pet);

  const schedules = useCareScheduleStore((state) => state.schedules);

  const updateSchedule = useCareScheduleStore((state) => state.updateSchedule);

  const removeSchedule = useCareScheduleStore((state) => state.removeSchedule);

  const setNotificationId = useCareScheduleStore(
    (state) => state.setNotificationId,
  );

  const schedule = useMemo(
    () => schedules.find((item) => item.id === id),
    [schedules, id],
  );

  const initialDate = useMemo(() => {
    if (!schedule) {
      return new Date();
    }

    const [year, month, day] = schedule.dueDate.split('-').map(Number);

    return new Date(year, month - 1, day);
  }, [schedule]);

  const [dueDate, setDueDate] = useState(initialDate);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [repeatPreset, setRepeatPreset] = useState<RepeatPreset>(
    getRepeatPreset(schedule?.repeat),
  );

  const [notificationEnabled, setNotificationEnabled] = useState(
    schedule?.notificationEnabled ?? true,
  );

  if (!schedule || !pet) {
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body1" color="secondary">
          일정을 찾을 수 없어요.
        </AppText>
      </View>
    );
  }

  const handleSave = async () => {
    const dueDateString = toDateString(dueDate);

    const repeat = getRepeat(repeatPreset);

    // 기존 예약 제거
    if (schedule.notificationId) {
      await cancelCareNotification(schedule.notificationId);
    }

    let nextNotificationId: string | undefined;

    // 새 알림 예약
    if (notificationEnabled) {
      const notificationId = await scheduleCareNotification({
        scheduleId: schedule.id,

        petName: pet.name,

        careName: schedule.name,

        dueDate: dueDateString,
      });

      nextNotificationId = notificationId ?? undefined;
    }

    updateSchedule(schedule.id, {
      dueDate: dueDateString,

      repeat,

      notificationEnabled,

      notificationId: nextNotificationId,
    });

    router.back();
  };

  const handleDelete = () => {
    Alert.alert('일정을 삭제할까요?', '삭제한 일정은 다시 복구할 수 없어요.', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (schedule.notificationId) {
            await cancelCareNotification(schedule.notificationId);
          }

          removeSchedule(schedule.id);

          router.back();
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
          날짜와 반복 주기를 변경할 수 있어요.
        </AppText>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <CalendarDays size={22} color={colors.primary[700]} />
          </View>

          <View style={{ flex: 1 }}>
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

        <View style={styles.section}>
          <AppText variant="heading2">예정일</AppText>

          <Pressable
            style={styles.settingRow}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <CalendarDays size={19} color={colors.primary[700]} />
              </View>

              <View>
                <AppText variant="body1">관리 날짜</AppText>

                <AppText
                  variant="body2"
                  color="secondary"
                  style={styles.settingDescription}
                >
                  {formatDate(dueDate)}
                </AppText>
              </View>
            </View>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              locale="ko-KR"
              minimumDate={new Date()}
              onChange={(_event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }

                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="heading2">반복</AppText>

          <View style={styles.settingTitleRow}>
            <Repeat2 size={18} color={colors.primary[700]} />

            <AppText variant="body2" color="secondary">
              필요한 주기를 선택해주세요.
            </AppText>
          </View>

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

        <View style={styles.section}>
          <AppText variant="heading2">알림</AppText>

          <View style={styles.notificationRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Bell size={19} color={colors.primary[700]} />
              </View>

              <View style={{ flex: 1 }}>
                <AppText variant="body1">관리 알림</AppText>

                <AppText
                  variant="body2"
                  color="secondary"
                  style={styles.settingDescription}
                >
                  예정일 오전 9시에 알려드려요.
                </AppText>
              </View>
            </View>

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
          </View>
        </View>

        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={18} color={colors.error[500]} />

          <AppText
            variant="body1"
            style={{
              color: colors.error[500],
            }}
          >
            일정 삭제
          </AppText>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="변경사항 저장하기" onPress={handleSave} />
      </View>
    </View>
  );
}

function toDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getRepeatPreset(repeat?: CareRepeat): RepeatPreset {
  if (!repeat) {
    return 'NONE';
  }

  if (repeat.unit === 'MONTH' && repeat.interval === 1) {
    return 'MONTHLY';
  }

  if (repeat.unit === 'MONTH' && repeat.interval === 6) {
    return 'SIX_MONTHS';
  }

  if (repeat.unit === 'YEAR' && repeat.interval === 1) {
    return 'YEARLY';
  }

  return 'NONE';
}

function getRepeat(preset: RepeatPreset): CareRepeat | undefined {
  switch (preset) {
    case 'MONTHLY':
      return {
        unit: 'MONTH',
        interval: 1,
      };

    case 'SIX_MONTHS':
      return {
        unit: 'MONTH',
        interval: 6,
      };

    case 'YEARLY':
      return {
        unit: 'YEAR',
        interval: 1,
      };

    default:
      return undefined;
  }
}

function formatScheduleType(type: CareSchedule['type']) {
  switch (type) {
    case 'VACCINATION':
      return '예방 일정';

    case 'MEDICATION':
      return '투약 일정';

    case 'HEARTWORM':
      return '심장사상충 예방';

    case 'CHECKUP':
      return '정기 검진';
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

  summaryDescription: {
    marginTop: 4,
  },

  section: {
    marginBottom: 28,
  },

  settingRow: {
    marginTop: 12,

    backgroundColor: colors.neutral[0],

    borderRadius: 16,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    padding: 16,
  },

  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,

    flex: 1,
  },

  settingIcon: {
    width: 40,
    height: 40,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.primary[100],
  },

  settingDescription: {
    marginTop: 4,
  },

  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,

    marginTop: 8,
    marginBottom: 12,
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

  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginTop: 12,

    padding: 16,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: colors.neutral[200],

    backgroundColor: colors.neutral[0],
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

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,

    backgroundColor: colors.neutral[50],
  },
});
