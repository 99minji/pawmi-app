import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CareSchedule } from '@/types/care';

type CareScheduleState = {
  schedules: CareSchedule[];

  addSchedule: (schedule: CareSchedule) => void;

  updateSchedule: (id: string, updates: Partial<CareSchedule>) => void;

  completeSchedule: (id: string) => void;

  removeSchedule: (id: string) => void;

  setNotificationId: (id: string, notificationId: string) => void;
};

export const useCareScheduleStore = create<CareScheduleState>()(
  persist(
    (set) => ({
      schedules: [],

      addSchedule: (schedule) =>
        set((state) => ({
          schedules: [schedule, ...state.schedules],
        })),

      completeSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === id
              ? {
                  ...schedule,
                  completedAt: new Date().toISOString(),
                }
              : schedule,
          ),
        })),

      removeSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((schedule) => schedule.id !== id),
        })),

      setNotificationId: (id, notificationId) =>
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === id
              ? {
                  ...schedule,
                  notificationId,
                }
              : schedule,
          ),
        })),

      updateSchedule: (id, updates) =>
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === id
              ? {
                  ...schedule,
                  ...updates,
                }
              : schedule,
          ),
        })),
    }),
    {
      name: 'pawmi-care-schedules',

      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
