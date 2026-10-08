import { create } from 'zustand';

import type { HealthRecord } from '@/types/health';

type HealthState = {
  records: HealthRecord[];

  setRecords: (records: HealthRecord[]) => void;

  addRecord: (record: HealthRecord) => void;

  removeRecord: (id: string) => void;

  clearRecords: () => void;

  replaceRecord: (record: HealthRecord) => void;
};

export const useHealthStore = create<HealthState>((set) => ({
  records: [],

  setRecords: (records) =>
    set({
      records,
    }),

  addRecord: (record) =>
    set((state) => ({
      records: [record, ...state.records],
    })),

  removeRecord: (id) =>
    set((state) => ({
      records: state.records.filter((record) => record.id !== id),
    })),

  clearRecords: () =>
    set({
      records: [],
    }),

  replaceRecord: (record) =>
    set((state) => ({
      records: state.records.map((item) =>
        item.id === record.id ? record : item,
      ),
    })),
}));
