// 決まった乱数の テスト（npm test）

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fnv1a, mulberry32, randAt, subSeed } from './random.ts';

test('fnv1a：同じ文字なら 同じ数、ちがう文字なら ちがう数（32ビットの 正の整数）', () => {
  assert.equal(fnv1a(''), 0x811c9dc5);
  assert.equal(fnv1a('a'), 0xe40c292c);
  assert.equal(fnv1a('s-yamada'), fnv1a('s-yamada'));
  assert.notEqual(fnv1a('s-yamada'), fnv1a('s-tanaka'));
  for (const text of ['', 'a', 's-yamada', 'u_abc123', 'やまだ']) {
    const h = fnv1a(text);
    assert.ok(Number.isInteger(h) && h >= 0 && h <= 0xffffffff, `${text} → ${h}`);
  }
});

test('mulberry32：同じ種なら 同じ列。数は 0以上1未満', () => {
  const a = mulberry32(12345);
  const b = mulberry32(12345);
  for (let i = 0; i < 1000; i += 1) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1, `${i}番目が ${x}`);
  }
  const c = mulberry32(12346);
  const d = mulberry32(12345);
  assert.notEqual(c(), d());
});

test('mulberry32：数が かたよらない（平均が 0.5 に近い）', () => {
  const rand = mulberry32(2026);
  let sum = 0;
  const n = 20000;
  for (let i = 0; i < n; i += 1) sum += rand();
  assert.ok(Math.abs(sum / n - 0.5) < 0.01, `平均 ${sum / n}`);
});

test('randAt：mulberry32 の n番目と 同じ数。同じ入力で 同じ値、0以上1未満', () => {
  for (const seed of [0, 1, 7, 0xffffffff, fnv1a('s-yamada')]) {
    const rand = mulberry32(seed);
    for (let n = 0; n < 200; n += 1) {
      const x = randAt(seed, n);
      assert.equal(x, rand(), `種 ${seed} の ${n}番目`);
      assert.equal(x, randAt(seed, n));
      assert.ok(x >= 0 && x < 1);
    }
  }
});

test('subSeed：同じ入力で 同じ種。しるしが ちがえば ちがう種', () => {
  assert.equal(subSeed(1, 1, 3, 'rare'), subSeed(1, 1, 3, 'rare'));
  const seen = new Set<number>();
  for (let lap = 1; lap <= 3; lap += 1) {
    for (let area = 1; area <= 7; area += 1) {
      for (const use of ['rare', 'bag']) {
        const s = subSeed(99, lap, area, use);
        assert.ok(Number.isInteger(s) && s >= 0 && s <= 0xffffffff);
        seen.add(s);
      }
    }
  }
  assert.equal(seen.size, 3 * 7 * 2);
  assert.notEqual(subSeed(1, 'bag'), subSeed(2, 'bag'));
});
