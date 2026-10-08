import { supabase } from '@/lib/supabase';

import { mapHealthRecordFromDb } from '@/mappers/health';

export async function createWeightRecord(
  petId: string,
  weightKg: number,
  occurredAt: string,
) {
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
    .from('health_records')
    .insert({
      user_id: user.id,
      pet_id: petId,
      type: 'WEIGHT',
      title: `체중 ${weightKg}kg`,
      weight_kg: weightKg,
      occurred_at: occurredAt,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapHealthRecordFromDb(data);
}

export async function getHealthRecords(petId: string) {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('pet_id', petId)
    .order('occurred_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data.map(mapHealthRecordFromDb);
}

export async function createSymptomRecord(
  petId: string,
  symptom: string,
  memo: string | undefined,
  occurredAt: string,
) {
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
    .from('health_records')
    .insert({
      user_id: user.id,
      pet_id: petId,

      type: 'SYMPTOM',
      title: symptom,
      symptom,

      memo: memo?.trim() || null,

      occurred_at: occurredAt,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapHealthRecordFromDb(data);
}

export async function createMedicationRecord(
  petId: string,
  medicationName: string,
  dosageText: string | undefined,
  memo: string | undefined,
  occurredAt: string,
) {
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
    .from('health_records')
    .insert({
      user_id: user.id,
      pet_id: petId,

      type: 'MEDICATION',
      title: medicationName,

      medication_name: medicationName,
      dosage_text: dosageText?.trim() || null,
      memo: memo?.trim() || null,

      occurred_at: occurredAt,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapHealthRecordFromDb(data);
}

export async function createVaccinationRecord(
  petId: string,
  vaccinationName: string,
  memo: string | undefined,
  occurredAt: string,
) {
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
    .from('health_records')
    .insert({
      user_id: user.id,
      pet_id: petId,

      type: 'VACCINATION',
      title: vaccinationName,

      vaccination_name: vaccinationName,
      memo: memo?.trim() || null,

      occurred_at: occurredAt,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapHealthRecordFromDb(data);
}

export async function createVetVisitRecord(
  petId: string,
  visitReason: string,
  clinicName: string | undefined,
  memo: string | undefined,
  occurredAt: string,
) {
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
    .from('health_records')
    .insert({
      user_id: user.id,
      pet_id: petId,

      type: 'VET_VISIT',

      title: visitReason,

      visit_reason: visitReason,
      clinic_name: clinicName?.trim() || null,
      memo: memo?.trim() || null,

      occurred_at: occurredAt,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapHealthRecordFromDb(data);
}
// 삭제 함수

export async function deleteHealthRecordById(id: string) {
  const { error } = await supabase.from('health_records').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// 수정 함수
type UpdateHealthRecordInput =
  | {
      type: 'WEIGHT';
      weightKg: number;
      occurredAt: string;
      memo?: string;
    }
  | {
      type: 'SYMPTOM';
      symptom: string;
      occurredAt: string;
      memo?: string;
    }
  | {
      type: 'MEDICATION';
      medicationName: string;
      dosageText?: string;
      occurredAt: string;
      memo?: string;
    }
  | {
      type: 'VACCINATION';
      vaccinationName: string;
      occurredAt: string;
      memo?: string;
    }
  | {
      type: 'VET_VISIT';
      visitReason: string;
      clinicName?: string;
      occurredAt: string;
      memo?: string;
    };

export async function updateHealthRecordById(
  id: string,
  input: UpdateHealthRecordInput,
) {
  let updates: Record<string, unknown> = {
    occurred_at: input.occurredAt,

    memo: input.memo?.trim() || null,
  };

  switch (input.type) {
    case 'WEIGHT':
      updates = {
        ...updates,
        title: `체중 ${input.weightKg}kg`,
        weight_kg: input.weightKg,
      };
      break;

    case 'SYMPTOM':
      updates = {
        ...updates,
        title: input.symptom,
        symptom: input.symptom,
      };
      break;

    case 'MEDICATION':
      updates = {
        ...updates,
        title: input.medicationName,

        medication_name: input.medicationName,

        dosage_text: input.dosageText?.trim() || null,
      };
      break;

    case 'VACCINATION':
      updates = {
        ...updates,
        title: input.vaccinationName,

        vaccination_name: input.vaccinationName,
      };
      break;

    case 'VET_VISIT':
      updates = {
        ...updates,
        title: input.visitReason,

        visit_reason: input.visitReason,

        clinic_name: input.clinicName?.trim() || null,
      };
      break;
  }

  const { data, error } = await supabase
    .from('health_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapHealthRecordFromDb(data);
}

// 최신 체중 조회
export async function getLatestWeight(petId: string) {
  const { data, error } = await supabase
    .from('health_records')
    .select('weight_kg')
    .eq('pet_id', petId)
    .eq('type', 'WEIGHT')
    .order('occurred_at', {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.weight_kg === null || data?.weight_kg === undefined) {
    return undefined;
  }

  return Number(data.weight_kg);
}
