import { supabase } from '@/lib/supabase';
import { mapCareScheduleFromDb } from '@/mappers/care';

import type { CareRepeat, CareScheduleType } from '@/types/care';

type CreateCareScheduleInput = {
  petId: string;
  type: CareScheduleType;
  name: string;
  dueDate: string;
  repeat?: CareRepeat;
};

export async function getCareSchedules(petId: string) {
  const { data, error } = await supabase
    .from('care_schedules')
    .select('*')
    .eq('pet_id', petId)
    .order('due_date', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data.map(mapCareScheduleFromDb);
}

export async function createCareSchedule(input: CreateCareScheduleInput) {
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
    .from('care_schedules')
    .insert({
      user_id: user.id,
      pet_id: input.petId,
      type: input.type,
      name: input.name,
      due_date: input.dueDate,

      repeat_unit: input.repeat?.unit ?? null,

      repeat_interval: input.repeat?.interval ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapCareScheduleFromDb(data);
}
