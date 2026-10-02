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

export function formatGender(gender: 'MALE' | 'FEMALE') {
  return gender === 'MALE' ? '남아' : '여아';
}
