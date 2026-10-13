import type { CareSchedule, CareSuggestion } from '@/types/care';
import type { HealthRecord } from '@/types/health';
import type { Pet } from '@/types/pet';
import { getPetAgeYears } from './pet';

type GetCareSuggestionsParams = {
  pet: Pet;
  records: HealthRecord[];
  schedules: CareSchedule[];
};

const DAY = 24 * 60 * 60 * 1000;

export function getCareSuggestions({
  pet,
  records,
  schedules,
}: GetCareSuggestionsParams): CareSuggestion[] {
  const suggestions: CareSuggestion[] = [];

  const ageYears = getPetAgeYears(pet);

  /* 정기검진 일정이 없는 경우 */
  if (ageYears !== undefined && ageYears >= 7) {
    const hasCheckup = schedules.some(
      (schedule) =>
        schedule.petId === pet.id &&
        schedule.type === 'CHECKUP' &&
        !schedule.completedAt,
    );

    if (!hasCheckup) {
      suggestions.push({
        id: 'checkup-suggestion',
        type: 'CHECKUP',
        title: '정기검진 일정을 챙겨볼까요?',
        description:
          '다음 정기검진 일정을 등록해두면 놓치지 않고 관리할 수 있어요.',
        priority: 100,
        action: {
          type: 'CREATE_CARE',
          careType: 'CHECKUP',
        },
      });
    }
  }

  /* 체중 기록이 오래된 경우 */
  const weightRecords = records
    .filter((record) => record.petId === pet.id && record.type === 'WEIGHT')
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));

  const latestWeight = weightRecords[0];

  if (latestWeight) {
    const days = Math.floor(
      (Date.now() - Date.parse(latestWeight.occurredAt)) / DAY,
    );

    if (days >= 30) {
      suggestions.push({
        id: 'weight-record-old',
        type: 'RECORD',
        title: '최근 체중을 한 번 확인해볼까요?',
        description: '마지막 체중 기록이 한 달 이상 지났어요.',
        priority: 60,
        action: {
          type: 'CREATE_WEIGHT_RECORD',
        },
      });
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}
