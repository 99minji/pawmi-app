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

export function getPetAvatar(avatarBreed?: AvatarBreed) {
  if (avatarBreed && avatarBreed in petAvatars) {
    return petAvatars[avatarBreed as keyof typeof petAvatars];
  }

  return petAvatars.POMERANIAN;
}
