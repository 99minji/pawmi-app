export type CareScheduleType =
  | 'VACCINATION'
  | 'MEDICATION'
  | 'HEARTWORM'
  | 'CHECKUP';

export type CareSchedule = {
  id: string;

  petId: string;

  type: CareScheduleType;

  /**
   * 사용자에게 보여줄 관리 항목 이름
   * ex) 심장사상충, 종합백신, 정기검진
   */
  name: string;
  dueDate: string;

  completedAt?: string;

  createdAt: string;
};
