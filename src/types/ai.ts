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
