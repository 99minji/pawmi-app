import { create } from 'zustand';

import type { CareSchedule } from '@/types/care';

type CareScheduleState = {
  schedules: CareSchedule[];

  setSchedules: (schedules: CareSchedule[]) => void;

  addScheduleFromDb: (schedule: CareSchedule) => void;

  replaceSchedule: (schedule: CareSchedule) => void;

  removeScheduleFromStore: (id: string) => void;

  clearSchedules: () => void;
};

export const useCareScheduleStore = create<CareScheduleState>((set) => ({
  schedules: [],

  setSchedules: (schedules) =>
    set({
      schedules,
    }),

  addScheduleFromDb: (schedule) =>
    set((state) => ({
      schedules: [...state.schedules, schedule],
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

  clearSchedules: () =>
    set({
      schedules: [],
    }),
}));
