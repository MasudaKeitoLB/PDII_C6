// docs/世界観.md の表から、敵とエリアの表（src/data/enemies.ts・src/data/areas.ts）を作る。
// 使い方（user-app/ で）：node scripts/gen-enemies.mjs
// 名前や 図鑑の一言を 直すときは 世界観.md を直してから、これを動かす。ずれは enemies.test.ts が見つける。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const local = (path) => fileURLToPath(new URL(path, import.meta.url));
const doc = readFileSync(local('../../docs/世界観.md'), 'utf8');

const KINDS = { ふつう: 'normal', レア: 'rare', ボス: 'boss', 裏ボス: 'ura' };

/** 「## 5.」のような 見出しから 次の「## 」までを 取り出す */
function chapter(no) {
  const lines = doc.split(/\r?\n/);
  const from = lines.findIndex((l) => l.startsWith(`## ${no}.`));
  if (from < 0) throw new Error(`${no}章が 見つかりません`);
  const rest = lines.slice(from + 1);
  const to = rest.findIndex((l) => l.startsWith('## '));
  return to < 0 ? rest : rest.slice(0, to);
}

/** 表の1行を ますごとに 分ける */
const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());

// ---- 5章：敵100体 ----
const enemies = [];
for (const line of chapter(5)) {
  const c = cells(line);
  if (c.length !== 7 || !/^\d+$/.test(c[0])) continue;
  const [no, id, name, area, kind, , note] = c;
  if (!(kind in KINDS)) throw new Error(`No.${no} の種類「${kind}」が 分かりません`);
  if (area !== 'エンド' && !/^[1-7]$/.test(area)) throw new Error(`No.${no} のエリア「${area}」が 分かりません`);
  enemies.push({ no: Number(no), id, name, area: area === 'エンド' ? 'end' : Number(area), kind: KINDS[kind], note });
}
if (enemies.length !== 100) throw new Error(`敵が ${enemies.length}体（100体の はず）`);

// ---- 3章：7エリア ----
const areas = [];
for (const line of chapter(3)) {
  const c = cells(line);
  if (c.length !== 8 || !/^[1-7]$/.test(c[0])) continue;
  const no = Number(c[0]);
  // 色は 1つ目（糸の色）を使う
  const color = c[4].match(/#[0-9A-Fa-f]{6}/)?.[0];
  if (!color) throw new Error(`エリア${no} の色が 見つかりません`);
  const inArea = enemies.filter((e) => e.area === no);
  const normals = inArea.filter((e) => e.kind === 'normal').map((e) => e.id);
  const rare = inArea.filter((e) => e.kind === 'rare').map((e) => e.id);
  const boss = inArea.filter((e) => e.kind === 'boss');
  if (normals.length !== 12 || rare.length !== 1 || boss.length !== 1) throw new Error(`エリア${no} の敵の数が 合いません`);
  if (boss[0].name !== c[6]) throw new Error(`エリア${no} のボスの名前が 3章（${c[6]}）と 5章（${boss[0].name}）で ちがいます`);
  areas.push({ no, name: c[1], color: color.toUpperCase(), normals, rare: rare[0], boss: boss[0].id });
}
if (areas.length !== 7) throw new Error(`エリアが ${areas.length}こ（7つの はず）`);

// ---- 書き出す ----
const q = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const HEAD = '// このファイルは scripts/gen-enemies.mjs が docs/世界観.md から作る。手で直さない。\n';

const enemyLines = enemies.map(
  (e) =>
    `  { no: ${e.no}, id: ${q(e.id)}, name: ${q(e.name)}, area: ${e.area === 'end' ? q('end') : e.area}, kind: ${q(e.kind)}, note: ${q(e.note)} },`,
);
const enemiesTs = `${HEAD}// 敵100体の表（世界観.md 5章）。ふつう84・レア7・ボス7・裏ボス2。エリアの中は ふつう12 → レア1 → ボス1 の順。

/** normal：ふつう／rare：レア／boss：ボス／ura：裏ボス */
export type EnemyKind = 'normal' | 'rare' | 'boss' | 'ura';

export interface EnemyDef {
  no: number;
  id: string;
  name: string;
  /** エリアの番号。裏ボスは 'end'（年こしの峠） */
  area: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'end';
  kind: EnemyKind;
  /** 図鑑の一言 */
  note: string;
}

export const ENEMIES = [
${enemyLines.join('\n')}
] as const satisfies readonly EnemyDef[];

export type EnemyId = (typeof ENEMIES)[number]['id'];
`;

const areaLines = areas.map(
  (a) =>
    `  {\n    no: ${a.no},\n    name: ${q(a.name)},\n    color: ${q(a.color)},\n    normals: [${a.normals.map(q).join(', ')}],\n    rare: ${q(a.rare)},\n    boss: ${q(a.boss)},\n  },`,
);
const areasTs = `${HEAD}// 7エリアの表（世界観.md 3章）。色は 糸の色（1つ目の色）。

import type { EnemyId } from './enemies.ts';

export interface AreaDef {
  no: number;
  name: string;
  /** 糸の色 */
  color: string;
  /** ふつうの敵 12体 */
  normals: EnemyId[];
  rare: EnemyId;
  boss: EnemyId;
}

export const AREAS: readonly AreaDef[] = [
${areaLines.join('\n')}
];
`;

mkdirSync(local('../src/data'), { recursive: true });
writeFileSync(local('../src/data/enemies.ts'), enemiesTs);
writeFileSync(local('../src/data/areas.ts'), areasTs);
console.log(`敵 ${enemies.length}体・エリア ${areas.length}つを 書き出しました`);
