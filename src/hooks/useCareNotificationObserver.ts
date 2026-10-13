import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useNotificationStore } from '@/stores/useNotificationStore';
import { usePetStore } from '@/stores/usePetStore';

/**
 * 관리 알림을 누르면 Today 탭으로 이동해 해당 일정 카드를 보여준다.
 *
 * - 앱 실행 중: 바로 Today 탭으로 이동한다.
 * - 앱 종료 상태: index가 데이터를 불러온 뒤 Today 탭으로 보내므로 일정 ID만 남겨둔다.
 */
export function useCareNotificationObserver() {
  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const scheduleId = response.notification.request.content.data?.scheduleId;

      if (typeof scheduleId !== 'string') {
        return;
      }

      useNotificationStore.getState().setPendingScheduleId(scheduleId);

      // 같은 알림을 앱 재시작 때 다시 처리하지 않도록 비운다.
      Notifications.clearLastNotificationResponse();

      // 데이터가 아직 없으면(앱 종료 상태에서 진입) index의 Redirect에 맡긴다.
      if (usePetStore.getState().pet) {
        router.navigate('/(tabs)');
      }
    };

    const lastResponse = Notifications.getLastNotificationResponse();

    if (lastResponse) {
      handleResponse(lastResponse);
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => subscription.remove();
  }, []);
}
