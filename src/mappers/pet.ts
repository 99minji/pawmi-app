import type { Pet } from '@/types/pet';

export function mapPetFromDb(row: any): Pet {
  return {
    id: row.id,

    name: row.name,

    species: row.species,

    gender: row.gender,

    birthDate: row.birth_date ?? undefined,

    estimatedAge: row.estimated_age ?? undefined,

    breed: row.breed ?? undefined,

    avatarBreed: row.avatar_breed ?? undefined,

    profileImageUrl: row.profile_image_url ?? undefined,

    weightKg: row.weight_kg ?? undefined,

    createdAt: row.created_at,
  };
}
