// 日付のあつかい。日ごとの記録は 端末の時刻で「YYYY-MM-DD」の日付に分ける。

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export function now(): Date {
  return new Date();
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), d.getSeconds());
}

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 1か月のグラフで 日付を出す位置：1週間おき（最初の日・7日後・14日後・21日後・今日。R-02 注記） */
export function monthLabelIndexes(count: number): number[] {
  const last = count - 1;
  return [...[0, 7, 14, 21].filter((i) => i < last), last];
}

/** 今日をふくむ n 日分（古い日から） */
export function lastDays(today: Date, n: number): Date[] {
  return Array.from({ length: n }, (_, i) => startOfDay(addDays(today, i - (n - 1))));
}

export function formatMonthDay(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatTime(d: Date): string {
  return `${d.getHours()}:${pad(d.getMinutes())}`;
}

/** 例：10月23日 10:40 */
export function formatDateTime(d: Date): string {
  return `${formatMonthDay(d)} ${formatTime(d)}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** 最終受信の表示：今日なら時刻、昨日なら「昨日 18:05」、それより前は「3日前」 */
export function formatReceived(last: Date, today: Date): string {
  if (isSameDay(last, today)) return formatTime(last);
  const days = Math.round((startOfDay(today).getTime() - startOfDay(last).getTime()) / 86_400_000);
  if (days === 1) return `昨日 ${formatTime(last)}`;
  return `${days}日前`;
}

export function ageOn(birthday: { year: number; month: number; day: number }, today: Date): number {
  let age = today.getFullYear() - birthday.year;
  const beforeBirthday = today.getMonth() + 1 < birthday.month || (today.getMonth() + 1 === birthday.month && today.getDate() < birthday.day);
  if (beforeBirthday) age -= 1;
  return age;
}
