import type { CareRepeat, CareScheduleType } from '@/types/care';

export function addRepeatToDate(dateString: string, repeat: CareRepeat) {
  const [year, month, day] = dateString.split('-').map(Number);

  const date = new Date(year, month - 1, day);

  switch (repeat.unit) {
    case 'DAY':
      date.setDate(date.getDate() + repeat.interval);
      break;

    case 'WEEK':
      date.setDate(date.getDate() + repeat.interval * 7);
      break;

    case 'MONTH':
      date.setMonth(date.getMonth() + repeat.interval);
      break;

    case 'YEAR':
      date.setFullYear(date.getFullYear() + repeat.interval);
      break;
  }

  const nextYear = date.getFullYear();

  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');

  const nextDay = String(date.getDate()).padStart(2, '0');

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export type RepeatPreset =
  'NONE' | 'MONTHLY' | 'SIX_MONTHS' | 'YEARLY' | 'CUSTOM';

export const REPEAT_OPTIONS: { label: string; value: RepeatPreset }[] = [
  { label: '반복 없음', value: 'NONE' },
  { label: '매월', value: 'MONTHLY' },
  { label: '6개월마다', value: 'SIX_MONTHS' },
  { label: '매년', value: 'YEARLY' },
];

const PRESET_REPEATS: Partial<Record<RepeatPreset, CareRepeat>> = {
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
