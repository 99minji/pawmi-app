import { create } from 'zustand';

type AvatarReaction = 'idle' | 'care' | 'happy';

type UiState = {
  avatarReaction: AvatarReaction;
  setAvatarReaction: (reaction: AvatarReaction) => void;
};

export const useUiStore = create<UiState>((set) => ({
  avatarReaction: 'idle',

  setAvatarReaction: (reaction) => set({ avatarReaction: reaction }),
}));
