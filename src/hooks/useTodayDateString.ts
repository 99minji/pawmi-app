import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toDateString } from '@/utils/date';

/**
 * 오늘 날짜('YYYY-MM-DD')
 *
 * 앱을 켜둔 채 자정이 지나거나, background에서 돌아왔을 때 새 날짜로 갱신한다.
 */
export function useTodayDateString() {
  const [todayDateString, setTodayDateString] = useState(() =>
    toDateString(new Date()),
  );

  // foreground 복귀 시 갱신 (같은 날짜면 state가 그대로라 다시 렌더링되지 않음)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setTodayDateString(toDateString(new Date()));
      }
    });

    return () => subscription.remove();
  }, []);

  // 앱을 켜둔 채 자정이 지나면 갱신
  useEffect(() => {
    const now = new Date();

    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const timer = setTimeout(
      () => setTodayDateString(toDateString(new Date())),
      nextMidnight.getTime() - now.getTime() + 1000,
    );

    return () => clearTimeout(timer);
  }, [todayDateString]);

  return todayDateString;
}
