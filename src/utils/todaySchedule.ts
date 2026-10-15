import type { CareSchedule } from '@/types/care';

/**
 * 홈 "오늘 할 일" 목록의 한 칸
 *
 * - SINGLE: 일반 일정 카드 1개
 * - MEDICATION_GROUP: 하루 여러 시간 투약을 한 카드로 묶은 것 (08:00 / 13:00 / 20:00)
 */
export type TodayScheduleItem =
  | {
      kind: 'SINGLE';
      key: string;
      schedule: CareSchedule;
    }
  | {
      kind: 'MEDICATION_GROUP';
      key: string;
      dueDate: string;
      schedules: CareSchedule[];
    };

/**
 * 오늘 해야 할(오늘 예정 + 놓친) 미완료 일정
 *
 * 오늘 일정을 먼저, 놓친 일정은 최근 날짜부터 보여준다.
 */
export function getActiveSchedules(
  schedules: CareSchedule[],
  petId: string | undefined,
  todayDateString: string,
) {
  return schedules
    .filter(
      (schedule) =>
        schedule.petId === petId &&
        schedule.dueDate <= todayDateString &&
        !schedule.completedAt,
    )
    .sort((a, b) => {
      const aToday = a.dueDate === todayDateString;
      const bToday = b.dueDate === todayDateString;

      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;

      return b.dueDate.localeCompare(a.dueDate);
    });
}

/**
 * 미완료 일정을 화면에 그릴 단위로 묶는다.
 *
 * 같은 scheduleGroupId라도 날짜가 다르면 서로 다른 회차이므로
 * `groupId:dueDate` 단위로 묶는다.
 * 그룹에는 이미 완료한 시간도 포함해야 "✓ 08:00"처럼 진행 상태를 보여줄 수 있어
 * 전체 일정(allSchedules)에서 같은 그룹을 다시 찾는다.
 */
export function buildTodayItems(
  activeSchedules: CareSchedule[],
  allSchedules: CareSchedule[],
  petId: string | undefined,
): TodayScheduleItem[] {
  const items: TodayScheduleItem[] = [];
  const handledGroupKeys = new Set<string>();

  for (const schedule of activeSchedules) {
    const groupId =
      schedule.type === 'MEDICATION' ? schedule.scheduleGroupId : undefined;

    if (!groupId) {
      items.push({ kind: 'SINGLE', key: schedule.id, schedule });
      continue;
    }

    const groupKey = `${groupId}:${schedule.dueDate}`;

    if (handledGroupKeys.has(groupKey)) {
      continue;
    }

    handledGroupKeys.add(groupKey);

    const groupedSchedules = allSchedules
      .filter(
        (item) =>
          item.petId === petId &&
          item.type === 'MEDICATION' &&
          item.scheduleGroupId === groupId &&
          item.dueDate === schedule.dueDate,
      )
      .sort((a, b) =>
        (a.notificationTime ?? '').localeCompare(b.notificationTime ?? ''),
      );

    items.push({
      kind: 'MEDICATION_GROUP',
      key: groupKey,
      dueDate: schedule.dueDate,
      schedules: groupedSchedules,
    });
  }

  return items;
}
