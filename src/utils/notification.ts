import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
function getCareNotificationIdentifier(scheduleId: string) {
  return `care-${scheduleId}`;
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
  const [year, month, day] = dueDate.split('-').map(Number);
  const [hour, minute] = notificationTime.split(':').map(Number);

  const triggerDate = new Date(year, month - 1, day, hour, minute, 0);

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
