// バランスの計算（scripts/balance.ts）の テスト（npm test）。種によらず 決まっている数だけを確かめる。

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DAYS, REPORT_EVERY, STEPS_PER_DAY, report, simulate, summarize } from '../../scripts/balance.ts';

test('バランス：26日で 130,000歩・レベル31・エリア1をこえる', () => {
  for (const seed of [0, 1, 2026]) {
    const first = simulate(seed)[0];
    assert.equal(first.day, 26);
    assert.equal(first.totalSteps, 130_000);
    assert.equal(first.level, 31);
    assert.equal(first.cleared, 1);
    assert.equal(first.place, 'わかばの田んぼ道');
    assert.equal(first.encounters, 160);
  }
});

test('バランス：182日で 910,000歩・レベル90・エリア7をこえる。出会いは 1,120回', () => {
  assert.equal(STEPS_PER_DAY * DAYS, 910_000);
  for (const seed of [0, 1, 2026]) {
    const rows = simulate(seed);
    assert.equal(rows.length, DAYS / REPORT_EVERY);
    assert.deepEqual(rows.map((r) => r.cleared), [1, 2, 3, 4, 5, 6, 7]);
    const last = rows[rows.length - 1];
    assert.equal(last.day, 182);
    assert.equal(last.totalSteps, 910_000);
    assert.equal(last.level, 90);
    assert.equal(last.place, '年こしの峠');
    assert.equal(last.encounters, 1120);
    // ポイント：ふつう10・レア50・ボス100×7
    assert.equal(last.points, (1120 - last.rares) * 10 + last.rares * 50 + 700);
    assert.ok(last.distinctRares <= Math.min(7, last.rares));
  }
});

test('バランス：表を作れる（種を変えた平均）', () => {
  const summary = summarize(20);
  assert.equal(summary.rows.length, 7);
  assert.ok(summary.allRaresRate >= 0 && summary.allRaresRate <= 1);
  const text = report(summary);
  assert.match(text, /\| 182 \| 910,000 \| 90 \| 年こしの峠 \| 7 \| 1,120 \|/);
  assert.match(text, /\| 26 \| 130,000 \| 31 \| わかばの田んぼ道 \| 1 \| 160 \|/);
});
