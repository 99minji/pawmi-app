import type { HealthRecord } from '@/types/health';

export type HealthInsight =
  | {
      type: 'WEIGHT_CHANGE';
      title: string;
      description: string;
    }
  | {
      type: 'RECENT_SYMPTOM';
      title: string;
      description: string;
    }
  | {
      type: 'RECENT_VET_VISIT';
      title: string;
      description: string;
    }
  | null;

const DAY = 24 * 60 * 60 * 1000;

function isWithinDays(dateString: string, days: number) {
  const targetTime = new Date(dateString).getTime();

  const now = Date.now();

  return now - targetTime <= days * DAY;
}

/**
 * 최근 24시간 안에 작성된 기록이 있는지
 */
export function hasRecentRecord(records: HealthRecord[]) {
  const now = Date.now();

  return records.some(
    (record) => now - new Date(record.createdAt).getTime() < DAY,
  );
}

export function getHealthInsight(records: HealthRecord[]): HealthInsight {
  if (records.length === 0) {
    return null;
  }

  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const recentSymptom = sortedRecords.find(
    (record): record is Extract<HealthRecord, { type: 'SYMPTOM' }> =>
      record.type === 'SYMPTOM' && isWithinDays(record.occurredAt, 7),
  );

  const recentVetVisit = sortedRecords.find(
    (record): record is Extract<HealthRecord, { type: 'VET_VISIT' }> =>
      record.type === 'VET_VISIT' && isWithinDays(record.occurredAt, 30),
  );

  const weightRecords = sortedRecords.filter(
    (record): record is Extract<HealthRecord, { type: 'WEIGHT' }> =>
      record.type === 'WEIGHT',
  );

  /**
   * 1순위
   * 최근 7일 증상
   */
  if (recentSymptom) {
    return {
      type: 'RECENT_SYMPTOM',

      title: '최근 증상 기록이 있어요',

      description: recentSymptom.symptom,
    };
  }

  /**
   * 2순위
   * 최근 30일 병원 방문
   */
  if (recentVetVisit) {
    return {
      type: 'RECENT_VET_VISIT',

      title: '최근 병원 방문 기록이 있어요',

      description: recentVetVisit.visitReason,
    };
  }

  /**
   * 3순위
   * 최근 두 체중 기록 비교
   */
  if (weightRecords.length >= 2) {
    const latest = weightRecords[0];

    const previous = weightRecords[1];

    const difference = Number((latest.weightKg - previous.weightKg).toFixed(1));

    if (difference > 0) {
      return {
        type: 'WEIGHT_CHANGE',

        title: `최근 기록보다 체중이 ${difference}kg 늘었어요`,

        description: `이전 ${previous.weightKg}kg → 현재 ${latest.weightKg}kg`,
      };
    }

    if (difference < 0) {
      return {
        type: 'WEIGHT_CHANGE',

        title: `최근 기록보다 체중이 ${Math.abs(difference)}kg 줄었어요`,

        description: `이전 ${previous.weightKg}kg → 현재 ${latest.weightKg}kg`,
      };
    }

    return {
      type: 'WEIGHT_CHANGE',

      title: '최근 기록과 체중이 같아요',

      description: `현재 ${latest.weightKg}kg`,
    };
  }

  return null;
}
