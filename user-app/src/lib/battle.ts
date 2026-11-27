// 成果の画面の 戦闘の 予定表（docs/設計-アニメーション.md の C・D）。
// 1体ずつ「出る → 主人公が てまりを ぽん → HPが へる → 光の粒で 消える → ポイントが 飛ぶ」を 時刻（秒）で 決める。
// 画面は 時計の t（秒）を わたして、その時の 形（data-phase・HP・ポイント）を ここから もらう。
// このファイルは 単体テスト（node --test）で そのまま動かすので、React・絵・import.meta.glob を入れない。

import type { EnemyId, EnemyKind } from '../data/enemies.ts';
import { STEPS_PER_ENEMY, bossSteps, enemyDef, pointsFor } from './game.ts';
import { resultSounds, soundLength, type SoundName } from './sound.ts';
import type { PendingAdventure } from './types';

/** 戦闘で 1体ずつ 見せるのは 8回まで（ボス・レアを 先に えらぶ。のこりの ポイントは さいごに 足す） */
export const MAX_ROUNDS = 8;
/** この回数 から 早送りにする */
export const FAST_FROM = 4;
/** 1回の 長さ（秒）：ふつう・レア・ボス。早送りの ときは 短い方 */
export const ROUND_SEC = { normal: 1.5, rare: 1.8, boss: 2.2 } as const;
export const FAST_ROUND_SEC = { normal: 0.8, rare: 1.2, boss: 1.6 } as const;
/** エリアを こえる 演出の 長さ（秒） */
export const AREA_SEC = 1.8;
export const FAST_AREA_SEC = 1.4;
/** はじめの 間（画面が 出て おちつくまで）と、おわりの 間（秒） */
export const LEAD_SEC = 0.3;
export const TAIL_SEC = 0.2;
/** 音と 音の あいだ（秒） */
export const SOUND_GAP_SEC = 0.15;

/** 1回の 中の 区切り（回の 長さに 対する 割合） */
export const PHASE = {
  /** ここまで 敵が 出てくる */
  attack: 0.22,
  /** ここから HP が へりはじめる（てまりが 当たる） */
  drainFrom: 0.3,
  /** ここまで 主人公が 前に出て てまりを 出す */
  drain: 0.4,
  /** ここで HP が おわりの 数になり、敵が 光の粒に なって 消えはじめる（ポイントが 飛ぶ） */
  vanish: 0.72,
  /** ここで 消えおわる */
  gone: 0.95,
} as const;

export interface BattleRound {
  id: EnemyId;
  kind: EnemyKind;
  /** 成果の enemies の 何番目か（戦っている途中の ボスは null） */
  index: number | null;
  /** HP（歩数）：はじめ・おわり・いっぱい */
  hpFrom: number;
  hpTo: number;
  hpMax: number;
  /** たおしたか（戦っている途中の ボスは false で、消えずに のこる） */
  defeated: boolean;
  /** この回で もらう ポイント */
  points: number;
  /** はじまりと 長さ（秒） */
  start: number;
  dur: number;
}

/** 登場・節目の 演出：rare（レアに 会えた）／boss（ボスに 会う）／area（エリアを こえる） */
export interface BattleEvent {
  kind: 'rare' | 'boss' | 'area';
  at: number;
  dur: number;
  /** こえた エリア（area の とき） */
  area?: number;
}

/** 音を 鳴らす 時刻 */
export interface SoundCue {
  at: number;
  name: SoundName;
}

export interface BattlePlan {
  rounds: BattleRound[];
  events: BattleEvent[];
  sounds: SoundCue[];
  /** 早送りか */
  fast: boolean;
  /** 戦闘の 長さ（秒）。敵が いないときは 0 */
  total: number;
  /** この成果で もらう ポイントの 合計（おわりに 見せる 数） */
  points: number;
}

/** 回の 形：wait（まだ）／enter（出てくる）／attack（主人公が てまりを 出す）／drain（HP が へる）／
 * vanish（光の粒で 消える）／gone（消えた）／stay（戦っている途中の ボスが のこる） */
export type RoundPhase = 'wait' | 'enter' | 'attack' | 'drain' | 'vanish' | 'gone' | 'stay';

export type HeroPose = 'stand' | 'attack' | 'cheer';

const isBossKind = (kind: EnemyKind) => kind === 'boss' || kind === 'ura';

function roundSec(kind: EnemyKind, fast: boolean): number {
  const table = fast ? FAST_ROUND_SEC : ROUND_SEC;
  if (isBossKind(kind)) return table.boss;
  return kind === 'rare' ? table.rare : table.normal;
}

/** 敵が 消えはじめる（ポイントが 飛ぶ）時刻 */
export function defeatAt(round: BattleRound): number {
  return round.start + round.dur * PHASE.vanish;
}

type Draft = Omit<BattleRound, 'start' | 'dur'>;

/** 成果から 戦闘の 予定表を 作る */
export function battlePlan(pending: PendingAdventure): BattlePlan {
  // 1. 敵ごとの 回。ボスは「前の残り」（bossBefore）から。前の残りは さいしょの ボスにだけ 使う
  let before = pending.bossBefore ?? null;
  const all: Draft[] = pending.enemies.map((id, index) => {
    const kind = enemyDef(id).kind;
    if (isBossKind(kind)) {
      const max = bossSteps(id);
      const from = before && before.id === id ? Math.min(max, before.left) : max;
      before = null;
      return { id, kind, index, hpFrom: from, hpTo: 0, hpMax: max, defeated: true, points: pointsFor(id) };
    }
    return { id, kind, index, hpFrom: STEPS_PER_ENEMY, hpTo: 0, hpMax: STEPS_PER_ENEMY, defeated: true, points: pointsFor(id) };
  });
  // 戦っている途中の ボス：前の残り → 今の残り（たおしていないので 消えない）
  if (pending.boss) {
    const b = pending.boss;
    const from = before && before.id === b.id ? before.left : b.total;
    all.push({ id: b.id, kind: enemyDef(b.id).kind, index: null, hpFrom: Math.max(b.left, Math.min(b.total, from)), hpTo: b.left, hpMax: b.total, defeated: false, points: 0 });
  }

  // 2. 多いときは 8回まで：途中の ボス → たおした ボス → レア → ふつう の 順に えらび、並びは 会った 順の まま
  let chosen = all;
  if (all.length > MAX_ROUNDS) {
    const rank = (r: Draft) => (!r.defeated ? 0 : isBossKind(r.kind) ? 1 : r.kind === 'rare' ? 2 : 3);
    const order = all.map((_, i) => i).sort((a, b) => rank(all[a]) - rank(all[b]) || a - b);
    const keep = new Set(order.slice(0, MAX_ROUNDS));
    chosen = all.filter((_, i) => keep.has(i));
  }

  // 3. 時刻。4回 以上は 早送り。エリアを こえたら その ボスの 回の あとに 演出を はさむ
  const fast = chosen.length >= FAST_FROM;
  const rounds: BattleRound[] = [];
  const events: BattleEvent[] = [];
  const cleared = new Set(pending.clearedAreas);
  let t = LEAD_SEC;
  for (const r of chosen) {
    const dur = roundSec(r.kind, fast);
    rounds.push({ ...r, start: t, dur });
    if (r.kind === 'rare') events.push({ kind: 'rare', at: t, dur });
    if (isBossKind(r.kind)) events.push({ kind: 'boss', at: t, dur });
    t += dur;
    const area = enemyDef(r.id).area;
    if (r.defeated && r.kind === 'boss' && typeof area === 'number' && cleared.has(area)) {
      cleared.delete(area);
      const d = fast ? FAST_AREA_SEC : AREA_SEC;
      events.push({ kind: 'area', at: t, dur: d, area });
      t += d;
    }
  }
  const total = rounds.length > 0 ? t + TAIL_SEC : 0;

  return { rounds, events, sounds: battleSounds(pending, rounds, events), fast, total, points: pending.points };
}

/**
 * 音を 鳴らす 時刻。音の 名前は 今の resultSounds で えらび（2つまで）、時刻だけ 演出に 合わせる：
 * ボスを たおす（太鼓から はじまる）・ボスに 会う → その ボスが 出る時／レア → レアが 出る時／
 * たおす → 1体目が 消える時／エリアを こえる → その 演出の はじめ。重ならないよう あとの 音を ずらす
 */
function battleSounds(pending: PendingAdventure, rounds: BattleRound[], events: BattleEvent[]): SoundCue[] {
  const kinds = pending.enemies.map((e) => enemyDef(e).kind);
  const names = resultSounds({
    defeated: pending.enemies.length,
    bossDefeated: kinds.includes('boss') || kinds.includes('ura'),
    areaCleared: pending.clearedAreas.length > 0,
    rare: pending.rares.length > 0,
    bossAhead: pending.boss !== null,
  });
  const timeOf = (name: SoundName): number => {
    if (name === 'bossDefeat') return rounds.find((r) => r.defeated && isBossKind(r.kind))?.start ?? 0;
    if (name === 'bossMeet') return rounds.find((r) => !r.defeated)?.start ?? 0;
    if (name === 'rare') return rounds.find((r) => r.kind === 'rare')?.start ?? 0;
    if (name === 'areaClear') return [...events].reverse().find((e) => e.kind === 'area')?.at ?? 0;
    const first = rounds.find((r) => r.defeated);
    return first ? defeatAt(first) : 0;
  };
  const cues = names.map((name) => ({ name, at: timeOf(name) })).sort((a, b) => a.at - b.at);
  for (let i = 1; i < cues.length; i += 1) {
    const prev = cues[i - 1];
    cues[i].at = Math.max(cues[i].at, prev.at + soundLength(prev.name) + SOUND_GAP_SEC);
  }
  return cues;
}

/** 時刻 t の 回の 形 */
export function roundPhase(round: BattleRound, t: number): RoundPhase {
  if (t < round.start) return 'wait';
  const p = (t - round.start) / round.dur;
  if (p < PHASE.attack) return 'enter';
  if (p < PHASE.drain) return 'attack';
  if (p < PHASE.vanish) return 'drain';
  if (!round.defeated) return 'stay';
  if (p < PHASE.gone) return 'vanish';
  return 'gone';
}

/** 時刻 t の HP（歩数）。てまりが 当たってから 消えはじめるまでに まっすぐ へる */
export function hpAt(round: BattleRound, t: number): number {
  const p = (t - round.start) / round.dur;
  if (p <= PHASE.drainFrom) return round.hpFrom;
  if (p >= PHASE.vanish) return round.hpTo;
  const k = (p - PHASE.drainFrom) / (PHASE.vanish - PHASE.drainFrom);
  return Math.round(round.hpFrom + (round.hpTo - round.hpFrom) * k);
}

/** 時刻 t までに もらった ポイント（おわりには 合計） */
export function pointsAt(plan: BattlePlan, t: number): number {
  if (t >= plan.total) return plan.points;
  let sum = 0;
  for (const r of plan.rounds) if (r.defeated && defeatAt(r) <= t) sum += r.points;
  return Math.min(plan.points, sum);
}

/** 時刻 t の 主人公の ポーズ：てまりを 出している 回が あれば attack、おわったら cheer（勝ちのポーズ） */
export function heroPoseAt(plan: BattlePlan, t: number): HeroPose {
  if (plan.rounds.length === 0) return 'stand';
  if (t >= plan.total) return 'cheer';
  return plan.rounds.some((r) => roundPhase(r, t) === 'attack') ? 'attack' : 'stand';
}

/** 時刻 t に 動いている 演出（無ければ null） */
export function eventAt(plan: BattlePlan, t: number, kind: BattleEvent['kind']): BattleEvent | null {
  return plan.events.find((e) => e.kind === kind && e.at <= t && t < e.at + e.dur) ?? null;
}

/** たおした敵の 小さい絵の 列：index 番目の 絵が 出る 時刻（その敵が 消える時。回に 入れなかった 敵は 次の回の 時） */
export function listDelay(plan: BattlePlan, index: number): number {
  const r = plan.rounds.find((x) => x.index !== null && x.index >= index);
  return r ? defeatAt(r) : plan.total;
}

// ---------- HPバーの 色 ----------

/** HPバーの 色：いっぱいは 緑、0 に 近づくと 金（赤い「危険」の 色は 使わない）。レアは いつも 金 */
export const HP_GREEN = '#3E9A63';
export const HP_GOLD = '#FFC53D';

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function hpColor(ratio: number, rare = false): string {
  if (rare) return HP_GOLD;
  const r = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
  const [a, b] = [rgb(HP_GREEN), rgb(HP_GOLD)];
  const mix = a.map((v, i) => Math.round(b[i] + (v - b[i]) * r));
  return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
