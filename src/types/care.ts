export type CareScheduleType =
  | 'VACCINATION'
  | 'MEDICATION'
  | 'HEARTWORM'
  | 'CHECKUP';

export type RepeatUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type CareRepeat = {
  unit: RepeatUnit;
  interval: number;
};

export type CareSchedule = {
  id: string;
  petId: string;
  type: CareScheduleType;
  name: string;
  dueDate: string;
  repeat?: CareRepeat;
  completedAt?: string;
  createdAt: string;
};
