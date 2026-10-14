export type Species = 'DOG' | 'CAT';
export type Gender = 'MALE' | 'FEMALE';

export type AvatarBreed =
  | 'POMERANIAN'
  | 'SCHNAUZER'
  | 'MALTESE'
  | 'POODLE'
  | 'BICHON'
  | 'SHIBA'
  | 'GOLDEN_RETRIEVER'
  | 'KOREAN_SHORTHAIR'
  | 'RUSSIAN_BLUE'
  | 'BRITISH_SHORTHAIR'
  | 'RAGDOLL'
  | 'SCOTTISH_FOLD';

export type Pet = {
  id: string;
  name: string;
  species: Species;
  gender: Gender;

  birthDate?: string;
  estimatedAge?: number;

  breed?: string;
  avatarBreed?: AvatarBreed;

  profileImageUrl?: string;
  weightKg?: number;

  createdAt: string;
};
