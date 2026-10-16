import { colors } from './colors';

import type { CareScheduleType } from '@/types/care';
import type { HealthRecordType } from '@/types/health';

/**
 * 아이콘을 담는 파스텔 컨테이너 색 (배경 + 아이콘)
 *
 * 종류마다 톤을 나눠 목록에서 한눈에 구분되게 한다.
 */
export type Tone = {
  background: string;
  icon: string;
};

export const tones = {
  mint: { background: colors.primary[50], icon: colors.primary[600] },
  peach: {
    background: colors.accent.peachLight,
    icon: colors.accent.peachDeep,
  },
  blue: { background: colors.accent.blueLight, icon: colors.accent.blueDeep },
  yellow: {
    background: colors.accent.yellowLight,
    icon: colors.accent.yellowDeep,
  },
  sage: { background: colors.accent.sageLight, icon: colors.accent.sageDeep },
  rose: { background: colors.accent.roseLight, icon: colors.accent.roseDeep },
  neutral: { background: colors.neutral[100], icon: colors.neutral[500] },
} satisfies Record<string, Tone>;

const SCHEDULE_TYPE_TONES: Record<CareScheduleType, Tone> = {
  VACCINATION: tones.blue,
  MEDICATION: tones.peach,
  HEARTWORM: tones.rose,
  CHECKUP: tones.sage,
};

const RECORD_TYPE_TONES: Record<HealthRecordType, Tone> = {
  WEIGHT: tones.yellow,
  SYMPTOM: tones.rose,
  MEDICATION: tones.peach,
  VACCINATION: tones.blue,
  VET_VISIT: tones.sage,
};

export function getScheduleTone(type: CareScheduleType) {
  return SCHEDULE_TYPE_TONES[type];
}

export function getRecordTone(type: HealthRecordType) {
  return RECORD_TYPE_TONES[type];
}
