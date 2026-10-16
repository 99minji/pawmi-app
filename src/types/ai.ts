import type { CareRepeat, CareScheduleType } from '@/types/care';

export type ParsedCareSchedule = {
  type: CareScheduleType;
  name: string;
  dosageText?: string;
  dueDate?: string;
  repeat?: CareRepeat;
  notificationEnabled: boolean;
  notificationTime?: string;
};

export type ParsedHealthRecord =
  | {
      type: 'SYMPTOM';
      title?: string;
      occurredAt?: string;
      memo?: string;
      symptom?: string;
    }
  | {
      type: 'MEDICATION';
      title?: string;
      occurredAt?: string;
      memo?: string;
      medicationName?: string;
      dosageText?: string;
    }
  | {
      type: 'VET_VISIT';
      title?: string;
      occurredAt?: string;
      memo?: string;
      clinicName?: string;
      visitReason?: string;
    };

export type PetHealthSummary = {
  symptomCount14Days: number;

  recentSymptoms: {
    symptom: string;
    occurredAt: string;
  }[];

  latestWeightKg?: number;
  previousWeightKg?: number;
  weightChangeKg?: number;

  recentMedications: {
    medicationName: string;
    dosageText?: string;
    occurredAt: string;
  }[];

  recentVaccinations: {
    vaccinationName: string;
    occurredAt: string;
  }[];

  overdueCareCount: number;

  overdueCareItems: {
    type: 'VACCINATION' | 'MEDICATION' | 'HEARTWORM' | 'CHECKUP';
    name: string;
    dueDate: string;
  }[];

  medicationCounts: {
    medicationName: string;
    count: number;
  }[];
};

export type HealthSummaryExplanation = {
  headline: string;
  items: string[];
};
