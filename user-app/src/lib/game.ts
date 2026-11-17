// 歩くと進む冒険（M-07〜M-09）。きまりは docs/設計-ゲームの核.md。
// - 歩いた歩数が そのまま経験値になる。経験値は持ち越し（16章で決定）：レベルが上がっても あまりは次へ
// - 歩くと敵に会い、たおすとポイントが手に入る（戦い方は未決のため、自動でたおす形にしておく）
// - 歩いた分の冒険は 立ち止まって開いたときに 成果だけまとめて見せる（16章で決定）
// - 7つのエリアを 順に歩く。1エリアは 道中 120,000歩（750歩ごとに 敵に会う）＋ ボス 10,000歩
// - 出会う敵は「種＋巡り＋エリア＋出会いの番号」から 計算で決める（保存しない）
// このファイルは 単体テスト（node --test）で そのまま動かすので、React・絵・import.meta.glob を入れない。

import { AREAS, type AreaDef } from '../data/areas.ts';
import { ENEMIES, type EnemyDef, type EnemyId } from '../data/enemies.ts';
import { mulberry32, randAt, subSeed } from './random.ts';
import type { GameState, PendingAdventure } from './types';

/** エリアの番号（1〜7）。'end' は クリアのあとの「年こしの峠」と「ふりかえりの道」 */
export type AreaNo = EnemyDef['area'];

const ENEMY_LIST: readonly EnemyDef[] = ENEMIES;
const ENEMY_BY_ID = new Map<string, EnemyDef>(ENEMY_LIST.map((e) => [e.id, e]));

/** 敵の名前（ひらがな） */
export const ENEMY_NAMES = Object.fromEntries(ENEMY_LIST.map((e) => [e.id, e.name])) as Record<EnemyId, string>;

/** 敵の表の1行（名前・エリア・種類・図鑑の一言） */
export function enemyDef(id: EnemyId): EnemyDef {
  return ENEMY_BY_ID.get(id)!;
}

function isEnemyId(value: unknown): value is EnemyId {
  return typeof value === 'string' && ENEMY_BY_ID.has(value);
}

const ALL_NORMALS = ENEMIES.filter((e) => e.kind === 'normal').map((e) => e.id);
const ALL_RARES = ENEMIES.filter((e) => e.kind === 'rare').map((e) => e.id);

/** 敵に1回会うまでの歩数 */
export const STEPS_PER_ENEMY = 750;
/** 1回の出会いが レアになる確率（青天井：かならず会える仕組みは 作らない） */
export const RARE_RATE = 1 / 80;
/** 1エリアの 道中の歩数（750歩 × 160回の出会い） */
export const ROAD_STEPS = 120_000;
/** ボスの歩数（歩いた分だけ のこりが へる） */
export const BOSS_STEPS = 10_000;
export const AREA_STEPS = ROAD_STEPS + BOSS_STEPS;
/** 1巡り（7エリア）の歩数 */
export const LAP_STEPS = AREA_STEPS * AREAS.length;
/** クリアのあとの「年こしの峠」の 裏ボス2体（歩数は 百八つの かね・一年365日に ちなむ） */
export const END_BOSSES: readonly { id: EnemyId; steps: number; points: number }[] = [
  { id: 'oomisoka', steps: 10_800, points: 108 },
  { id: 'hatsuhinode', steps: 36_500, points: 365 },
];
/** 年こしの峠の おわり。ここから先は「ふりかえりの道」で、次の巡りを はじめられる */
export const LAP_END = LAP_STEPS + END_BOSSES.reduce((sum, b) => sum + b.steps, 0);

/** 敵を1体たおすと もらえるポイント */
export function pointsFor(id: EnemyId): number {
  const kind = enemyDef(id).kind;
  if (kind === 'normal') return 10;
  if (kind === 'rare') return 50;
  if (kind === 'boss') return 100;
  return END_BOSSES.find((b) => b.id === id)?.points ?? 0;
}

// ---------- レベル ----------

/**
 * レベル L から L+1 に上がるのに いる経験値（歩数）。レベルが上がるほど 少しずつ ふえる。
 * 1巡り 910,000歩で レベル90 になる式。レベル12 は 3,600歩で、
 * Figma の H-01（レベル12・あと1,450歩で バー20マスのうち12マス）に合う。
 */
export function expForNextLevel(level: number): number {
  return 1200 + 200 * level;
}

/** レベルの計算で あつかう 累計歩数の上限 */
export const MAX_TOTAL_STEPS = 1_000_000_000;

/** レベル1 から そのレベルに なるまでの 累計歩数 */
export function totalForLevel(level: number): number {
  return (level - 1) * (1200 + 100 * level);
}

/** 累計歩数から レベルと、いまのレベルの中の経験値を出す */
export function levelFromTotal(total: number): { level: number; exp: number } {
  let level = 1;
  // こわれた記録に とても大きな数が入っていても 止まらないよう、上を 10億歩で おさえる（1日1万歩で 270年ぶん）
  let exp = Math.min(MAX_TOTAL_STEPS, Math.max(0, Math.floor(total) || 0));
  while (exp >= expForNextLevel(level)) {
    exp -= expForNextLevel(level);
    level += 1;
  }
  return { level, exp };
}

/** 次のレベルまで あと何歩か */
export function stepsToNextLevel(game: GameState): number {
  return Math.max(0, expForNextLevel(game.level) - game.exp);
}

/** 経験値のバーの割合（0〜1） */
export function levelProgress(game: GameState): number {
  return Math.min(1, game.exp / expForNextLevel(game.level));
}

// ---------- いまどこか ----------

/**
 * 道の区切り。
 * road：道中（750歩ごとに 敵に会う）／boss：エリアのボス（道中の出会いは 止まる）／
 * ura：年こしの峠の 裏ボス（出会いは つづく）／after：ふりかえりの道（おわりは ない）
 */
export interface Segment {
  kind: 'road' | 'boss' | 'ura' | 'after';
  area: AreaNo;
  /** はじまり・おわり（巡りの中の歩数）。ふりかえりの道の おわりは Infinity */
  start: number;
  end: number;
  /** 戦っているボス（boss・ura のとき） */
  boss: EnemyId | null;
}

/** 巡りの中で pos 歩 進んだとき、どの区切りに いるか */
export function segmentAt(pos: number): Segment {
  const p = Math.max(0, pos);
  if (p < LAP_STEPS) {
    const index = Math.floor(p / AREA_STEPS);
    const area = AREAS[index];
    const start = index * AREA_STEPS;
    const no = area.no as AreaNo;
    if (p < start + ROAD_STEPS) return { kind: 'road', area: no, start, end: start + ROAD_STEPS, boss: null };
    return { kind: 'boss', area: no, start: start + ROAD_STEPS, end: start + AREA_STEPS, boss: area.boss };
  }
  let start = LAP_STEPS;
  for (const b of END_BOSSES) {
    if (p < start + b.steps) return { kind: 'ura', area: 'end', start, end: start + b.steps, boss: b.id };
    start += b.steps;
  }
  return { kind: 'after', area: 'end', start, end: Infinity, boss: null };
}

/** いま戦っている途中のボスと、のこりの歩数。戦っていなければ null */
export function bossAt(pos: number): { id: EnemyId; left: number; total: number } | null {
  const seg = segmentAt(pos);
  if (!seg.boss) return null;
  return { id: seg.boss, left: seg.end - Math.max(0, pos), total: seg.end - seg.start };
}

/** クリアのあとの 2つの場所の名前 */
export const END_PASS_NAME = '年こしの峠';
export const AFTER_ROAD_NAME = 'ふりかえりの道';

/** いまいる所の名前（エリアの名前。クリアのあとは 年こしの峠 → ふりかえりの道） */
export function placeName(pos: number): string {
  const seg = segmentAt(pos);
  if (typeof seg.area === 'number') return AREAS[seg.area - 1].name;
  return seg.kind === 'ura' ? END_PASS_NAME : AFTER_ROAD_NAME;
}

// ---------- 出会い ----------

function areaDef(area: number): AreaDef {
  return AREAS[Math.min(AREAS.length, Math.max(1, area)) - 1];
}

/** ふつう12体を 種で並べかえた「袋」。12回の出会いで 1まわりする（cycle：何まわり目か） */
export function normalBag(seed: number, lap: number, area: number, cycle: number): EnemyId[] {
  const bag = [...areaDef(area).normals];
  const rand = mulberry32(subSeed(seed, lap, area, 'bag', cycle));
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const k = Math.floor(rand() * (i + 1));
    [bag[i], bag[k]] = [bag[k], bag[i]];
  }
  return bag;
}

/**
 * そのエリアの j番目（0から）の出会いの敵。
 * まず 1/80 で レア。ちがえば ふつう12体の袋から（レアの回は その回の ふつうを とばす）。
 * 'end'（年こしの峠・ふりかえりの道）は、レア7体か ふつう84体から 等しい確率で えらぶ。
 */
export function encounterAt(seed: number, lap: number, area: AreaNo, j: number): EnemyId {
  const rare = randAt(subSeed(seed, lap, area, 'rare'), j) < RARE_RATE;
  if (area === 'end') {
    const pick = randAt(subSeed(seed, lap, area, 'pick'), j);
    const from = rare ? ALL_RARES : ALL_NORMALS;
    return from[Math.floor(pick * from.length)];
  }
  if (rare) return areaDef(area).rare;
  return normalBag(seed, lap, area, Math.floor(j / 12))[j % 12];
}

/** いまの区切りで、今までに 何回 敵に会ったか（＝次の出会いの番号）。ボスと戦っている間は 数えない */
function encounterIndex(pos: number, seg: Segment): number {
  const from = seg.kind === 'road' ? seg.start : LAP_STEPS;
  return Math.floor((pos - from) / STEPS_PER_ENEMY);
}

/** 次に会う敵（ボスと戦っている間は そのボス） */
export function upcomingEnemy(game: GameState): EnemyId {
  const seg = segmentAt(game.pos);
  if (seg.boss) return seg.boss;
  return encounterAt(game.seed, game.lap, seg.area, encounterIndex(game.pos, seg));
}

// ---------- 歩く ----------

/** はじめての人の ゲームの記録。seed は 人ごとの種（登録のとき id から作る） */
export function newGame(seed: number): GameState {
  return { v: 3, seed: seed >>> 0, totalSteps: 0, lap: 1, pos: 0, level: 1, exp: 0, points: 0, seen: {}, pending: null };
}

/** 歩いた分を 冒険に入れる。成果は pending にたまり、見たときに消す。歩数が 1以上なら、敵が 0体でも pending を作る */
export function walk(game: GameState, steps: number): GameState {
  let left = Math.floor(steps);
  if (!Number.isFinite(left) || left <= 0) return game;
  const walked = left;

  // 経験値とレベル（あまりは持ち越し）
  const totalSteps = game.totalSteps + walked;
  const { level, exp } = levelFromTotal(totalSteps);

  let { pos, points } = game;
  const seen = { ...game.seen };
  const pending: PendingAdventure = game.pending
    ? { ...game.pending, enemies: [...game.pending.enemies], clearedAreas: [...game.pending.clearedAreas], rares: [...game.pending.rares] }
    : { steps: 0, enemies: [], exp: 0, points: 0, fromLevel: game.level, toLevel: game.level, boss: null, clearedAreas: [], rares: [] };

  const defeat = (id: EnemyId) => {
    const got = pointsFor(id);
    pending.enemies.push(id);
    pending.points += got;
    points += got;
    seen[id] = (seen[id] ?? 0) + 1;
    if (enemyDef(id).kind === 'rare') pending.rares.push(id);
  };

  // 区切り（次の出会い・ボスの おわり）ごとに進める。一度に大きな歩数が入っても、出会いの数だけ くり返す
  while (left > 0) {
    const seg = segmentAt(pos);
    const meets = seg.kind !== 'boss'; // ボスと戦っている間は 道中の出会いを止める
    const nextMeet = meets
      ? (seg.kind === 'road' ? seg.start : LAP_STEPS) + (encounterIndex(pos, seg) + 1) * STEPS_PER_ENEMY
      : Infinity;
    const stop = Math.min(nextMeet, seg.end);
    const d = Math.min(left, stop - pos);
    pos += d;
    left -= d;
    if (pos === nextMeet) defeat(encounterAt(game.seed, game.lap, seg.area, encounterIndex(pos, seg) - 1));
    if (seg.boss && pos === seg.end) {
      defeat(seg.boss);
      if (seg.kind === 'boss' && typeof seg.area === 'number') pending.clearedAreas.push(seg.area);
    }
  }

  pending.steps += walked;
  pending.exp += walked;
  pending.toLevel = level;
  pending.boss = bossAt(pos);
  return { v: 3, seed: game.seed, totalSteps, lap: game.lap, pos, level, exp, points, seen, pending };
}

/** 成果を見おわった */
export function clearPending(game: GameState): GameState {
  return { ...game, pending: null };
}

/** はつひので を たおして「ふりかえりの道」に いる（次の巡りを はじめられる） */
export function canStartLap(game: GameState): boolean {
  return game.pos >= LAP_END;
}

/** 次の巡りを はじめる：巡りが 1ふえ、エリア1の入口に もどる。レベル・ポイント・会った回数は そのまま */
export function startLap(game: GameState): GameState {
  if (!canStartLap(game)) return game;
  return { ...game, lap: game.lap + 1, pos: 0, pending: game.pending ? { ...game.pending, boss: null } : null };
}

const KANJI_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 巡りの数の言い方（「二巡り目」）。画面には 2巡り目から出す */
export function lapLabel(lap: number): string {
  const n = Math.max(1, Math.floor(lap) || 1);
  if (n > 99) return `${n}巡り目`;
  const tens = Math.floor(n / 10);
  const kanji = (tens > 1 ? KANJI_DIGITS[tens] : '') + (tens > 0 ? '十' : '') + KANJI_DIGITS[n % 10];
  return `${kanji}巡り目`;
}

// ---------- 成果の画面に足す行 ----------

/** 成果の画面に足す行は 3行まで（こえた所・レア・ボスを 1行ずつ） */
export const MAX_RESULT_NOTES = 3;

/**
 * 成果の画面に足す行（内容があるときだけ。何もなければ 空）。
 * - こえた所：「はなあかりの小道を こえた。次は わかばの田んぼ道」（いくつも こえたときは さいごの所だけ）
 * - 会えたレア：「レアの どんぶらこに 会えた！」（3体より多いときは 数で伝える）
 * - 戦っている途中のボス：「ボス はなふぶき　あと 6,200歩」
 */
export function resultNotes(pending: PendingAdventure): string[] {
  const notes: string[] = [];

  if (pending.enemies.includes(END_BOSSES[END_BOSSES.length - 1].id)) {
    notes.push(`${END_PASS_NAME}を こえた。「わたし」から 次の巡りを はじめられます`);
  } else if (pending.clearedAreas.length > 0) {
    const last = pending.clearedAreas[pending.clearedAreas.length - 1];
    const next = last < AREAS.length ? AREAS[last].name : END_PASS_NAME;
    const many = new Set(pending.clearedAreas).size > 1;
    notes.push(`${AREAS[last - 1].name}${many ? 'まで' : 'を'} こえた。次は ${next}`);
  }

  const rares = [...new Set(pending.rares)];
  if (rares.length > 0) {
    const names = rares.length <= 2 ? rares.map((id) => ENEMY_NAMES[id]).join('・') : `${ENEMY_NAMES[rares[0]]} など ${rares.length}体`;
    notes.push(`レアの ${names}に 会えた！`);
  }

  if (pending.boss) {
    notes.push(`ボス ${ENEMY_NAMES[pending.boss.id]}　あと ${pending.boss.left.toLocaleString('ja-JP')}歩`);
  }
  return notes.slice(0, MAX_RESULT_NOTES);
}

/**
 * いまのレベルと「次のレベルまで あと何歩」から ゲームの記録を作る（サンプルの利用者用）。
 * はじめから その歩数だけ 歩いたことにして、会った敵の回数も 入れる。ポイントは 渡された数にする。
 */
export function gameAt(level: number, stepsLeftToNext: number, points: number, seed = 0): GameState {
  const total = totalForLevel(level) + Math.max(0, expForNextLevel(level) - stepsLeftToNext);
  return { ...walk(newGame(seed), total), totalSteps: total, level, points, pending: null };
}

// ---------- 保存した記録を 直す ----------

/**
 * 保存した記録の中の game として 受けとれるか。オブジェクトであれば 受けとり、中身は normalizeGame で直す
 * （level が 数でない・項目が欠けている などで、人ごと 記録を なくさないため）
 */
export function isGameRecord(value: unknown): boolean {
  return typeof value === 'object' && value !== null;
}

/** 数を 0以上の整数にする。項目が無ければ 初めの値、NaN などは 0 */
function count(value: unknown, initial = 0): number {
  if (typeof value !== 'number') return initial;
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

/** 古い式（次のレベルまで 3000 + 50 × レベル）で、そのレベルに なるまでの 累計歩数 */
function oldTotalForLevel(level: number): number {
  return (level - 1) * (3000 + 25 * level);
}

function normalizePending(raw: unknown, level: number, fromLevel: number | null, pos: number): PendingAdventure | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  const enemies = Array.isArray(p.enemies) ? p.enemies.filter(isEnemyId) : [];
  const rares = Array.isArray(p.rares) ? p.rares.filter(isEnemyId).filter((id) => enemyDef(id).kind === 'rare') : [];
  const cleared = Array.isArray(p.clearedAreas)
    ? p.clearedAreas.filter((a): a is number => Number.isInteger(a) && a >= 1 && a <= AREAS.length)
    : [];
  return {
    steps: count(p.steps),
    enemies,
    exp: count(p.exp),
    points: count(p.points),
    fromLevel: Math.min(level, Math.max(1, fromLevel ?? count(p.fromLevel, level))),
    toLevel: level,
    boss: bossAt(pos),
    clearedAreas: [...new Set(cleared)],
    rares,
  };
}

/**
 * 保存した記録を いまの形（v:3）に直す。こわれた記録も 消さずに直す。
 * - 足りない項目は 初めの値、NaN は 0。2回通しても 同じ結果
 * - 古い記録（v が無い）は、古い式で 累計歩数を出してから、新しい式で レベルを出しなおす
 * seed：種が無い記録に 入れる種（利用者の id から作る）
 */
export function normalizeGame(raw: unknown, seed = 0): GameState {
  if (typeof raw !== 'object' || raw === null) return newGame(seed);
  const g = raw as Record<string, unknown>;

  if (g.v !== 3) {
    // 古い記録：レベルと経験値から 累計歩数を出し、その歩数だけ 巡りを進んだことにする
    const total = oldTotalForLevel(Math.max(1, count(g.level, 1))) + count(g.exp);
    const { level, exp } = levelFromTotal(total);
    const old = typeof g.pending === 'object' && g.pending !== null ? (g.pending as Record<string, unknown>) : null;
    const fromLevel = old ? levelFromTotal(Math.max(0, total - count(old.steps))).level : null;
    return {
      v: 3,
      seed: seed >>> 0,
      totalSteps: total,
      lap: 1,
      pos: total,
      level,
      exp,
      points: count(g.points),
      seen: {},
      pending: normalizePending(old, level, fromLevel, total),
    };
  }

  const totalSteps = count(g.totalSteps);
  const pos = count(g.pos);
  const { level, exp } = levelFromTotal(totalSteps);
  const seen: GameState['seen'] = {};
  if (typeof g.seen === 'object' && g.seen !== null) {
    for (const [id, times] of Object.entries(g.seen)) {
      if (isEnemyId(id) && count(times) > 0) seen[id] = count(times);
    }
  }
  return {
    v: 3,
    seed: count(g.seed, seed) >>> 0,
    totalSteps,
    lap: Math.max(1, count(g.lap, 1)),
    pos,
    level,
    exp,
    points: count(g.points),
    seen,
    pending: normalizePending(g.pending, level, null, pos),
  };
}
