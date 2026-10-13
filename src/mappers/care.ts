import type { CareSchedule } from '@/types/care';

export function mapCareScheduleFromDb(row: any): CareSchedule {
  return {
    id: row.id,
    petId: row.pet_id,
    type: row.type,
    name: row.name,
    dueDate: row.due_date,

    repeat:
      row.repeat_unit && row.repeat_interval
        ? {
            unit: row.repeat_unit,
            interval: row.repeat_interval,
          }
        : undefined,

    notificationEnabled: row.notification_enabled ?? false,

    notificationTime: row.notification_time ?? undefined,

    completedAt: row.completed_at ?? undefined,

    createdAt: row.created_at,
  };
}
