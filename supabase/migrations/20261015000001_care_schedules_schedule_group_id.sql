-- 하루 여러 번 투약처럼 함께 등록된 일정을 묶는 그룹 ID
alter table public.care_schedules
  add column if not exists schedule_group_id uuid;

create index if not exists care_schedules_schedule_group_id_idx
  on public.care_schedules (schedule_group_id)
  where schedule_group_id is not null;

create or replace function public.complete_care_schedule(
  p_schedule_id uuid,
  p_occurred_at timestamptz,
  p_next_due_date date default null
)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_schedule public.care_schedules;
  v_record public.health_records;
  v_next public.care_schedules;
begin
  update public.care_schedules
  set completed_at = now()
  where id = p_schedule_id
    and completed_at is null
  returning * into v_schedule;

  if not found then
    select * into v_schedule
    from public.care_schedules
    where id = p_schedule_id;

    return jsonb_build_object(
      'already_completed', true,
      'schedule', to_jsonb(v_schedule)
    );
  end if;

  if v_schedule.type = 'MEDICATION' then
    insert into public.health_records (
      user_id, pet_id, type, title, medication_name, dosage_text, occurred_at
    )
    values (
      v_schedule.user_id, v_schedule.pet_id, 'MEDICATION', v_schedule.name,
      v_schedule.name, v_schedule.dosage_text, p_occurred_at
    )
    returning * into v_record;
  elsif v_schedule.type = 'VACCINATION' then
    insert into public.health_records (
      user_id, pet_id, type, title, vaccination_name, occurred_at
    )
    values (
      v_schedule.user_id, v_schedule.pet_id, 'VACCINATION', v_schedule.name,
      v_schedule.name, p_occurred_at
    )
    returning * into v_record;
  end if;

  if v_schedule.repeat_unit is not null and p_next_due_date is not null then
    insert into public.care_schedules (
      user_id, pet_id, type, name, due_date,
      repeat_unit, repeat_interval, repeat_anchor_day, dosage_text,
      schedule_group_id, notification_enabled, notification_time
    )
    values (
      v_schedule.user_id, v_schedule.pet_id, v_schedule.type, v_schedule.name,
      p_next_due_date,
      v_schedule.repeat_unit, v_schedule.repeat_interval,
      v_schedule.repeat_anchor_day, v_schedule.dosage_text,
      v_schedule.schedule_group_id,
      v_schedule.notification_enabled, v_schedule.notification_time
    )
    returning * into v_next;
  end if;

  return jsonb_build_object(
    'already_completed', false,
    'schedule', to_jsonb(v_schedule),
    'record', case when v_record.id is null then null else to_jsonb(v_record) end,
    'next', case when v_next.id is null then null else to_jsonb(v_next) end
  );
end;
$$;

grant execute on function public.complete_care_schedule(uuid, timestamptz, date) to authenticated;
