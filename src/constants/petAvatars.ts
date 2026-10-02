type PetAvatarState = 'idle' | 'happy' | 'sick' | 'rainy' | 'care' | 'rest';

export const petAvatars = {
  POMERANIAN: {
    idle: require('../../assets/avatars/dog/pomeranian/idle.png'),
    happy: require('../../assets/avatars/dog/pomeranian/happy.png'),
    sick: require('../../assets/avatars/dog/pomeranian/sick.png'),
    rainy: require('../../assets/avatars/dog/pomeranian/rainy.png'),
    care: require('../../assets/avatars/dog/pomeranian/care.png'),
    rest: require('../../assets/avatars/dog/pomeranian/rest.png'),
  },
} as const;
