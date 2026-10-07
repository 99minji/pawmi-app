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

export async function requestNotificationPermission() {
  if (!Device.isDevice) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();

  let status = current.status;

  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();

    status = result.status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('care-reminder', {
      name: '관리 알림',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return status === 'granted';
}

export const DEFAULT_NOTIFICATION_TIME = '09:00';

type ScheduleCareNotificationParams = {
  scheduleId: string;
  petName: string;
  careName: string;
  dueDate: string;
  notificationTime?: string;
};

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

  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
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

  return notificationId;
}

// 일정 완료 시 기존 알림 취소
export async function cancelCareNotification(notificationId?: string) {
  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
