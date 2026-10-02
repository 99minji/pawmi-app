import { AvatarBreed } from '@/types/pet';
import { create } from 'zustand';

export type Species = 'DOG' | 'CAT';
export type Gender = 'MALE' | 'FEMALE';

type OnboardingState = {
  name: string;
  species: Species | null;
  birthDate: string;
  estimatedAge: number | null;
  gender: Gender | null;
  avatarBreed: AvatarBreed | null;
  isCompleted: boolean;

  setName: (name: string) => void;
  setSpecies: (species: Species) => void;
  setBirthDate: (birthDate: string) => void;
  setEstimatedAge: (age: number | null) => void;
  setGender: (gender: Gender) => void;
  setAvatarBreed: (avatarBreed: AvatarBreed) => void;
  completeOnboarding: () => void;
  reset: () => void;
};

const initialState = {
  name: '',
  species: null,
  birthDate: '',
  estimatedAge: null,
  gender: null,
  avatarBreed: null,
  isCompleted: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setName: (name) => set({ name }),
  setSpecies: (species) => set({ species }),
  setBirthDate: (birthDate) =>
    set({
      birthDate,
      estimatedAge: null,
    }),

  setEstimatedAge: (estimatedAge) =>
    set({
      estimatedAge,
      birthDate: '',
    }),
  setGender: (gender) => set({ gender }),
  setAvatarBreed: (avatarBreed) => set({ avatarBreed }),
  completeOnboarding: () => {
    set({ isCompleted: true });
  },

  reset: () => set(initialState),
}));
