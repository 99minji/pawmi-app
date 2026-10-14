import { supabase } from '@/lib/supabase';
import { mapCareScheduleFromDb } from '@/mappers/care';
import { mapHealthRecordFromDb } from '@/mappers/health';

import type { CareRepeat, CareSchedule, CareScheduleType } from '@/types/care';
import type { HealthRecord } from '@/types/health';
import { getRepeatAnchorDay } from '@/utils/care';

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

      repeat_anchor_day: getRepeatAnchorDay(input.dueDate, input.repeat),

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

      // 사용자가 예정일을 바꾸면 그 날짜를 새 기준 일로 삼는다.
      repeat_anchor_day: getRepeatAnchorDay(input.dueDate, input.repeat),

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

type CompleteCareScheduleResult = {
  // 이미 완료된 일정이면 true. 이때 기록과 다음 일정은 만들지 않는다.
  alreadyCompleted: boolean;
  schedule: CareSchedule;
  record: HealthRecord | null;
  next: CareSchedule | null;
};

/**
 * 관리 일정 완료
 *
 * 완료 처리, 건강 기록 생성, 다음 반복 일정 생성을 DB 트랜잭션 하나로 처리한다.
 * (supabase/migrations/20261014000002_complete_care_schedule.sql)
 */
export async function completeCareSchedule(
  id: string,
  occurredAt: string,
  nextDueDate: string | null,
): Promise<CompleteCareScheduleResult> {
  const { data, error } = await supabase.rpc('complete_care_schedule', {
    p_schedule_id: id,
    p_occurred_at: occurredAt,
    p_next_due_date: nextDueDate,
  });

  if (error) {
    throw error;
  }

  return {
    alreadyCompleted: data.already_completed,
    schedule: mapCareScheduleFromDb(data.schedule),
    record: data.record ? mapHealthRecordFromDb(data.record) : null,
    next: data.next ? mapCareScheduleFromDb(data.next) : null,
  };
}

export async function deleteCareScheduleById(id: string) {
  const { error } = await supabase.from('care_schedules').delete().eq('id', id);

  if (error) {
    throw error;
  }
}
