// 成果の画面の 戦闘の 予定表の テスト（npm test）

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AREA_SEC,
  FAST_ROUND_SEC,
  LEAD_SEC,
  MAX_ROUNDS,
  PHASE,
  ROUND_SEC,
  TAIL_SEC,
  battlePlan,
  defeatAt,
  eventAt,
  heroPoseAt,
  hpAt,
  hpColor,
  listDelay,
  pointsAt,
  roundPhase,
} from './battle.ts';
import { LAP_STEPS, clearPending, enemyDef, gameAt, newGame, normalizeGame, walk } from './game.ts';
import { YAMADA_SEED } from './sampleData.ts';
import { soundLength } from './sound.ts';
import type { PendingAdventure } from './types';

const at = (pos: number, seed = 42) => clearPending(walk(newGame(seed), pos));
const pendingOf = (pos: number, steps: number, seed = 42): PendingAdventure => walk(at(pos, seed), steps).pending!;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test('戦闘：山田さんの 2,345歩は 3体。1体 1.5秒で HP 750 → 0、おわりに +30ポイントと 勝ちのポーズ', () => {
  const pending = walk(gameAt(12, 1450, 1280, YAMADA_SEED), 2345).pending!;
  const plan = battlePlan(pending);
  assert.deepEqual(
    plan.rounds.map((r) => [r.id, r.hpFrom, r.hpTo, r.hpMax, r.defeated, r.dur]),
    [
      ['amagumo', 750, 0, 750, true, 1.5],
      ['ishikoron', 750, 0, 750, true, 1.5],
      ['happappa', 750, 0, 750, true, 1.5],
    ],
  );
  assert.equal(plan.fast, false);
  assert.ok(near(plan.total, LEAD_SEC + 3 * ROUND_SEC.normal + TAIL_SEC));
  // はじめは だれも 出ていない。おわりは みんな 消えて HP 0
  assert.ok(plan.rounds.every((r) => roundPhase(r, 0) === 'wait' && hpAt(r, 0) === 750));
  assert.ok(plan.rounds.every((r) => roundPhase(r, plan.total) === 'gone' && hpAt(r, plan.total) === 0));
  // ポイントは 1体 たおすごとに 10ずつ
  assert.equal(pointsAt(plan, 0), 0);
  assert.equal(pointsAt(plan, defeatAt(plan.rounds[0])), 10);
  assert.equal(pointsAt(plan, defeatAt(plan.rounds[1]) + 0.01), 20);
  assert.equal(pointsAt(plan, plan.total), 30);
  // 主人公：てまりを 出す → 立つ → さいごに 勝ちのポーズ
  const r0 = plan.rounds[0];
  assert.equal(heroPoseAt(plan, r0.start + r0.dur * 0.3), 'attack');
  assert.equal(heroPoseAt(plan, r0.start + r0.dur * 0.8), 'stand');
  assert.equal(heroPoseAt(plan, plan.total), 'cheer');
  // 音：1体目が 消える時に「たおす」。テスト43（3秒以内に 鳴らす）に 間に合う
  assert.deepEqual(plan.sounds.map((c) => c.name), ['defeat']);
  assert.ok(plan.sounds[0].at < 3);
  // 小さい絵の 列は たおした時に 1つずつ 出る
  assert.deepEqual([0, 1, 2].map((i) => listDelay(plan, i)), plan.rounds.map(defeatAt));
});

test('戦闘：回の 形は 出る → てまり → HPが へる → 消える の 順。HP は へる ばかりで ふえない', () => {
  const plan = battlePlan(pendingOf(28_550, 750));
  const r = plan.rounds[0];
  const order = ['wait', 'enter', 'attack', 'drain', 'vanish', 'gone'];
  let last = 0;
  let hp = r.hpFrom;
  for (let t = 0; t <= plan.total; t += 0.01) {
    const k = order.indexOf(roundPhase(r, t));
    assert.ok(k >= last, `${t.toFixed(2)}秒で 形が もどった`);
    last = k;
    const now = hpAt(r, t);
    assert.ok(now <= hp && now >= 0, `${t.toFixed(2)}秒で HP が ふえた`);
    hp = now;
  }
  assert.equal(hpAt(r, r.start + r.dur * PHASE.drainFrom), 750);
  assert.equal(hpAt(r, r.start + r.dur * PHASE.vanish), 0);
});

test('戦闘：4体 以上は 早送り。回は 8回まで で、ポイントの 合計は 成果と 同じ', () => {
  const four = battlePlan(pendingOf(0, 750 * 4));
  assert.equal(four.rounds.length, 4);
  assert.equal(four.fast, true);
  assert.ok(four.rounds.every((r) => r.dur === FAST_ROUND_SEC[r.kind === 'rare' ? 'rare' : 'normal']));
  const many = pendingOf(0, 750 * 40);
  const plan = battlePlan(many);
  assert.equal(many.enemies.length, 40);
  assert.equal(plan.rounds.length, MAX_ROUNDS);
  assert.equal(pointsAt(plan, plan.total), many.points);
  assert.ok(pointsAt(plan, plan.total - 0.01) <= many.points);
  // 小さい絵の 列の 出る時刻は 前から 順に おそくなる
  for (let i = 1; i < 7; i += 1) assert.ok(listDelay(plan, i) >= listDelay(plan, i - 1));
  assert.ok(plan.total < 12, `${plan.total}秒は 長すぎる`);
});

test('戦闘：多いときは ボス・レアを 先に えらぶ（会った 順の まま）', () => {
  // 1巡りを 一度に 歩くと ボス7体を 必ず 見せる（途中の 裏ボスも 入る）
  const pending = walk(newGame(5), LAP_STEPS + 500).pending!;
  const plan = battlePlan(pending);
  assert.equal(plan.rounds.length, MAX_ROUNDS);
  const kinds = plan.rounds.map((r) => enemyDef(r.id).kind);
  assert.equal(kinds.filter((k) => k === 'boss').length, 7);
  assert.equal(plan.rounds.at(-1)?.id, 'oomisoka');
  assert.equal(plan.rounds.at(-1)?.defeated, false);
  const indexes = plan.rounds.map((r) => r.index ?? Infinity);
  assert.deepEqual(indexes, [...indexes].sort((a, b) => a - b));
  assert.equal(pointsAt(plan, plan.total), pending.points);
});

test('戦闘：ボスの 途中から 歩くと、ボスの バーは 前の残り → 今の残り。消えずに のこり、太鼓（ボスに 会う）', () => {
  const pending = pendingOf(121_000, 2000);
  const plan = battlePlan(pending);
  assert.equal(plan.rounds.length, 1);
  const r = plan.rounds[0];
  assert.deepEqual([r.id, r.hpFrom, r.hpTo, r.hpMax, r.defeated, r.points], ['hanafubuki', 9000, 7000, 10_000, false, 0]);
  assert.equal(roundPhase(r, plan.total), 'stay');
  assert.equal(hpAt(r, plan.total), 7000);
  assert.ok(eventAt(plan, r.start + 0.1, 'boss'));
  assert.deepEqual(plan.sounds, [{ name: 'bossMeet', at: r.start }]);
  assert.equal(pointsAt(plan, plan.total), 0);
  assert.equal(heroPoseAt(plan, plan.total), 'cheer');
});

test('戦闘：ボスを たおして エリアを こえると、ボスの 回の あとに「エリアをこえる」（その季節の色）が 入る', () => {
  const pending = pendingOf(121_000, 9000 + 750 * 2);
  assert.deepEqual(pending.clearedAreas, [1]);
  const plan = battlePlan(pending);
  const boss = plan.rounds[0];
  assert.deepEqual([boss.id, boss.hpFrom, boss.hpTo, boss.defeated], ['hanafubuki', 9000, 0, true]);
  const area = plan.events.find((e) => e.kind === 'area');
  assert.deepEqual(area, { kind: 'area', at: boss.start + boss.dur, dur: AREA_SEC, area: 1 });
  // 次の敵は エリアを こえる 演出の あと
  assert.ok(near(plan.rounds[1].start, area!.at + area!.dur));
  assert.equal(enemyDef(plan.rounds[1].id).area, 2);
  // 音：ボスが 出る時に「ボスを たおす」（太鼓から）、演出の はじめに 笛
  assert.deepEqual(plan.sounds.map((c) => c.name), ['bossDefeat', 'areaClear']);
  assert.equal(plan.sounds[0].at, boss.start);
  assert.ok(plan.sounds[1].at >= area!.at);
});

test('戦闘：前の残りが 無い 古い成果は、ボスを いっぱいから 見せる', () => {
  const pending = { ...pendingOf(121_000, 2000) };
  delete pending.bossBefore;
  assert.equal(battlePlan(pending).rounds[0].hpFrom, 10_000);
  // normalizeGame を 通すと うまる
  const fixed = normalizeGame({ v: 3, seed: 42, totalSteps: 123_000, lap: 1, pos: 123_000, pending });
  assert.equal(battlePlan(fixed.pending!).rounds[0].hpFrom, 9000);
});

test('戦闘：レアに 会えたら その回は 金の光（rare の 演出）と 鈴', () => {
  let found: PendingAdventure | null = null;
  for (let seed = 1; seed < 400 && !found; seed += 1) {
    const p = walk(newGame(seed), 750 * 3).pending!;
    if (p.rares.length === 1 && p.enemies.length === 3) found = p;
  }
  assert.ok(found, 'レアに 会える 種が 見つからない');
  const plan = battlePlan(found);
  const rare = plan.rounds.find((r) => r.kind === 'rare')!;
  assert.equal(rare.dur, ROUND_SEC.rare);
  assert.ok(eventAt(plan, rare.start + 0.1, 'rare'));
  assert.equal(eventAt(plan, plan.total, 'rare'), null);
  assert.deepEqual(plan.sounds, [{ name: 'rare', at: rare.start }]);
});

test('戦闘：敵が いなければ 演出なし（0秒）', () => {
  const plan = battlePlan(pendingOf(0, 100));
  assert.equal(plan.total, 0);
  assert.deepEqual(plan.rounds, []);
  assert.deepEqual(plan.sounds, []);
  assert.equal(heroPoseAt(plan, 0), 'stand');
});

test('戦闘の 音：2つまで、重ならない（前の 音が おわってから 次）。どの 成果でも', () => {
  for (const [pos, steps] of [
    [0, 2345],
    [119_000, 2000],
    [121_000, 9500],
    [0, 130_000 + 400],
    [0, LAP_STEPS + 2000],
    [LAP_STEPS - 1000, 12_000],
  ]) {
    for (const seed of [1, 2, 3, 42]) {
      const plan = battlePlan(pendingOf(pos, steps, seed));
      assert.ok(plan.sounds.length <= 2);
      for (let i = 1; i < plan.sounds.length; i += 1) {
        const prev = plan.sounds[i - 1];
        assert.ok(plan.sounds[i].at >= prev.at + soundLength(prev.name), `${pos}+${steps}歩で 音が 重なる`);
      }
      assert.equal(pointsAt(plan, plan.total), walk(at(pos, seed), steps).pending!.points);
    }
  }
});

test('HPバーの 色：いっぱいは 緑、0 は 金。赤い 色は 使わない（色相 40〜150度）。レアは いつも 金', () => {
  assert.equal(hpColor(1), '#3E9A63');
  assert.equal(hpColor(0), '#FFC53D');
  assert.equal(hpColor(0.4, true), '#FFC53D');
  assert.equal(hpColor(Number.NaN), '#FFC53D');
  for (let k = 0; k <= 100; k += 1) {
    const hex = hpColor(k / 100);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    if (max === r) hue = (60 * ((g - b) / (max - min)) + 360) % 360;
    else if (max === g) hue = 60 * ((b - r) / (max - min)) + 120;
    else hue = 60 * ((r - g) / (max - min)) + 240;
    assert.ok(hue >= 40 && hue <= 150, `${k}% の 色 ${hex} の 色相が ${hue.toFixed(0)}度`);
  }
});
