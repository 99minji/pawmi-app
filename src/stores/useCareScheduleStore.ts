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

  replaceSchedule: (schedule: CareSchedule) => void;

  removeScheduleFromStore: (id: string) => void;
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

      removeSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((schedule) => schedule.id !== id),
        })),

      replaceSchedule: (schedule) =>
        set((state) => ({
          schedules: state.schedules.map((item) =>
            item.id === schedule.id ? schedule : item,
          ),
        })),

      removeScheduleFromStore: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'pawmi-care-schedules',

      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
