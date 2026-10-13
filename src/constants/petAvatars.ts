import type { AvatarBreed } from '@/types/pet';

export const petAvatars = {
  POMERANIAN: {
    idle: require('../../assets/avatars/dog/pomeranian/idle.png'),
    happy: require('../../assets/avatars/dog/pomeranian/happy.png'),
    sick: require('../../assets/avatars/dog/pomeranian/sick.png'),
    rainy: require('../../assets/avatars/dog/pomeranian/rainy.png'),
    care: require('../../assets/avatars/dog/pomeranian/care.png'),
    rest: require('../../assets/avatars/dog/pomeranian/rest.png'),
    idleBody: require('../../assets/avatars/dog/pomeranian/idle-body.png'),
    idleTail: require('../../assets/avatars/dog/pomeranian/idle-tail.png'),
  },
} as const;

export const AVATAR_BREED_LABELS: Record<AvatarBreed, string> = {
  POMERANIAN: '포메라니안',
  MALTESE: '말티즈',
  POODLE: '푸들',
  BICHON: '비숑 프리제',
  SHIBA: '시바견',
  GOLDEN_RETRIEVER: '골든 리트리버',
  KOREAN_SHORTHAIR: '코리안 숏헤어',
  RUSSIAN_BLUE: '러시안 블루',
  BRITISH_SHORTHAIR: '브리티시 숏헤어',
  RAGDOLL: '랙돌',
  SCOTTISH_FOLD: '스코티시 폴드',
};

export function getPetAvatar(avatarBreed?: AvatarBreed) {
  if (avatarBreed && avatarBreed in petAvatars) {
    return petAvatars[avatarBreed as keyof typeof petAvatars];
  }

  return petAvatars.POMERANIAN;
}
