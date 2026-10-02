import type { CareRepeat } from '@/types/care';

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
