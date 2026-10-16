import type { AvatarBreed } from '@/types/pet';

// 꼬리 파츠 기본 위치 (꼬리가 이미지 오른쪽 끝에 그려진 품종 기준)
const DEFAULT_TAIL_LAYOUT = { right: '2%', top: '34%' } as const;

export const petAvatars = {
  MALTESE: {
    idle: require('../../assets/avatars/dog/maltese/idle.png'),
    happy: require('../../assets/avatars/dog/maltese/happy.png'),
    sick: require('../../assets/avatars/dog/maltese/sick.png'),
    care: require('../../assets/avatars/dog/maltese/care.png'),
    rest: require('../../assets/avatars/dog/maltese/rest.png'),
    idleBody: require('../../assets/avatars/dog/maltese/idle-body.png'),
    idleTail: require('../../assets/avatars/dog/maltese/idle-tail.png'),
    // 꼬리가 이미지 가운데에 그려져 있어 기본 위치에선 몸통에 가려진다.
    tailLayout: { right: '-3%', top: '52%' },
  },
  POMERANIAN: {
    idle: require('../../assets/avatars/dog/pomeranian/idle.png'),
    happy: require('../../assets/avatars/dog/pomeranian/happy.png'),
    sick: require('../../assets/avatars/dog/pomeranian/sick.png'),
    care: require('../../assets/avatars/dog/pomeranian/care.png'),
    rest: require('../../assets/avatars/dog/pomeranian/rest.png'),
    idleBody: require('../../assets/avatars/dog/pomeranian/idle-body.png'),
    idleTail: require('../../assets/avatars/dog/pomeranian/idle-tail.png'),
    tailLayout: DEFAULT_TAIL_LAYOUT,
  },
  SCHNAUZER: {
    idle: require('../../assets/avatars/dog/schnauzer/idle.png'),
    happy: require('../../assets/avatars/dog/schnauzer/happy.png'),
    sick: require('../../assets/avatars/dog/schnauzer/sick.png'),
    care: require('../../assets/avatars/dog/schnauzer/care.png'),
    rest: require('../../assets/avatars/dog/schnauzer/rest.png'),
    idleBody: require('../../assets/avatars/dog/schnauzer/idle-body.png'),
    idleTail: require('../../assets/avatars/dog/schnauzer/idle-tail.png'),
    tailLayout: DEFAULT_TAIL_LAYOUT,
  },
} as const;

// rest 상태에서 아바타 위에 띄우는 Zzz 파츠 (품종 공통)
export const restSleepSource = require('../../assets/avatars/rest-sleep.png');

export const AVATAR_BREED_OPTIONS = Object.keys(
  petAvatars,
) as (keyof typeof petAvatars)[];

export const AVATAR_BREED_LABELS: Record<AvatarBreed, string> = {
  POMERANIAN: '포메라니안',
  SCHNAUZER: '슈나우저',
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
