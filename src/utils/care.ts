import type { CareRepeat, CareScheduleType } from '@/types/care';
import { parseDateString, toDateString } from './date';

function addMonthsSafe(source: Date, months: number) {
  const year = source.getFullYear();

  const month = source.getMonth();

  const day = source.getDate();

  const targetFirstDay = new Date(year, month + months, 1);

  const targetYear = targetFirstDay.getFullYear();

  const targetMonth = targetFirstDay.getMonth();

  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();

  const result = new Date(targetYear, targetMonth, Math.min(day, lastDay));

  return toDateString(result);
}

function addYearsSafe(source: Date, years: number) {
  const targetYear = source.getFullYear() + years;

  const month = source.getMonth();

  const day = source.getDate();

  const lastDay = new Date(targetYear, month + 1, 0).getDate();

  const result = new Date(targetYear, month, Math.min(day, lastDay));

  return toDateString(result);
}

export function addRepeatToDate(dateString: string, repeat: CareRepeat) {
  const date = parseDateString(dateString);

  switch (repeat.unit) {
    case 'DAY': {
      date.setDate(date.getDate() + repeat.interval);

      return toDateString(date);
    }

    case 'WEEK': {
      date.setDate(date.getDate() + repeat.interval * 7);

      return toDateString(date);
    }

    case 'MONTH':
      return addMonthsSafe(date, repeat.interval);

    case 'YEAR':
      return addYearsSafe(date, repeat.interval);
  }
}

export type RepeatPreset =
  | 'NONE'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'SIX_MONTHS'
  | 'YEARLY'
  | 'CUSTOM';

const REPEAT_LABELS: Record<Exclude<RepeatPreset, 'CUSTOM'>, string> = {
  NONE: '반복 없음',
  DAILY: '매일',
  WEEKLY: '매주',
  MONTHLY: '매월',
  SIX_MONTHS: '6개월마다',
  YEARLY: '매년',
};

// 관리 종류마다 고를 수 있는 반복 주기
const REPEAT_PRESETS_BY_TYPE: Record<
  CareScheduleType,
  Exclude<RepeatPreset, 'NONE' | 'CUSTOM'>[]
> = {
  HEARTWORM: ['MONTHLY'],
  MEDICATION: ['DAILY', 'WEEKLY', 'MONTHLY'],
  VACCINATION: ['YEARLY'],
  CHECKUP: ['SIX_MONTHS', 'YEARLY'],
};

export function getRepeatOptions(
  type: CareScheduleType,
): { label: string; value: RepeatPreset }[] {
  return (['NONE', ...REPEAT_PRESETS_BY_TYPE[type]] as const).map((value) => ({
    label: REPEAT_LABELS[value],
    value,
  }));
}

const PRESET_REPEATS: Partial<Record<RepeatPreset, CareRepeat>> = {
  DAILY: { unit: 'DAY', interval: 1 },
  WEEKLY: { unit: 'WEEK', interval: 1 },
  MONTHLY: { unit: 'MONTH', interval: 1 },
  SIX_MONTHS: { unit: 'MONTH', interval: 6 },
  YEARLY: { unit: 'YEAR', interval: 1 },
};

export function getRepeatFromPreset(preset: RepeatPreset) {
  return PRESET_REPEATS[preset];
}

/**
 * 반복 설정을 프리셋으로 변환한다. 프리셋에 없는 설정은 CUSTOM.
 */
export function getRepeatPreset(repeat?: CareRepeat): RepeatPreset {
  if (!repeat) {
    return 'NONE';
  }

  const preset = (Object.keys(PRESET_REPEATS) as RepeatPreset[]).find(
    (key) =>
      PRESET_REPEATS[key]?.unit === repeat.unit &&
      PRESET_REPEATS[key]?.interval === repeat.interval,
  );

  return preset ?? 'CUSTOM';
}

const SCHEDULE_TYPE_LABELS: Record<CareScheduleType, string> = {
  VACCINATION: '예방 일정',
  MEDICATION: '투약 일정',
  HEARTWORM: '심장사상충 예방',
  CHECKUP: '정기 검진',
};

export function formatScheduleType(type: CareScheduleType) {
  return SCHEDULE_TYPE_LABELS[type];
}
