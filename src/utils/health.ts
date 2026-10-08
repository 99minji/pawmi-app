import type {
  HealthRecord,
  HealthRecordType,
  WeightRecord,
} from '@/types/health';

export const HEALTH_RECORD_TYPE_LABELS: Record<HealthRecordType, string> = {
  WEIGHT: '체중',
  SYMPTOM: '증상',
  MEDICATION: '투약',
  VACCINATION: '예방',
  VET_VISIT: '병원',
};

export function isWeightRecord(record: HealthRecord): record is WeightRecord {
  return record.type === 'WEIGHT';
}

/**
 * 발생일 기준 최신순 정렬 (원본 배열은 바꾸지 않는다)
 */
export function sortByLatest<T extends Pick<HealthRecord, 'occurredAt'>>(
  records: T[],
) {
  return [...records].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

/**
 * 목록에 보여줄 한 줄 요약
 */
export function getRecordDescription(record: HealthRecord) {
  switch (record.type) {
    case 'WEIGHT':
      return `${record.weightKg}kg`;

    case 'SYMPTOM':
      return record.symptom;

    case 'MEDICATION':
      return [record.medicationName, record.dosageText]
        .filter(Boolean)
        .join(' · ');

    case 'VACCINATION':
      return record.vaccinationName;

    case 'VET_VISIT':
      return [record.clinicName, record.visitReason]
        .filter(Boolean)
        .join(' · ');
  }
}
