import type { HealthRecord } from '@/types/health';

// 건강 기록을 남긴 뒤 아바타를 care 이미지로 보여주는 시간
const CARE_AVATAR_DURATION = 60 * 1000;

/**
 * care 아바타를 보여줄 종료 시각
 *
 * 가장 최근에 작성된 기록 기준으로 계산하고, 이미 지났으면 null
 */
export function getCareAvatarEndTime(records: HealthRecord[]) {
  if (records.length === 0) {
    return null;
  }

  const latestCreatedAt = Math.max(
    ...records.map((record) => new Date(record.createdAt).getTime()),
  );

  const endTime = latestCreatedAt + CARE_AVATAR_DURATION;

  return endTime > Date.now() ? endTime : null;
}
