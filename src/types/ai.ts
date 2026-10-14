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
