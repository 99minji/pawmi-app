import { AVATAR_BREED_LABELS } from '@/constants/petAvatars';
import type { Pet } from '@/types/pet';

export function getPetAge(pet: Pet): number | null {
  if (pet.birthDate) {
    const [year, month, day] = pet.birthDate.split('-').map(Number);

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const hasNotHadBirthday =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate());

    if (hasNotHadBirthday) {
      age -= 1;
    }

    return Math.max(age, 0);
  }

  if (pet.estimatedAge !== undefined) {
    return pet.estimatedAge;
  }

  return null;
}

export function formatPetAge(pet: Pet) {
  const age = getPetAge(pet);

  if (age === null) {
    return '나이 미등록';
  }

  if (pet.estimatedAge !== undefined) {
    return `약 ${age}살`;
  }

  return `${age}살`;
}

// 품종은 선택한 아바타 기준으로 보여준다. (예전에 직접 입력한 breed는 보조로 사용)
export function formatBreed(pet: Pet) {
  if (pet.avatarBreed) {
    return AVATAR_BREED_LABELS[pet.avatarBreed];
  }

  if (pet.breed) {
    return pet.breed;
  }

  return '품종 미등록';
}

export function formatGender(gender: 'MALE' | 'FEMALE') {
  return gender === 'MALE' ? '남아' : '여아';
}

// 나이 계산
export function getPetAgeYears(pet: Pet) {
  if (pet.birthDate) {
    const birth = new Date(`${pet.birthDate}T12:00:00`);

    const now = new Date();

    let age = now.getFullYear() - birth.getFullYear();

    const monthDiff = now.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age -= 1;
    }

    return Math.max(age, 0);
  }

  return pet.estimatedAge;
}
