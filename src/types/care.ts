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
  dosageText?: string;
  repeatAnchorDay?: number;

  scheduleGroupId?: string;

  notificationEnabled: boolean;
  notificationTime?: string;
  completedAt?: string;
  createdAt: string;
};

export type CareSuggestionType = 'CHECKUP' | 'RECORD';

export type CareSuggestionAction =
  | {
      type: 'CREATE_CARE';
      careType: 'CHECKUP';
    }
  | {
      type: 'CREATE_WEIGHT_RECORD';
    };

export type CareSuggestion = {
  id: string;
  type: CareSuggestionType;
  title: string;
  description: string;
  priority: number;
  action?: CareSuggestionAction;
};
