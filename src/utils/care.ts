import type { CareRepeat, CareScheduleType, RepeatUnit } from '@/types/care';
import { parseDateString, toDateString } from './date';

function addMonthsSafe(source: Date, months: number, anchorDay: number) {
  const year = source.getFullYear();

  const month = source.getMonth();

  const day = anchorDay;

  const targetFirstDay = new Date(year, month + months, 1);

  const targetYear = targetFirstDay.getFullYear();

  const targetMonth = targetFirstDay.getMonth();

  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();

  const result = new Date(targetYear, targetMonth, Math.min(day, lastDay));

  return toDateString(result);
}

function addYearsSafe(source: Date, years: number, anchorDay: number) {
  const targetYear = source.getFullYear() + years;

  const month = source.getMonth();

  const day = anchorDay;

  const lastDay = new Date(targetYear, month + 1, 0).getDate();

  const result = new Date(targetYear, month, Math.min(day, lastDay));

  return toDateString(result);
}

/**
 * 월/년 반복의 기준 일
 *
 * 사용자가 고른 예정일의 day-of-month를 저장해 두고 다음 일정에도 그대로 물려준다.
 * (1/31 → 2/28 → 3/31 처럼 월말 보정 후에도 원래 날짜로 돌아오도록)
 */
export function getRepeatAnchorDay(dueDate: string, repeat?: CareRepeat) {
  if (repeat?.unit !== 'MONTH' && repeat?.unit !== 'YEAR') {
    return null;
  }

  return parseDateString(dueDate).getDate();
}

/**
 * 다음 예정일 계산
 *
 * MONTH / YEAR는 anchorDay(없으면 dateString의 일)를 기준으로
 * min(anchorDay, 대상 월의 마지막 날)로 계산한다.
 */
export function addRepeatToDate(
  dateString: string,
  repeat: CareRepeat,
  anchorDay?: number,
) {
  const date = parseDateString(dateString);

  const day = anchorDay ?? date.getDate();

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
      return addMonthsSafe(date, repeat.interval, day);

    case 'YEAR':
      return addYearsSafe(date, repeat.interval, day);
  }
}

export type RepeatPreset =
  'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SIX_MONTHS' | 'YEARLY' | 'CUSTOM';

const REPEAT_LABELS: Record<RepeatPreset, string> = {
  NONE: '반복 없음',
  DAILY: '매일',
  WEEKLY: '매주',
  MONTHLY: '매월',
  SIX_MONTHS: '6개월마다',
  YEARLY: '매년',
  CUSTOM: '사용자 지정',
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
  const presets: RepeatPreset[] = [
    'NONE',
    ...REPEAT_PRESETS_BY_TYPE[type],
    'CUSTOM',
  ];

  return presets.map((value) => ({
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

/**
 * 사용자 지정 반복 입력값(숫자 문자열 + 단위)을 CareRepeat으로 변환한다.
 * 1~365 범위의 정수가 아니면 undefined.
 */
export function parseCustomRepeat(
  intervalText: string,
  unit: RepeatUnit,
): CareRepeat | undefined {
  const interval = Number(intervalText);

  if (!Number.isInteger(interval) || interval < 1 || interval > 365) {
    return undefined;
  }

  return { unit, interval };
}

export function formatCustomRepeat(interval: number, unit: RepeatUnit) {
  switch (unit) {
    case 'DAY':
      return interval === 1 ? '매일' : `${interval}일마다`;

    case 'WEEK':
      return interval === 1 ? '매주' : `${interval}주마다`;

    case 'MONTH':
      return interval === 1 ? '매월' : `${interval}개월마다`;

    case 'YEAR':
      return interval === 1 ? '매년' : `${interval}년마다`;
  }
}

/**
 * HH:mm 형식(00:00 ~ 23:59)인지
 */
export function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}
