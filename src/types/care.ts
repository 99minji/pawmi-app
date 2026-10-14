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

  // 월/년 반복의 기준 일(day-of-month). 월말 보정 후에도 원래 날짜로 돌아가기 위해 사용
  repeatAnchorDay?: number;

  // MEDICATION일 때 사용
  dosageText?: string;

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
