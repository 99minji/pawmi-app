import type { HealthRecord } from '@/types/health';

const DAY = 24 * 60 * 60 * 1000;

/**
 * 최근 24시간 안에 작성된 기록이 있는지
 */
export function hasRecentRecord(records: HealthRecord[]) {
  const now = Date.now();

  return records.some(
    (record) => now - new Date(record.createdAt).getTime() < DAY,
  );
}
