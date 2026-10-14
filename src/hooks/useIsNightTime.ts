import { useEffect, useState } from 'react';

// 아바타를 rest 상태로 보여주는 시간대 (22시 ~ 다음 날 7시)
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 7;

function isNightHour(date: Date) {
  const hour = date.getHours();

  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

/**
 * 다음 밤/낮 경계 시각
 */
function getNextBoundary(date: Date) {
  const next = new Date(date);

  next.setMinutes(0, 0, 0);

  const hour = date.getHours();

  if (hour >= NIGHT_START_HOUR) {
    next.setDate(next.getDate() + 1);
    next.setHours(NIGHT_END_HOUR);
  } else if (hour < NIGHT_END_HOUR) {
    next.setHours(NIGHT_END_HOUR);
  } else {
    next.setHours(NIGHT_START_HOUR);
  }

  return next;
}

/**
 * 지금이 밤 시간대인지
 *
 * 경계 시각이 되면 다시 계산해서 화면을 갱신한다.
 */
export function useIsNightTime() {
  // 타이머가 경계보다 조금 일찍 끝나도 다시 예약되도록 확인 시각을 상태로 둔다.
  const [checkedAt, setCheckedAt] = useState(() => new Date());

  useEffect(() => {
    const timer = setTimeout(
      () => setCheckedAt(new Date()),
      getNextBoundary(checkedAt).getTime() - checkedAt.getTime() + 1000,
    );

    return () => clearTimeout(timer);
  }, [checkedAt]);

  return isNightHour(checkedAt);
}
