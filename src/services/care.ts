import { supabase } from '@/lib/supabase';
import { mapCareScheduleFromDb } from '@/mappers/care';

import type { CareRepeat, CareScheduleType } from '@/types/care';

type CreateCareScheduleInput = {
  petId: string;
  type: CareScheduleType;
  name: string;
  dueDate: string;
  repeat?: CareRepeat;

  dosageText?: string;

  notificationEnabled: boolean;
  notificationTime: string;
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

      dosage_text: input.dosageText?.trim() || null,

      notification_enabled: input.notificationEnabled,

      notification_time: input.notificationTime,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapCareScheduleFromDb(data);
}

type UpdateCareScheduleInput = {
  name: string;
  dueDate: string;
  repeat?: CareRepeat;

  dosageText?: string;

  notificationEnabled: boolean;
  notificationTime: string;
};

export async function updateCareScheduleById(
  id: string,
  input: UpdateCareScheduleInput,
) {
  const { data, error } = await supabase
    .from('care_schedules')
    .update({
      name: input.name,
      due_date: input.dueDate,

      repeat_unit: input.repeat?.unit ?? null,

      repeat_interval: input.repeat?.interval ?? null,

      dosage_text: input.dosageText?.trim() || null,

      notification_enabled: input.notificationEnabled,

      notification_time: input.notificationTime,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapCareScheduleFromDb(data);
}

export async function completeCareScheduleById(id: string) {
  const completedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('care_schedules')
    .update({
      completed_at: completedAt,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapCareScheduleFromDb(data);
}

export async function deleteCareScheduleById(id: string) {
  const { error } = await supabase.from('care_schedules').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
