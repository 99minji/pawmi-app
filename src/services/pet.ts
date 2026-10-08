import { supabase } from '@/lib/supabase';

import { mapPetFromDb } from '@/mappers/pet';
import type { AvatarBreed, Gender, Species } from '@/types/pet';

type CreatePetInput = {
  name: string;
  species: Species;
  gender: Gender;

  birthDate?: string;
  estimatedAge?: number;

  breed?: string;
  avatarBreed?: AvatarBreed;
};

type UpdatePetInput = {
  name?: string;
  species?: 'DOG' | 'CAT';
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string | null;
  estimatedAge?: number | null;
  breed?: string | null;
  avatarBreed?: string | null;
  profileImageUrl?: string | null;
  weightKg?: number | null;
};

export async function getMyPet() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapPetFromDb(data);
}

export async function createPet(input: CreatePetInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('로그인 정보가 없습니다.');
  }

  const { data, error } = await supabase
    .from('pets')
    .insert({
      user_id: user.id,

      name: input.name,
      species: input.species,
      gender: input.gender,

      birth_date: input.birthDate ?? null,

      estimated_age: input.estimatedAge ?? null,

      breed: input.breed ?? null,

      avatar_breed: input.avatarBreed ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePetById(petId: string, input: UpdatePetInput) {
  const updates = {
    ...(input.name !== undefined && {
      name: input.name,
    }),

    ...(input.species !== undefined && {
      species: input.species,
    }),

    ...(input.gender !== undefined && {
      gender: input.gender,
    }),

    ...(input.birthDate !== undefined && {
      birth_date: input.birthDate,
    }),

    ...(input.estimatedAge !== undefined && {
      estimated_age: input.estimatedAge,
    }),

    ...(input.breed !== undefined && {
      breed: input.breed,
    }),

    ...(input.avatarBreed !== undefined && {
      avatar_breed: input.avatarBreed,
    }),

    ...(input.profileImageUrl !== undefined && {
      profile_image_url: input.profileImageUrl,
    }),

    ...(input.weightKg !== undefined && {
      weight_kg: input.weightKg,
    }),
  };

  const { data, error } = await supabase
    .from('pets')
    .update(updates)
    .eq('id', petId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapPetFromDb(data);
}
