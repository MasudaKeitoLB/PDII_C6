// 敵の絵の表。src/assets/sprite/enemy-<id>.svg を まとめて読みこむ（import.meta.glob は Vite の機能）。
// 単体テスト（node --test）では 読めないので、game.ts や ほかの data/*.ts からは 読みこまない。
// 絵が まだ無い敵は src が null になる。そのときは EnemySprite が その場で 絵を描く（ファイルを 読みに行かない）。

import { AREAS } from './areas';
import { ENEMIES, type EnemyDef, type EnemyId } from './enemies';

const FILES = import.meta.glob<string>('../assets/sprite/enemy-*.svg', { eager: true, import: 'default' });

/** ふつうの大きさの絵（id → 絵）と、成果の画面に ならべる 小さい絵（「-small」の付くファイル） */
const FULL: Partial<Record<string, string>> = {};
const SMALL: Partial<Record<string, string>> = {};
for (const [path, src] of Object.entries(FILES)) {
  const name = path.slice(path.lastIndexOf('/') + 1).replace(/^enemy-/, '').replace(/\.svg$/, '');
  if (name.endsWith('-small')) SMALL[name.slice(0, -'-small'.length)] = src;
  else FULL[name] = src;
}

const DEFS = new Map<string, EnemyDef>(ENEMIES.map((e) => [e.id, e]));

export interface EnemySpriteInfo {
  /** 絵。まだ無いときは null */
  src: string | null;
  /** 画面に出す大きさ（px） */
  width: number;
  height: number;
  /** 絵が無いときに 体に使う色（エリアの糸の色） */
  color: string;
}

/** 新しい絵の大きさ：ふつう・レアは 80×80、ボス・裏ボスは 160×160（1マス 5px） */
const NORMAL_SIZE = 80;
const BOSS_SIZE = 160;
/** 成果の画面に ならべるときの高さ（今ある小さい絵と そろえる） */
const SMALL_HEIGHT = 42;
const SMALL_BOSS_HEIGHT = 56;
/** 年こしの峠（裏ボス）の色 */
const END_COLOR = '#FFC53D';

/** 今ある3体（Figma の絵）は 大きさが ちがう。いしころんは 小さい絵しかないので 1.6倍にして使う */
const OLD_FULL: Partial<Record<EnemyId, { from: 'full' | 'small'; width: number; height: number }>> = {
  amagumo: { from: 'full', width: 80, height: 70 },
  happappa: { from: 'full', width: 60, height: 70 },
  ishikoron: { from: 'small', width: 42 * 1.6, height: 36 * 1.6 },
};
const OLD_SMALL: Partial<Record<EnemyId, { width: number; height: number }>> = {
  amagumo: { width: 48, height: 42 },
  happappa: { width: 36, height: 42 },
  ishikoron: { width: 42, height: 36 },
};

function colorOf(id: EnemyId): string {
  const area = DEFS.get(id)?.area;
  return typeof area === 'number' ? AREAS[area - 1].color : END_COLOR;
}

function isBig(id: EnemyId): boolean {
  const kind = DEFS.get(id)?.kind;
  return kind === 'boss' || kind === 'ura';
}

/** ふつうの大きさの絵（ホームの場面用） */
export function enemySprite(id: EnemyId): EnemySpriteInfo {
  const color = colorOf(id);
  const old = OLD_FULL[id];
  if (old) return { src: (old.from === 'small' ? SMALL[id] : FULL[id]) ?? null, width: old.width, height: old.height, color };
  const size = isBig(id) ? BOSS_SIZE : NORMAL_SIZE;
  return { src: FULL[id] ?? null, width: size, height: size, color };
}

/** 小さい絵（成果の画面に ならべる用）。小さい絵が無い敵は ふつうの絵を 小さくして使う */
export function enemySpriteSmall(id: EnemyId): EnemySpriteInfo {
  const color = colorOf(id);
  const old = OLD_SMALL[id];
  if (old && SMALL[id]) return { src: SMALL[id] ?? null, width: old.width, height: old.height, color };
  const size = isBig(id) ? SMALL_BOSS_HEIGHT : SMALL_HEIGHT;
  return { src: FULL[id] ?? null, width: size, height: size, color };
}
