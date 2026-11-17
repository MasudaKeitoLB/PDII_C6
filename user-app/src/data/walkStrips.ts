// 歩行中の 道の帯の表。src/assets/scene/walk-strip-area1〜7.svg（160×60、横に くり返せる）を まとめて読みこむ（import.meta.glob は Vite の機能）。
// 単体テスト（node --test）では 読めないので、game.ts や ほかの data/*.ts からは 読みこまない。
// 帯が まだ無い エリアは null。そのときは エリアの色で CSS の 道を描く（ファイルを 読みに行かない）。
// 空の色は docs/世界観.md 7章「エリアごとの 色の 使い方」の 背景の 空から。

import { AREAS } from './areas';

const FILES = import.meta.glob<string>('../assets/scene/walk-strip-area*.svg', { eager: true, import: 'default' });

const STRIPS: Partial<Record<number, string>> = {};
for (const [path, src] of Object.entries(FILES)) {
  const no = Number(/walk-strip-area(\d+)\.svg$/.exec(path)?.[1]);
  if (Number.isInteger(no)) STRIPS[no] = src;
}

/** 帯の 大きさ（px）。この はばで くり返す */
export const STRIP_WIDTH = 160;
export const STRIP_HEIGHT = 60;

export interface WalkSceneLook {
  /** 道の帯（無いときは null） */
  strip: string | null;
  /** 空の色（上・下） */
  skyTop: string;
  skyBottom: string;
  /** CSS で描く 道の 草の色（帯が 無いとき） */
  grass: string;
  /** 遠くの景色の 明るさ（夕方・夜の エリアは 少し 暗く） */
  farBrightness: number;
}

/** エリアごとの 空（1 春：空色／2 初夏：うすい雨雲／3 夏：夕やみ／4 盛夏：こい空色／5 秋：夕やけ／6 冬：あい色の夜／7 終章：ふじ色の かすみ） */
const SKIES: Record<number, Omit<WalkSceneLook, 'strip'>> = {
  1: { skyTop: '#8FD0F2', skyBottom: '#D6EEFA', grass: '#6CC04A', farBrightness: 1 },
  2: { skyTop: '#C3D0E0', skyBottom: '#E6ECF3', grass: '#3E9A63', farBrightness: 0.95 },
  3: { skyTop: '#2D3A6B', skyBottom: '#E8732C', grass: '#4F7F3A', farBrightness: 0.7 },
  4: { skyTop: '#5FB4EC', skyBottom: '#C6E9FB', grass: '#7DBF52', farBrightness: 1 },
  5: { skyTop: '#E8A04C', skyBottom: '#FFE2A8', grass: '#C9A23A', farBrightness: 0.9 },
  6: { skyTop: '#1B2240', skyBottom: '#3A4578', grass: '#DDE4F7', farBrightness: 0.6 },
  7: { skyTop: '#C9B6E4', skyBottom: '#FBF6EA', grass: '#1F6E43', farBrightness: 0.95 },
};

/** いまいる エリア（1〜7。クリアのあとの 年こしの峠・ふりかえりの道は 7 の 見た目）の 道の場面 */
export function walkSceneLook(area: number | 'end'): WalkSceneLook {
  const no = typeof area === 'number' ? Math.min(AREAS.length, Math.max(1, area)) : AREAS.length;
  return { strip: STRIPS[no] ?? null, ...SKIES[no] };
}
