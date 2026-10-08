import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { HealthRecord, WeightRecord } from '@/types/health';

type HealthState = {
  records: HealthRecord[];

  setRecords: (records: HealthRecord[]) => void;

  addRecord: (record: HealthRecord) => void;

  addWeightRecord: (petId: string, weightKg: number) => void;

  removeRecord: (id: string) => void;
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      records: [],

      setRecords: (records) =>
        set({
          records,
        }),

      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records],
        })),

      addWeightRecord: (petId, weightKg) => {
        const now = new Date().toISOString();

        const record: WeightRecord = {
          id: `weight-${Date.now()}`,
          petId,
          type: 'WEIGHT',
          title: `체중 ${weightKg}kg`,
          weightKg,
          occurredAt: now,
          createdAt: now,
        };

        set((state) => ({
          records: [record, ...state.records],
        }));
      },

      removeRecord: (id) =>
        set((state) => ({
          records: state.records.filter((record) => record.id !== id),
        })),
    }),
    {
      name: 'pawmi-health',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
