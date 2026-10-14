-- 월/년 반복의 기준 일(day-of-month)
-- 1/31 월 반복이 2/28 이후 3/28로 밀리지 않고 3/31로 돌아오도록 원래 날짜를 보존한다.
alter table public.care_schedules
  add column if not exists repeat_anchor_day smallint
  check (repeat_anchor_day between 1 and 31);

-- 기존 월/년 반복 일정은 현재 예정일의 일을 기준으로 채운다.
update public.care_schedules
set repeat_anchor_day = extract(day from due_date)::smallint
where repeat_unit in ('MONTH', 'YEAR')
  and repeat_anchor_day is null;
