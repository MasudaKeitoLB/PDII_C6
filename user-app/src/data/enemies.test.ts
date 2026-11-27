// 敵とエリアの表が docs/世界観.md と ずれていないかの テスト（npm test）。
// ずれたら 世界観.md を正として `node scripts/gen-enemies.mjs` で 作りなおす。

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { AREAS } from './areas.ts';
import { ENEMIES, type EnemyDef } from './enemies.ts';

const doc = readFileSync(new URL('../../../docs/世界観.md', import.meta.url), 'utf8').split(/\r?\n/);
const all: readonly EnemyDef[] = ENEMIES;

/** 「## n.」の章の 行 */
function chapter(no: number): string[] {
  const from = doc.findIndex((l) => l.startsWith(`## ${no}.`));
  assert.ok(from >= 0, `${no}章が ない`);
  const rest = doc.slice(from + 1);
  const to = rest.findIndex((l) => l.startsWith('## '));
  return to < 0 ? rest : rest.slice(0, to);
}

const cells = (line: string) => line.split('|').slice(1, -1).map((c) => c.trim());
const KIND_LABEL = { normal: 'ふつう', rare: 'レア', boss: 'ボス', ura: '裏ボス' } as const;

test('敵の表：世界観.md 5章の表と 1行ずつ 同じ', () => {
  const rows = chapter(5)
    .map(cells)
    .filter((c) => c.length === 7 && /^\d+$/.test(c[0]));
  assert.equal(rows.length, 100, '世界観.md の敵の行の数');
  assert.equal(all.length, 100, 'ENEMIES の数');
  rows.forEach((row, i) => {
    const e = all[i];
    const [no, id, name, area, kind, , note] = row;
    assert.equal(String(e.no), no, `${i + 1}行目の No.`);
    assert.equal(e.id, id, `No.${no} の id`);
    assert.equal(e.name, name, `No.${no} の名前`);
    assert.equal(e.area === 'end' ? 'エンド' : String(e.area), area, `No.${no} のエリア`);
    assert.equal(KIND_LABEL[e.kind], kind, `No.${no} の種類`);
    assert.equal(e.note, note, `No.${no} の図鑑の一言`);
  });
});

test('敵の表：100体（ふつう84・レア7・ボス7・裏ボス2）。No. は 1から順、id と名前の重複なし', () => {
  const count = (kind: EnemyDef['kind']) => all.filter((e) => e.kind === kind).length;
  assert.equal(all.length, 100);
  assert.equal(count('normal'), 84);
  assert.equal(count('rare'), 7);
  assert.equal(count('boss'), 7);
  assert.equal(count('ura'), 2);
  all.forEach((e, i) => assert.equal(e.no, i + 1));
  assert.equal(new Set(all.map((e) => e.id)).size, 100, 'id の重複');
  assert.equal(new Set(all.map((e) => e.name)).size, 100, '名前の重複');
  for (const e of all) {
    assert.match(e.id, /^[a-z]+$/, `${e.id} は 英小文字だけ`);
    assert.match(e.name, /^[ぁ-ん]{3,6}$/, `${e.name} は ひらがな 3〜6字`);
    assert.ok(e.note.length > 0, `${e.id} の図鑑の一言`);
  }
});

test('敵の表：各エリアは ふつう12 → レア1 → ボス1 の順。さいごに 裏ボス2', () => {
  for (let area = 1; area <= 7; area += 1) {
    const kinds = all.filter((e) => e.area === area).map((e) => e.kind);
    assert.deepEqual(kinds, [...Array<string>(12).fill('normal'), 'rare', 'boss'], `エリア${area}`);
    // エリアごとに No. が つづいている
    const first = (area - 1) * 14 + 1;
    assert.deepEqual(
      all.filter((e) => e.area === area).map((e) => e.no),
      Array.from({ length: 14 }, (_, i) => first + i),
    );
  }
  assert.deepEqual(
    all.filter((e) => e.area === 'end').map((e) => [e.id, e.kind]),
    [
      ['oomisoka', 'ura'],
      ['hatsuhinode', 'ura'],
    ],
  );
  // 今ある3体は 変えない
  assert.deepEqual(
    all.slice(0, 3).map((e) => e.id),
    ['amagumo', 'ishikoron', 'happappa'],
  );
});

test('エリアの表：世界観.md 3章と 同じ（名前・糸の色・ボス）。敵の表とも 合う', () => {
  const rows = chapter(3)
    .map(cells)
    .filter((c) => c.length === 8 && /^[1-7]$/.test(c[0]));
  assert.equal(rows.length, 7);
  assert.equal(AREAS.length, 7);
  rows.forEach((row, i) => {
    const a = AREAS[i];
    assert.equal(String(a.no), row[0]);
    assert.equal(a.name, row[1], `エリア${a.no} の名前`);
    assert.equal(a.color, row[4].match(/#[0-9A-Fa-f]{6}/)?.[0].toUpperCase(), `エリア${a.no} の色`);
    assert.equal(all.find((e) => e.id === a.boss)?.name, row[6], `エリア${a.no} のボス`);
    const inArea = all.filter((e) => e.area === a.no);
    assert.deepEqual(a.normals, inArea.filter((e) => e.kind === 'normal').map((e) => e.id));
    assert.equal(a.normals.length, 12);
    assert.equal(a.rare, inArea.find((e) => e.kind === 'rare')?.id);
    assert.equal(a.boss, inArea.find((e) => e.kind === 'boss')?.id);
  });
});
