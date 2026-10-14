-- 관리 일정 완료를 하나의 트랜잭션으로 처리한다.
-- 1. 아직 완료되지 않은 일정만 완료 처리 (이미 완료됐으면 아무것도 만들지 않음)
-- 2. MEDICATION / VACCINATION이면 건강 기록 생성
-- 3. 반복 일정이면 다음 일정 생성 (다음 예정일은 클라이언트에서 계산해 전달)
-- 중간에 실패하면 전체가 롤백된다.
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
      notification_enabled, notification_time
    )
    values (
      v_schedule.user_id, v_schedule.pet_id, v_schedule.type, v_schedule.name,
      p_next_due_date,
      v_schedule.repeat_unit, v_schedule.repeat_interval,
      v_schedule.repeat_anchor_day, v_schedule.dosage_text,
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
