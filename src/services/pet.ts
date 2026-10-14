import { supabase } from '@/lib/supabase';

import { mapPetFromDb } from '@/mappers/pet';
import type { AvatarBreed, Gender, Species } from '@/types/pet';

// Postgres unique 제약 위반 코드
const UNIQUE_VIOLATION = '23505';

type CreatePetInput = {
  name: string;
  species: Species;
  gender: Gender;

  birthDate?: string;
  estimatedAge?: number;

  breed?: string;
  avatarBreed?: AvatarBreed;

  // 온보딩 한 번을 식별하는 값. 같은 요청이 여러 번 들어와도 펫은 하나만 생성된다.
  clientRequestId: string;
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

/**
 * 내 펫 목록 (먼저 등록한 순)
 *
 * 사용자 확인이나 조회에 실패하면 throw하고, 정상 조회 결과가 없을 때만 빈 배열을 돌려준다.
 */
export async function getMyPets() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // 네트워크 오류 등으로 사용자 확인에 실패하면 "펫 없음"으로 보지 않고 오류로 처리한다.
  // (null로 처리하면 기존 사용자가 온보딩으로 보내져 펫이 중복 생성될 수 있음)
  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(mapPetFromDb);
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

      client_request_id: input.clientRequestId,
    })
    .select()
    .single();

  // 같은 온보딩 요청이 이미 저장됐다면(unique 위반) 그때 만든 펫을 돌려준다.
  if (error?.code === UNIQUE_VIOLATION) {
    const { data: existingPet, error: existingError } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_request_id', input.clientRequestId)
      .single();

    if (existingError) {
      throw existingError;
    }

    return existingPet;
  }

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
