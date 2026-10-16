import type { PetHealthSummary } from '@/types/ai';
import type { CareSchedule } from '@/types/care';
import type { HealthRecord } from '@/types/health';

type BuildPetHealthSummaryParams = {
  records: HealthRecord[];
  schedules: CareSchedule[];
  petId: string;
  today: string;
};

export function buildPetHealthSummary({
  records,
  schedules,
  petId,
  today,
}: BuildPetHealthSummaryParams): PetHealthSummary {
  const petRecords = records.filter((record) => record.petId === petId);

  const petSchedules = schedules.filter((schedule) => schedule.petId === petId);

  const todayDate = parseLocalDate(today);

  const fourteenDaysAgo = new Date(todayDate);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const recentSymptomRecords = petRecords
    .filter((record): record is Extract<HealthRecord, { type: 'SYMPTOM' }> => {
      if (record.type !== 'SYMPTOM') {
        return false;
      }

      const occurredDate = new Date(record.occurredAt);

      return (
        occurredDate >= fourteenDaysAgo && occurredDate <= endOfDay(todayDate)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

  const weightRecords = petRecords
    .filter(
      (record): record is Extract<HealthRecord, { type: 'WEIGHT' }> =>
        record.type === 'WEIGHT',
    )
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

  const latestWeight = weightRecords[0];

  const previousWeight = weightRecords[1];

  const weightChangeKg =
    latestWeight && previousWeight
      ? roundToOneDecimal(latestWeight.weightKg - previousWeight.weightKg)
      : undefined;

  const recentMedicationRecords = petRecords
    .filter(
      (record): record is Extract<HealthRecord, { type: 'MEDICATION' }> => {
        if (record.type !== 'MEDICATION') {
          return false;
        }

        const occurredDate = new Date(record.occurredAt);

        return (
          occurredDate >= fourteenDaysAgo && occurredDate <= endOfDay(todayDate)
        );
      },
    )
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

  const recentVaccinations = petRecords
    .filter(
      (record): record is Extract<HealthRecord, { type: 'VACCINATION' }> =>
        record.type === 'VACCINATION',
    )
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, 10)
    .map((record) => ({
      vaccinationName: record.vaccinationName,
      occurredAt: record.occurredAt,
    }));

  const overdueCareItems = petSchedules
    .filter((schedule) => !schedule.completedAt && schedule.dueDate < today)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .map((schedule) => ({
      type: schedule.type,
      name: schedule.name,
      dueDate: schedule.dueDate,
    }));

  const recentMedications = recentMedicationRecords
    .slice(0, 10)
    .map((record) => ({
      medicationName: record.medicationName,
      dosageText: record.dosageText,
      occurredAt: record.occurredAt,
    }));

  const medicationCountMap = new Map<string, number>();

  recentMedications.forEach((record) => {
    medicationCountMap.set(
      record.medicationName,
      (medicationCountMap.get(record.medicationName) ?? 0) + 1,
    );
  });

  const medicationCounts = Array.from(medicationCountMap.entries()).map(
    ([medicationName, count]) => ({
      medicationName,
      count,
    }),
  );

  return {
    symptomCount14Days: recentSymptomRecords.length,
    recentSymptoms: recentSymptomRecords.map((record) => ({
      symptom: record.symptom,
      occurredAt: record.occurredAt,
    })),

    latestWeightKg: latestWeight?.weightKg,
    previousWeightKg: previousWeight?.weightKg,
    weightChangeKg,

    recentMedications,
    medicationCounts,

    recentVaccinations,

    overdueCareCount: overdueCareItems.length,
    overdueCareItems,
  };
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day, 0, 0, 0);
}

function endOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
