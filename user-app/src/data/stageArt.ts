// ステージの 絵の 表。デザイン担当が 作る 絵を まとめて 読みこむ（import.meta.glob は Vite の機能）。
// - src/assets/scene/stage/area1〜7-bg.svg・end-bg.svg：エリアの 背景（395×420。home-bg と 同じ 地面の 高さ・立ち位置）
// - src/assets/scene/stage/area1〜7-far.svg・end-far.svg：歩行中に 流す 遠景（400×140。横に くり返せる。下は すきとおり）
// - src/assets/scene/fx/<名前>.svg：ギミックの 小さな 絵
// 単体テスト（node --test）では 読めないので、stages.ts や ほかの data/*.ts からは 読みこまない。
// 絵が まだ無いときは null。そのときは 今の home-bg・result-bg と、stagePixels.ts の 代わりの ドット絵を 使う（ファイルを 読みに行かない）。

import type { StageId } from './stages';

const BG = import.meta.glob<string>('../assets/scene/stage/*-bg.svg', { eager: true, import: 'default' });
const FAR = import.meta.glob<string>('../assets/scene/stage/*-far.svg', { eager: true, import: 'default' });
const FX = import.meta.glob<string>('../assets/scene/fx/*.svg', { eager: true, import: 'default' });

/** ファイルの 名前（.svg を のぞく）→ 絵 */
function byName(files: Record<string, string>, suffix = ''): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  for (const [path, src] of Object.entries(files)) {
    const name = path.slice(path.lastIndexOf('/') + 1).replace(/\.svg$/, '');
    out[suffix ? name.replace(new RegExp(`${suffix}$`), '') : name] = src;
  }
  return out;
}

const BG_BY_STAGE = byName(BG, '-bg');
const FAR_BY_STAGE = byName(FAR, '-far');
const FX_BY_NAME = byName(FX);

/** ギミックの 小さな 絵の 名前 */
export type FxName =
  | 'petal'
  | 'butterfly-1'
  | 'butterfly-2'
  | 'cloud'
  | 'raindrop'
  | 'ripple'
  | 'frog'
  | 'firefly'
  | 'lantern'
  | 'windchime'
  | 'firework-1'
  | 'firework-2'
  | 'firework-3'
  | 'wave'
  | 'gull-1'
  | 'gull-2'
  | 'boat'
  | 'ginkgo'
  | 'maple'
  | 'dragonfly-1'
  | 'dragonfly-2'
  | 'snowflake'
  | 'smoke'
  | 'star'
  | 'sunrise'
  | 'bell-ring'
  | 'flower-spring'
  | 'flower-summer'
  | 'flower-autumn'
  | 'flower-winter';

/** エリアの 背景（無いときは null） */
export function stageBgArt(id: StageId): string | null {
  return BG_BY_STAGE[id] ?? null;
}

/** 歩行中の 遠景（無いときは null） */
export function stageFarArt(id: StageId): string | null {
  return FAR_BY_STAGE[id] ?? null;
}

/** ギミックの 小さな 絵（無いときは null） */
export function fxArt(name: FxName): string | null {
  return FX_BY_NAME[name] ?? null;
}

/** 遠景の 大きさ（px）。この はばで くり返す */
export const FAR_WIDTH = 400;
export const FAR_HEIGHT = 140;
