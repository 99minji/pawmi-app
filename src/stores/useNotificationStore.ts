import { create } from 'zustand';

type NotificationState = {
  /**
   * 알림을 눌러 진입했을 때 Today 화면에서 보여줘야 할 일정 ID
   */
  pendingScheduleId: string | null;

  setPendingScheduleId: (scheduleId: string) => void;

  clearPendingScheduleId: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  pendingScheduleId: null,

  setPendingScheduleId: (scheduleId) =>
    set({
      pendingScheduleId: scheduleId,
    }),

  clearPendingScheduleId: () =>
    set({
      pendingScheduleId: null,
    }),
}));
