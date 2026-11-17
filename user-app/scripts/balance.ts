// バランスの計算：1日 5,000歩を 182日（約半年）歩いたとき、レベル・エリア・出会い・レア・ポイントが どう進むか。
// 使い方（user-app/ で）：npm run balance（＝ node scripts/balance.ts）
// 決まった数（26日で エリア1をこえる、182日で 91万歩・レベル90）は src/lib/balance.test.ts で確かめる。

import { pathToFileURL } from 'node:url';
import { END_BOSSES, clearPending, enemyDef, newGame, placeName, walk } from '../src/lib/game.ts';

export const STEPS_PER_DAY = 5000;
export const DAYS = 182;
/** 表に出す区切り（26日で 1エリア） */
export const REPORT_EVERY = 26;

export interface BalanceRow {
  day: number;
  totalSteps: number;
  level: number;
  /** その日の おわりに いる所 */
  place: string;
  /** こえたエリアの数 */
  cleared: number;
  /** 道中の出会いの数（ボスは 数えない） */
  encounters: number;
  /** レアに会った回数 */
  rares: number;
  /** ちがうレアの数 */
  distinctRares: number;
  points: number;
}

/** 1つの種で、1日 perDay 歩を days 日 歩く。every 日ごとの ようすを返す */
export function simulate(seed: number, days = DAYS, perDay = STEPS_PER_DAY, every = REPORT_EVERY): BalanceRow[] {
  const rows: BalanceRow[] = [];
  let game = newGame(seed);
  let cleared = 0;
  let encounters = 0;
  let rares = 0;
  const met = new Set<string>();
  for (let day = 1; day <= days; day += 1) {
    game = walk(game, perDay);
    const p = game.pending!;
    cleared += p.clearedAreas.length;
    for (const id of p.enemies) {
      const kind = enemyDef(id).kind;
      if (kind === 'normal' || kind === 'rare') encounters += 1;
    }
    rares += p.rares.length;
    for (const id of p.rares) met.add(id);
    game = clearPending(game); // その日の成果を 見おわった
    if (day % every === 0 || day === days) {
      rows.push({ day, totalSteps: game.totalSteps, level: game.level, place: placeName(game.pos), cleared, encounters, rares, distinctRares: met.size, points: game.points });
    }
  }
  return rows;
}

export interface BalanceSummary {
  seeds: number;
  /** 区切りごとの 平均（レベル・いる所・出会いの数は 種によらず 同じ） */
  rows: BalanceRow[];
  /** 1巡りで レア7体が そろった人の割合 */
  allRaresRate: number;
}

/** 種を seeds 個 変えて 平均を出す */
export function summarize(seeds = 1000): BalanceSummary {
  let rows: BalanceRow[] = [];
  let all = 0;
  for (let seed = 0; seed < seeds; seed += 1) {
    const one = simulate(seed);
    if (one[one.length - 1].distinctRares === 7) all += 1;
    if (seed === 0) {
      rows = one.map((r) => ({ ...r }));
    } else {
      one.forEach((r, i) => {
        rows[i].rares += r.rares;
        rows[i].distinctRares += r.distinctRares;
        rows[i].points += r.points;
      });
    }
  }
  for (const r of rows) {
    r.rares /= seeds;
    r.distinctRares /= seeds;
    r.points /= seeds;
  }
  return { seeds, rows, allRaresRate: all / seeds };
}

const num = (n: number) => Math.round(n).toLocaleString('ja-JP');

/** 表（Markdown）と まとめの文 */
export function report(summary: BalanceSummary): string {
  const last = summary.rows[summary.rows.length - 1];
  const endSteps = END_BOSSES.reduce((sum, b) => sum + b.steps, 0);
  const lines = [
    `1日 ${num(STEPS_PER_DAY)}歩を ${DAYS}日（種 ${num(summary.seeds)}個の平均）`,
    '',
    '| 日 | 累計歩数 | レベル | いる所 | こえたエリア | 出会い | レア（平均） | ちがうレア（平均） | ポイント（平均） |',
    '| ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |',
    ...summary.rows.map(
      (r) =>
        `| ${r.day} | ${num(r.totalSteps)} | ${r.level} | ${r.place} | ${r.cleared} | ${num(r.encounters)} | ${r.rares.toFixed(1)} | ${r.distinctRares.toFixed(1)} | ${num(r.points)} |`,
    ),
    '',
    `- 1巡り（${num(last.totalSteps)}歩）で レア7体が そろう割合：${(summary.allRaresRate * 100).toFixed(1)}%`,
    `- 1巡りで 会える ちがうレアの数の平均：${last.distinctRares.toFixed(2)}体（レアに会う回数の平均：${last.rares.toFixed(1)}回）`,
    `- 年こしの峠（おおみそか＋はつひので）：${num(endSteps)}歩 ＝ そのあと 約${(endSteps / STEPS_PER_DAY).toFixed(1)}日`,
  ];
  return lines.join('\n');
}

// このファイルを そのまま動かしたときだけ、表を出す（テストから読みこんだときは 出さない）
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(report(summarize()));
}
