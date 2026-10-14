import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { CareSchedule } from '@/types/care';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CARE_NOTIFICATION_CHANNEL_ID = 'care-reminder';

async function ensureCareNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    CARE_NOTIFICATION_CHANNEL_ID,
    {
      name: '관리 알림',
      importance: Notifications.AndroidImportance.HIGH,
    },
  );
}

export async function requestNotificationPermission() {
  if (!Device.isDevice) {
    return false;
  }

  await ensureCareNotificationChannel();

  const current = await Notifications.getPermissionsAsync();

  let status = current.status;

  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();

    status = result.status;
  }

  return status === 'granted';
}

export const DEFAULT_NOTIFICATION_TIME = '09:00';

/**
 * 알림 ID를 일정 ID로 고정한다.
 *
 * 알림 ID를 따로 저장하지 않아도(앱 재시작 후에도) 일정 ID만으로 취소·재예약할 수 있다.
 */
const CARE_NOTIFICATION_PREFIX = 'care-';

function getCareNotificationIdentifier(scheduleId: string) {
  return `${CARE_NOTIFICATION_PREFIX}${scheduleId}`;
}

// 예정일 + 알림 시간으로 실제 알림 시각을 만든다. (로컬 시간 기준)
function getCareTriggerDate(dueDate: string, notificationTime: string) {
  const [year, month, day] = dueDate.split('-').map(Number);
  const [hour, minute] = notificationTime.split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute, 0);
}

type ScheduleCareNotificationParams = {
  scheduleId: string;
  petName: string;
  careName: string;
  dueDate: string;
  notificationTime?: string;
};

/**
 * 예정일 notificationTime(기본 오전 9시)에 관리 알림을 예약한다.
 *
 * 같은 일정의 기존 알림은 덮어쓴다. 알림 실패가 일정 저장을 막지 않도록 에러는 로그만 남긴다.
 */
export async function scheduleCareNotification({
  scheduleId,
  petName,
  careName,
  dueDate,
  notificationTime = DEFAULT_NOTIFICATION_TIME,
}: ScheduleCareNotificationParams) {
  const triggerDate = getCareTriggerDate(dueDate, notificationTime);

  try {
    await ensureCareNotificationChannel();

    await cancelCareNotification(scheduleId);

    if (triggerDate.getTime() <= Date.now()) {
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: getCareNotificationIdentifier(scheduleId),

      content: {
        title: `${petName}의 관리 일정이 있어요`,
        body: `오늘은 ${careName} 관리하는 날이에요.`,
        data: {
          scheduleId,
        },
        sound: true,
      },

      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,

        ...(Platform.OS === 'android'
          ? {
              channelId: 'care-reminder',
            }
          : {}),
      },
    });
    return true;
  } catch (error) {
    console.warn('알림을 예약하지 못했어요.', error);

    return false;
  }
}

// 일정 완료·삭제 시 기존 알림 취소
export async function cancelCareNotification(scheduleId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      getCareNotificationIdentifier(scheduleId),
    );
  } catch (error) {
    console.warn('알림을 취소하지 못했어요.', error);
  }
}

// 로그아웃 시 이전 사용자의 예약 알림을 모두 취소
export async function cancelAllCareNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('알림을 취소하지 못했어요.', error);
  }
}

/**
 * DB 일정과 OS에 예약된 관리 알림을 맞춘다.
 *
 * 예약 대상: 미완료 + 알림 ON + 알림 시각이 현재보다 미래
 * - 대상인데 OS에 없으면 예약
 * - OS에 있는데 대상이 아니면 취소
 * care- 로 시작하는 Pawmi 관리 알림만 다룬다.
 */
export async function reconcileCareNotifications(
  schedules: CareSchedule[],
  petName: string,
) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const scheduledIds = new Set(
      scheduled
        .map((notification) => notification.identifier)
        .filter((identifier) =>
          identifier.startsWith(CARE_NOTIFICATION_PREFIX),
        ),
    );

    const now = Date.now();

    const targets = schedules.filter(
      (schedule) =>
        !schedule.completedAt &&
        schedule.notificationEnabled &&
        getCareTriggerDate(
          schedule.dueDate,
          schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
        ).getTime() > now,
    );

    const targetIds = new Set(
      targets.map((schedule) => getCareNotificationIdentifier(schedule.id)),
    );

    for (const identifier of scheduledIds) {
      if (!targetIds.has(identifier)) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
    }

    for (const schedule of targets) {
      if (!scheduledIds.has(getCareNotificationIdentifier(schedule.id))) {
        await scheduleCareNotification({
          scheduleId: schedule.id,
          petName,
          careName: schedule.name,
          dueDate: schedule.dueDate,
          notificationTime:
            schedule.notificationTime ?? DEFAULT_NOTIFICATION_TIME,
        });
      }
    }
  } catch (error) {
    console.warn('알림을 맞추지 못했어요.', error);
  }
}
