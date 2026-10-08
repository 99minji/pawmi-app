import type { HealthRecord } from '@/types/health';

export function mapHealthRecordFromDb(row: any): HealthRecord {
  const base = {
    id: row.id,
    petId: row.pet_id,
    type: row.type,
    title: row.title,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    memo: row.memo ?? undefined,
  };

  switch (row.type) {
    case 'WEIGHT':
      return {
        ...base,
        type: 'WEIGHT',
        weightKg: Number(row.weight_kg),
      };

    case 'SYMPTOM':
      return {
        ...base,
        type: 'SYMPTOM',
        symptom: row.symptom,
      };

    case 'MEDICATION':
      return {
        ...base,
        type: 'MEDICATION',
        medicationName: row.medication_name,
        dosageText: row.dosage_text ?? undefined,
      };

    case 'VACCINATION':
      return {
        ...base,
        type: 'VACCINATION',
        vaccinationName: row.vaccination_name,
      };

    case 'VET_VISIT':
      return {
        ...base,
        type: 'VET_VISIT',
        clinicName: row.clinic_name ?? undefined,
        visitReason: row.visit_reason,
      };

    default:
      throw new Error(`알 수 없는 건강 기록 타입: ${row.type}`);
  }
}
