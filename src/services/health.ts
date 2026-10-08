import { supabase } from '@/lib/supabase';

import { mapHealthRecordFromDb } from '@/mappers/health';

export async function createWeightRecord(petId: string, weightKg: number) {
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

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('health_records')
    .insert({
      user_id: user.id,
      pet_id: petId,
      type: 'WEIGHT',
      title: `체중 ${weightKg}kg`,
      weight_kg: weightKg,
      occurred_at: now,
      created_at: now,
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
  memo?: string,
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

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('health_records')
    .insert({
      user_id: user.id,
      pet_id: petId,

      type: 'SYMPTOM',
      title: symptom,
      symptom,

      memo: memo?.trim() || null,

      occurred_at: now,
      created_at: now,
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
  dosageText?: string,
  memo?: string,
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

  const now = new Date().toISOString();

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

      occurred_at: now,
      created_at: now,
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
  memo?: string,
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

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('health_records')
    .insert({
      user_id: user.id,
      pet_id: petId,

      type: 'VACCINATION',
      title: vaccinationName,

      vaccination_name: vaccinationName,
      memo: memo?.trim() || null,

      occurred_at: now,
      created_at: now,
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
  clinicName?: string,
  memo?: string,
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

  const now = new Date().toISOString();

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

      occurred_at: now,
      created_at: now,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapHealthRecordFromDb(data);
}
