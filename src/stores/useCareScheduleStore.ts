import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CareSchedule } from '@/types/care';

type CareScheduleState = {
  schedules: CareSchedule[];

  setSchedules: (schedules: CareSchedule[]) => void;
  addSchedule: (schedule: CareSchedule) => void;
  addScheduleFromDb: (schedule: CareSchedule) => void;
  updateSchedule: (id: string, updates: Partial<CareSchedule>) => void;

  completeSchedule: (id: string) => void;

  removeSchedule: (id: string) => void;
};

export const useCareScheduleStore = create<CareScheduleState>()(
  persist(
    (set) => ({
      schedules: [],

      setSchedules: (schedules) =>
        set({
          schedules,
        }),

      addSchedule: (schedule) =>
        set((state) => ({
          schedules: [schedule, ...state.schedules],
        })),

      addScheduleFromDb: (schedule) =>
        set((state) => ({
          schedules: [...state.schedules, schedule],
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
