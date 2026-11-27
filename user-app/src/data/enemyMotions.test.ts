// 敵100体の 動きの型の テスト（npm test）

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ENEMIES } from './enemies.ts';
import { ENEMY_MOTIONS, ENEMY_MOTION_TYPES, MOTION_LABELS, enemyMotion } from './enemyMotions.ts';

test('動きの型：100体 すべてに 型が あり、表に 知らない敵が ない', () => {
  assert.equal(ENEMIES.length, 100);
  for (const e of ENEMIES) {
    const motion = (ENEMY_MOTIONS as Record<string, string>)[e.id];
    assert.ok(motion, `${e.name}（${e.id}）に 型が ない`);
    assert.ok((ENEMY_MOTION_TYPES as readonly string[]).includes(motion), `${e.name} の 型 ${motion} が 知らない型`);
    assert.equal(enemyMotion(e.id), motion);
  }
  const ids = new Set<string>(ENEMIES.map((e) => e.id));
  for (const id of Object.keys(ENEMY_MOTIONS)) assert.ok(ids.has(id), `表に 知らない敵 ${id}`);
  assert.equal(Object.keys(ENEMY_MOTIONS).length, 100);
});

test('動きの型：6種類 すべてが 使われ、どの型にも 名前が ある', () => {
  assert.equal(ENEMY_MOTION_TYPES.length, 6);
  const used = new Map<string, number>();
  for (const motion of Object.values(ENEMY_MOTIONS)) used.set(motion, (used.get(motion) ?? 0) + 1);
  for (const type of ENEMY_MOTION_TYPES) {
    assert.ok((used.get(type) ?? 0) >= 5, `${type} が 5体より 少ない（${used.get(type) ?? 0}体）`);
    assert.ok(MOTION_LABELS[type].length > 0);
  }
});

test('動きの型：点滅の型は ない', () => {
  // 点滅（blink など）の型を 作らない
  assert.ok(!(ENEMY_MOTION_TYPES as readonly string[]).some((t) => /blink|flash|shake/.test(t)));
});

test('動きの型：ボスと裏ボスは hop も spin も使わない（ゆらゆら か ほのかに光る だけ）', () => {
  const bosses = ENEMIES.filter((x) => x.kind === 'boss' || x.kind === 'ura');
  assert.equal(bosses.length, 9);
  for (const e of bosses) {
    const motion = enemyMotion(e.id);
    assert.notEqual(motion, 'hop', `${e.name}（ボス）が 跳ねる型`);
    assert.notEqual(motion, 'spin', `${e.name}（ボス）が 回る型`);
    assert.ok(motion === 'sway' || motion === 'glow', `${e.name}（ボス）の 型が ${motion}`);
  }
});
