// 和暦（元号）の変換。誕生日の「年」は 和暦と西暦を ならべて見せる（U-02 注記）。

interface Era {
  name: string;
  /** 元年の初日 */
  start: { year: number; month: number; day: number };
}

const ERAS: Era[] = [
  { name: '令和', start: { year: 2019, month: 5, day: 1 } },
  { name: '平成', start: { year: 1989, month: 1, day: 8 } },
  { name: '昭和', start: { year: 1926, month: 12, day: 25 } },
  { name: '大正', start: { year: 1912, month: 7, day: 30 } },
  { name: '明治', start: { year: 1868, month: 1, day: 25 } },
];

const toKey = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;

function eraYearLabel(era: Era, year: number) {
  const n = year - era.start.year + 1;
  return `${era.name}${n === 1 ? '元' : n}年`;
}

/** 日付まで分かっているときの 正確な和暦の年 */
export function eraOfDate(year: number, month: number, day: number): string {
  const key = toKey(year, month, day);
  const era = ERAS.find((e) => key >= toKey(e.start.year, e.start.month, e.start.day)) ?? ERAS[ERAS.length - 1];
  return eraYearLabel(era, year);
}

/**
 * 年だけのときの和暦。元号が変わった年は 両方を出す（例：昭和64年・平成元年）。
 * 月日が分かれば eraOfDate で1つにしぼる。
 */
export function eraOfYear(year: number, month?: number, day?: number): string {
  if (month && day) return eraOfDate(year, month, day);
  const atStart = eraOfDate(year, 1, 1);
  const atEnd = eraOfDate(year, 12, 31);
  return atStart === atEnd ? atStart : `${atStart}・${atEnd}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
