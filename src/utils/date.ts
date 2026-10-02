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
