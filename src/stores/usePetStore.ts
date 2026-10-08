import { create } from 'zustand';

import type { Pet } from '@/types/pet';

type PetState = {
  pet: Pet | null;

  setPet: (pet: Pet) => void;

  updatePet: (updates: Partial<Pet>) => void;

  clearPet: () => void;
};

export const usePetStore = create<PetState>((set) => ({
  pet: null,

  setPet: (pet) =>
    set({
      pet,
    }),

  updatePet: (updates) =>
    set((state) => ({
      pet: state.pet
        ? {
            ...state.pet,
            ...updates,
          }
        : null,
    })),

  clearPet: () =>
    set({
      pet: null,
    }),
}));
