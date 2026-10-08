// 'YYYY-MM-DD' 문자열 <-> 로컬 Date 변환
// new Date('YYYY-MM-DD')는 UTC 자정으로 해석되므로 직접 파싱한다.

export function toDateString(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function formatKoreanDate(date: Date) {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 'HH:mm' 문자열 <-> 오늘 날짜 기준 Date 변환

export function parseTimeString(timeString: string) {
  const [hour, minute] = timeString.split(':').map(Number);

  const date = new Date();

  date.setHours(hour, minute, 0, 0);

  return date;
}

export function toTimeString(date: Date) {
  const hour = String(date.getHours()).padStart(2, '0');

  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${hour}:${minute}`;
}

export function formatKoreanTime(timeString: string) {
  return parseTimeString(timeString).toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * 날짜만 의미 있는 기록을 저장할 때 사용한다.
 *
 * 로컬 자정은 UTC로 바꾸면 전날이 될 수 있어서, 로컬 정오로 고정한 뒤 ISO 문자열로 변환한다.
 */
export function dateToOccurredAt(date: Date) {
  const result = new Date(date);

  result.setHours(12, 0, 0, 0);

  return result.toISOString();
}
