// ステージ（エリアごとの 場面）の 表と、時間帯・天気・粒の 数を 決める 関数。設計は docs/設計-ステージ.md。
// - 7つの道と「年こしの峠」に、空の色・時間帯の色・ギミック・天気の候補・目じるし・季節の色を もたせる
// - 時間帯は 本当の 時刻から、天気は「利用者の種＋日付」から 決める（同じ日は 同じ天気）
// - 粒（花びら・雨・雪 など）は 1場面で 多くても 12こ（MAX_PARTICLES）
// このファイルは 単体テスト（node --test）で そのまま動かすので、React・絵・import.meta.glob を入れない。
// 絵の 表は src/data/stageArt.ts、絵が 無いときの 代わりの ドット絵は src/data/stagePixels.ts。

import { AREAS } from './areas.ts';
import { segmentAt, type AreaNo } from '../lib/game.ts';
import { randAt, subSeed } from '../lib/random.ts';
import type { SoundName } from '../lib/sound.ts';

export type StageId = 'area1' | 'area2' | 'area3' | 'area4' | 'area5' | 'area6' | 'area7' | 'end';
/** 朝・昼・夕・夜 */
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'snow';
/** 年こしの峠の ようす：おおみそか・はつひのでと 戦う 間は 夜、はつひのでを たおした あとは 夜明け */
export type EndPhase = 'night' | 'dawn';
/** 場面を 出す 所 */
export type StageLayout = 'home' | 'walk' | 'battle';

export type GimmickId =
  | 'petals'
  | 'butterflies'
  | 'clouds'
  | 'rain'
  | 'ripples'
  | 'frog'
  | 'fireflies'
  | 'lanterns'
  | 'windchime'
  | 'fireworks'
  | 'waves'
  | 'gulls'
  | 'boat'
  | 'leaves'
  | 'dragonflies'
  | 'snow'
  | 'smoke'
  | 'windowLight'
  | 'stars'
  | 'starrySky'
  | 'seasonFlowers'
  | 'skyCycle'
  | 'bellRings'
  | 'sunrise';

/** 色を うすく 重ねる（color を alpha の こさで） */
export interface Tint {
  color: string;
  alpha: number;
}

export interface GimmickDef {
  /** やさしい 名前 */
  name: string;
  /**
   * 1場面に 描く 粒の 数（雲・波・小舟・窓の あかりなども 1つずつ 数える。空の色の 層は 0）。
   * 絵を 描く 所（StageGimmicks.tsx）は かならず この 数（drawCount）だけ 描く
   */
  particles: number;
  /** 歩行中に 描く 数が ちがう とき（ちょうちんは 歩行中は 上の ひもに 7つ ならべて 流す） */
  walkParticles?: number;
  /** 出す 場面 */
  layouts: readonly StageLayout[];
  /** 出す 時間帯（無ければ いつでも） */
  times?: readonly TimeOfDay[];
  /** 出す 天気（無ければ どの天気でも） */
  weathers?: readonly Weather[];
  /** 年こしの峠の ようす（これが ある ギミックは 年こしの峠だけ） */
  phases?: readonly EndPhase[];
  /** ホームの 目じるし（タップできる 物）の 一部として 出す */
  landmark?: boolean;
  /** 動きを へらす ときも 静かな 絵として 出す（false：落ちる 粒・一度だけの 演出は 出さない） */
  still: boolean;
}

/** 目じるしを さわった ときの 反応 */
export type TapReaction = 'petals' | 'ripples' | 'swing' | 'leaves' | 'light' | 'bloom' | 'bell';

/**
 * ホームで さわれる 目じるし。背景の 絵の まん中の 物（桜の木・水車・門・灯台…）の 上に、押せる 箱を 置く。
 * 箱の たては 地面から LANDMARK_HEIGHT 上 〜 地面（主人公・敵・HPバー・エリア名・ボスの行に 重ならない）
 */
export interface Landmark {
  id: string;
  /** ボタンの 名前（読み上げ） */
  name: string;
  reaction: TapReaction;
  /** さわった ときに 出る 粒の 数 */
  burst: number;
  /** さわった ときの 音（音が 切なら 鳴らない） */
  sound: Extract<SoundName, 'tap' | 'chime'>;
  /** 押せる 箱の 左と はば（ホームの 場面の px。主人公は x=67〜152、敵は x=258〜） */
  x: number;
  width: number;
  /** 反応を 出す 所（箱の 左上から px。上へは 箱の 外に 出てよい） */
  at: { x: number; y: number };
}

/** 目じるしの 箱の 高さ（地面から 上へ）。これより 上には 次の敵の HPバー（背の ひくい 敵では 地面から 64px）や ボスの行が 来る */
export const LANDMARK_HEIGHT = 60;

export interface StageDef {
  id: StageId;
  area: AreaNo;
  /** 場所の 名前（画面の エリア名と 同じ） */
  name: string;
  season: string;
  /** 空の色（歩行中の 空の グラデーション） */
  sky: { top: string; bottom: string };
  /** 時間帯の 色（本当の 時刻で うすく 重ねる。昼は 重ねない） */
  tints: Readonly<Record<TimeOfDay, Tint>>;
  /** 天気の 候補と 出やすさ */
  weathers: readonly { weather: Weather; weight: number }[];
  /** ギミック（3〜5つ） */
  gimmicks: readonly GimmickId[];
  landmark: Landmark;
  /** 季節の 色（docs/世界観.md 3章。1つ目が 糸の色） */
  colors: readonly string[];
  /** 背景の 絵が まだ無いとき、今の home-bg に うすく 重ねて 季節を 出す 色 */
  fallbackTint: Tint;
}

/** 1場面の 粒の 上限（タップで 出る 粒も 入れる） */
export const MAX_PARTICLES = 12;

const ALL: readonly StageLayout[] = ['home', 'walk', 'battle'];
const HOME: readonly StageLayout[] = ['home'];
const HOME_BATTLE: readonly StageLayout[] = ['home', 'battle'];
const NOT_NIGHT: readonly TimeOfDay[] = ['morning', 'day', 'evening'];

export const GIMMICKS: Readonly<Record<GimmickId, GimmickDef>> = {
  petals: { name: '桜の 花びらが 舞う', particles: 4, layouts: ALL, still: false },
  butterflies: { name: 'ちょうちょが 飛ぶ', particles: 2, layouts: ALL, times: ['morning', 'day'], weathers: ['sunny'], still: false },
  clouds: { name: '雲が 流れる', particles: 2, layouts: ALL, times: NOT_NIGHT, still: true },
  rain: { name: 'しとしと雨', particles: 6, layouts: ALL, weathers: ['rain'], still: false },
  ripples: { name: '水の輪', particles: 3, layouts: ALL, weathers: ['rain'], still: false },
  frog: { name: 'かえるが 跳ねる', particles: 1, layouts: HOME_BATTLE, times: NOT_NIGHT, weathers: ['sunny'], still: true },
  fireflies: { name: 'ほたる', particles: 4, layouts: ALL, times: ['evening', 'night'], weathers: ['sunny'], still: true },
  lanterns: { name: 'ちょうちんが ゆれて ともる', particles: 3, walkParticles: 7, layouts: ALL, still: true },
  windchime: { name: '風鈴が ゆれる', particles: 1, layouts: HOME, landmark: true, still: true },
  // 花火は 1つを 3コマ（小さく → ひらく → いっぱい）で 描き、1つずつ 出る。粒としては 1つ
  fireworks: { name: 'ときどき 花火', particles: 3, layouts: ALL, times: ['night'], still: false },
  waves: { name: '波が 寄せて 返す', particles: 2, layouts: HOME_BATTLE, still: true },
  gulls: { name: 'かもめが 飛ぶ', particles: 2, layouts: ALL, times: NOT_NIGHT, still: true },
  boat: { name: '小舟が 横切る', particles: 1, layouts: HOME_BATTLE, times: NOT_NIGHT, still: true },
  leaves: { name: 'いちょう・もみじが 落ちる', particles: 5, layouts: ALL, still: false },
  dragonflies: { name: 'とんぼが 飛ぶ', particles: 2, layouts: ALL, times: NOT_NIGHT, still: true },
  snow: { name: '雪が 降る', particles: 6, layouts: ALL, weathers: ['snow'], still: false },
  smoke: { name: '煙が のぼる', particles: 2, layouts: HOME, landmark: true, still: false },
  windowLight: { name: '窓に あかり', particles: 2, layouts: HOME, times: ['evening', 'night'], landmark: true, still: true },
  stars: { name: '夜は 星', particles: 4, layouts: ALL, times: ['night'], weathers: ['sunny'], still: true },
  starrySky: { name: '星空', particles: 6, layouts: ALL, phases: ['night'], still: true },
  seasonFlowers: { name: '四季の 花が 順に 咲く', particles: 4, layouts: HOME, landmark: true, still: true },
  skyCycle: { name: '空の 色が めぐる', particles: 0, layouts: ALL, still: false },
  bellRings: { name: '鐘の音の 輪', particles: 2, layouts: ALL, phases: ['night'], still: false },
  sunrise: { name: '初日の出', particles: 1, layouts: ALL, phases: ['dawn'], still: true },
};

/** 外の 景色の 時間帯の 色（朝は あたたかく、夕は だいだい、夜は あい色） */
const OUTDOOR_TINTS: Readonly<Record<TimeOfDay, Tint>> = {
  morning: { color: '#FFB38A', alpha: 0.1 },
  day: { color: '#FFFFFF', alpha: 0 },
  evening: { color: '#E8732C', alpha: 0.16 },
  night: { color: '#1B2240', alpha: 0.34 },
};

export const STAGES: readonly StageDef[] = [
  {
    id: 'area1',
    area: 1,
    name: AREAS[0].name,
    season: '春',
    sky: { top: '#8FD0F2', bottom: '#D6EEFA' },
    tints: OUTDOOR_TINTS,
    weathers: [
      { weather: 'sunny', weight: 7 },
      { weather: 'cloudy', weight: 3 },
    ],
    gimmicks: ['petals', 'butterflies', 'clouds', 'stars'],
    landmark: { id: 'sakura', name: '桜の木', reaction: 'petals', burst: 4, sound: 'tap', x: 154, width: 56, at: { x: 36, y: -5 } },
    colors: ['#F2A7B8', '#F9DDE3', '#6CC04A', '#8FD0F2'],
    fallbackTint: { color: '#F2A7B8', alpha: 0.1 },
  },
  {
    id: 'area2',
    area: 2,
    name: AREAS[1].name,
    season: '初夏',
    sky: { top: '#C3D0E0', bottom: '#E6ECF3' },
    tints: OUTDOOR_TINTS,
    weathers: [
      { weather: 'rain', weight: 1 },
      { weather: 'sunny', weight: 1 },
    ],
    gimmicks: ['rain', 'ripples', 'frog', 'fireflies'],
    landmark: { id: 'suisha', name: '水車', reaction: 'ripples', burst: 2, sound: 'tap', x: 154, width: 56, at: { x: 22, y: 48 } },
    colors: ['#3E9A63', '#A8D672', '#7A8FD0', '#C3D0E0'],
    fallbackTint: { color: '#3E9A63', alpha: 0.12 },
  },
  {
    id: 'area3',
    area: 3,
    name: AREAS[2].name,
    season: '夏の夕',
    sky: { top: '#2D3A6B', bottom: '#E8732C' },
    tints: {
      morning: { color: '#FFB38A', alpha: 0.06 },
      day: { color: '#FFFFFF', alpha: 0 },
      evening: { color: '#E8732C', alpha: 0.1 },
      night: { color: '#1B2240', alpha: 0.26 },
    },
    weathers: [{ weather: 'sunny', weight: 1 }],
    gimmicks: ['lanterns', 'windchime', 'fireworks'],
    landmark: { id: 'furin', name: '風鈴', reaction: 'swing', burst: 0, sound: 'chime', x: 154, width: 56, at: { x: 26, y: -18 } },
    colors: ['#C2410C', '#E8732C', '#FFC53D', '#2D3A6B'],
    fallbackTint: { color: '#C2410C', alpha: 0.2 },
  },
  {
    id: 'area4',
    area: 4,
    name: AREAS[3].name,
    season: '盛夏',
    sky: { top: '#5FB4EC', bottom: '#C6E9FB' },
    tints: OUTDOOR_TINTS,
    weathers: [
      { weather: 'sunny', weight: 7 },
      { weather: 'cloudy', weight: 3 },
    ],
    gimmicks: ['waves', 'gulls', 'boat', 'clouds', 'stars'],
    landmark: { id: 'toudai', name: '灯台', reaction: 'light', burst: 0, sound: 'tap', x: 154, width: 56, at: { x: 43, y: -77 } },
    colors: ['#8FD0F2', '#3D7FCC', '#FFD161', '#F4F7FB'],
    fallbackTint: { color: '#3D7FCC', alpha: 0.1 },
  },
  {
    id: 'area5',
    area: 5,
    name: AREAS[4].name,
    season: '秋',
    sky: { top: '#E8A04C', bottom: '#FFE2A8' },
    tints: OUTDOOR_TINTS,
    weathers: [
      { weather: 'sunny', weight: 7 },
      { weather: 'cloudy', weight: 3 },
    ],
    gimmicks: ['leaves', 'dragonflies', 'clouds', 'stars'],
    landmark: { id: 'kaki', name: '柿の木', reaction: 'leaves', burst: 3, sound: 'tap', x: 2, width: 60, at: { x: 31, y: -20 } },
    colors: ['#FFC53D', '#D9822B', '#9A5B00', '#A63D2F'],
    fallbackTint: { color: '#D9822B', alpha: 0.18 },
  },
  {
    id: 'area6',
    area: 6,
    name: AREAS[5].name,
    season: '冬',
    sky: { top: '#1B2240', bottom: '#3A4578' },
    tints: {
      morning: { color: '#FFD9B0', alpha: 0.08 },
      day: { color: '#FFFFFF', alpha: 0 },
      evening: { color: '#8B6BB8', alpha: 0.12 },
      night: { color: '#0F1530', alpha: 0.26 },
    },
    weathers: [
      { weather: 'snow', weight: 11 },
      { weather: 'sunny', weight: 9 },
    ],
    gimmicks: ['snow', 'smoke', 'windowLight', 'stars'],
    landmark: { id: 'ie', name: '縁側の家', reaction: 'light', burst: 2, sound: 'chime', x: 154, width: 56, at: { x: 33, y: -48 } },
    colors: ['#1B2240', '#DDE4F7', '#FFFFFF', '#E8732C'],
    fallbackTint: { color: '#1B2240', alpha: 0.3 },
  },
  {
    id: 'area7',
    area: 7,
    name: AREAS[6].name,
    season: '四季の終章',
    sky: { top: '#C9B6E4', bottom: '#FBF6EA' },
    tints: OUTDOOR_TINTS,
    weathers: [{ weather: 'sunny', weight: 1 }],
    gimmicks: ['seasonFlowers', 'skyCycle', 'butterflies', 'stars'],
    landmark: { id: 'hana', name: '四季の花', reaction: 'bloom', burst: 0, sound: 'tap', x: 154, width: 56, at: { x: 0, y: 60 } },
    colors: ['#8B6BB8', '#FBF6EA', '#FFC53D', '#1F6E43'],
    fallbackTint: { color: '#8B6BB8', alpha: 0.12 },
  },
  {
    id: 'end',
    area: 'end',
    name: '年こしの峠',
    season: '年こし',
    sky: { top: '#0F1530', bottom: '#2D3A6B' },
    tints: {
      morning: { color: '#1B2240', alpha: 0.12 },
      day: { color: '#1B2240', alpha: 0.1 },
      evening: { color: '#1B2240', alpha: 0.16 },
      night: { color: '#0F1530', alpha: 0.24 },
    },
    weathers: [{ weather: 'sunny', weight: 1 }],
    gimmicks: ['starrySky', 'bellRings', 'sunrise'],
    landmark: { id: 'kane', name: '鐘', reaction: 'bell', burst: 2, sound: 'chime', x: 154, width: 56, at: { x: 38, y: -4 } },
    colors: ['#1B2240', '#C2410C', '#FFC53D', '#F4F7FB'],
    fallbackTint: { color: '#0F1530', alpha: 0.42 },
  },
];

const STAGE_BY_ID = new Map<StageId, StageDef>(STAGES.map((st) => [st.id, st]));

export function stageDef(id: StageId): StageDef {
  return STAGE_BY_ID.get(id)!;
}

/** はつひのでを たおした あと（夜明け）の 年こしの峠：空と、絵が 無いときに 重ねる 色 */
const END_DAWN = {
  sky: { top: '#2D3A6B', bottom: '#F2A7B8' },
  fallbackTint: { color: '#F2A7B8', alpha: 0.12 },
} as const;

/** その ステージの 空の色（年こしの峠は 夜明けで かわる） */
export function stageSky(stage: StageDef, phase: EndPhase | null): { top: string; bottom: string } {
  return stage.id === 'end' && phase === 'dawn' ? END_DAWN.sky : stage.sky;
}

/** 背景の 絵が 無いときに 重ねる 色（年こしの峠は 夜明けで かわる） */
export function fallbackTintOf(stage: StageDef, phase: EndPhase | null): Tint {
  return stage.id === 'end' && phase === 'dawn' ? END_DAWN.fallbackTint : stage.fallbackTint;
}

/** 巡りの中で pos 歩 進んだ 所の ステージと、年こしの峠の ようす（7つの道では null） */
export function stagePlaceAt(pos: number): { stage: StageDef; phase: EndPhase | null } {
  const seg = segmentAt(pos);
  if (typeof seg.area === 'number') return { stage: stageDef(`area${seg.area}` as StageId), phase: null };
  return { stage: stageDef('end'), phase: seg.kind === 'after' ? 'dawn' : 'night' };
}

// ---------- 時間帯 ----------

/** 本当の 時刻の 時間帯：朝 5〜10時・昼 10〜16時・夕 16〜19時・夜 19〜5時 */
export function timeOfDay(date: Date): TimeOfDay {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h < 5) return 'night';
  if (h < 10) return 'morning';
  if (h < 16) return 'day';
  if (h < 19) return 'evening';
  return 'night';
}

/** 色を まぜる 区切り（時）。区切りの 前後で 1〜1.5時間かけて 少しずつ まぜる（急に かわらない） */
const TINT_KEYS: readonly [number, TimeOfDay][] = [
  [0, 'night'],
  [4.5, 'night'],
  [6, 'morning'],
  [9, 'morning'],
  [10.5, 'day'],
  [15.5, 'day'],
  [17, 'evening'],
  [18.5, 'evening'],
  [19.5, 'night'],
  [24, 'night'],
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb: readonly number[]): string {
  return `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** 2つの 重ねる色を まぜる（こさも いっしょに まぜるので、うすい 色の 方へ 急に とばない） */
export function mixTint(a: Tint, b: Tint, t: number): Tint {
  const alpha = a.alpha * (1 - t) + b.alpha * t;
  if (alpha < 1e-6) return { color: b.alpha > 0 ? b.color : a.color, alpha: 0 };
  const ca = hexToRgb(a.color);
  const cb = hexToRgb(b.color);
  const rgb = ca.map((c, i) => (c * a.alpha * (1 - t) + cb[i] * b.alpha * t) / alpha);
  return { color: rgbToHex(rgb), alpha: Math.round(alpha * 10000) / 10000 };
}

/** その時刻に 重ねる 時間帯の 色 */
export function timeTint(stage: StageDef, date: Date): Tint {
  const h = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  for (let i = 1; i < TINT_KEYS.length; i += 1) {
    const [h1, k1] = TINT_KEYS[i];
    if (h <= h1) {
      const [h0, k0] = TINT_KEYS[i - 1];
      const t = h1 > h0 ? (h - h0) / (h1 - h0) : 1;
      return mixTint(stage.tints[k0], stage.tints[k1], t);
    }
  }
  return stage.tints.night;
}

// ---------- 天気 ----------

/** その日の 天気。利用者の種と 日付（YYYY-MM-DD）から 決めるので、同じ日は 同じ天気 */
export function weatherFor(stage: StageDef, seed: number, day: string): Weather {
  const total = stage.weathers.reduce((sum, w) => sum + w.weight, 0);
  const r = randAt(subSeed(seed, 'weather', stage.id, day), 0) * total;
  let acc = 0;
  for (const w of stage.weathers) {
    acc += w.weight;
    if (r < acc) return w.weather;
  }
  return stage.weathers[stage.weathers.length - 1].weather;
}

/** 天気の 色（雨・くもり・雪の日は 少し 灰色に） */
export function weatherTint(weather: Weather): Tint | null {
  if (weather === 'rain') return { color: '#6B7A90', alpha: 0.12 };
  if (weather === 'cloudy') return { color: '#8A94A6', alpha: 0.06 };
  if (weather === 'snow') return { color: '#DDE4F7', alpha: 0.08 };
  return null;
}

// ---------- ギミック ----------

export interface SceneConditions {
  layout: StageLayout;
  time: TimeOfDay;
  weather: Weather;
  phase: EndPhase | null;
}

/** いまの 場面・時間帯・天気で 出す ギミック */
export function activeGimmicks(stage: StageDef, c: SceneConditions): GimmickId[] {
  return stage.gimmicks.filter((id) => {
    const g = GIMMICKS[id];
    if (!g.layouts.includes(c.layout)) return false;
    if (g.times && !g.times.includes(c.time)) return false;
    if (g.weathers && !g.weathers.includes(c.weather)) return false;
    if (g.phases && (c.phase === null || !g.phases.includes(c.phase))) return false;
    return true;
  });
}

/** その 場面で 1つの ギミックが 描く 粒の 数（絵を 描く 所も この 数だけ 描く） */
export function drawCount(id: GimmickId, layout: StageLayout): number {
  const g = GIMMICKS[id];
  return layout === 'walk' && g.walkParticles !== undefined ? g.walkParticles : g.particles;
}

/** 1場面の 粒の 数（ホームでは 目じるしを さわった ときの 粒も 入れる） */
export function particleCount(stage: StageDef, c: SceneConditions): number {
  const sum = activeGimmicks(stage, c).reduce((n, id) => n + drawCount(id, c.layout), 0);
  return sum + (c.layout === 'home' ? stage.landmark.burst : 0);
}

// ---------- 7色の糸 ----------

export type ThreadState = 'restored' | 'current' | 'faded';

/**
 * エリア名の 札に 出す 7色の 糸。いまの 道は current、色の もどった 道は restored、まだの 道は faded。
 * 年こしの峠より 先と、2巡り目から（七色は もう もどっている）は いまの 道の ほかは restored
 */
export function threadDots(pos: number, lap: number): { area: number; color: string; state: ThreadState }[] {
  const seg = segmentAt(pos);
  const current = typeof seg.area === 'number' ? seg.area : null;
  return AREAS.map((a) => {
    const state: ThreadState = a.no === current ? 'current' : lap > 1 || current === null || a.no < current ? 'restored' : 'faded';
    return { area: a.no, color: a.color, state };
  });
}
