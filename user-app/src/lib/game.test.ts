// ゲームの核（出会い・レア・ボス・レベル・記録の直し方）の テスト（npm test）

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AREAS } from '../data/areas.ts';
import {
  AREA_STEPS,
  BOSS_STEPS,
  LAP_END,
  LAP_STEPS,
  ROAD_STEPS,
  canStartLap,
  clearPending,
  encounterAt,
  enemyDef,
  expForNextLevel,
  gameAt,
  isGameRecord,
  lapLabel,
  levelFromTotal,
  newGame,
  normalBag,
  normalizeGame,
  placeName,
  resultNotes,
  segmentAt,
  nextEnemyHp,
  startLap,
  stepsToNextEnemy,
  stepsToNextLevel,
  upcomingEnemy,
  walk,
} from './game.ts';
import { fnv1a } from './random.ts';
import { buildSampleUsers, YAMADA_SEED } from './sampleData.ts';
import type { GameState } from './types';

/** 保存して 読みこんだことにする */
const reload = (game: GameState) => normalizeGame(JSON.parse(JSON.stringify(game)));

// ---------- レベル ----------

test('レベル：レベル12の必要歩数は 3,600。gameAt(12, 1450) の累計歩数は 28,550', () => {
  assert.equal(expForNextLevel(12), 3600);
  const g = gameAt(12, 1450, 1280, 7);
  assert.equal(g.totalSteps, 28550);
  assert.equal(g.level, 12);
  assert.equal(g.exp, 2150);
  assert.equal(g.points, 1280);
  assert.equal(g.pending, null);
  assert.equal(stepsToNextLevel(g), 1450);
  assert.deepEqual(levelFromTotal(28550), { level: 12, exp: 2150 });
});

test('レベル：910,000歩で レベル90。130,000歩（エリア1の おわり）で レベル31', () => {
  assert.equal(levelFromTotal(0).level, 1);
  assert.equal(levelFromTotal(1399).level, 1);
  assert.equal(levelFromTotal(1400).level, 2);
  assert.equal(levelFromTotal(130_000).level, 31);
  assert.equal(levelFromTotal(910_000).level, 90);
  assert.equal(walk(newGame(1), 910_000).level, 90);
});

test('レベル：歩いた分が 経験値になり、あまりは 次のレベルへ 持ち越す', () => {
  const g = walk(gameAt(12, 1450, 0, 3), 2345);
  assert.equal(g.level, 13);
  assert.equal(g.exp, 2345 - 1450);
  assert.equal(g.pending?.fromLevel, 12);
  assert.equal(g.pending?.toLevel, 13);
  assert.equal(g.pending?.exp, 2345);
});

// ---------- 道の区切り ----------

test('区切り：道中 120,000歩 → ボス 10,000歩 を 7回、そのあと 年こしの峠 → ふりかえりの道', () => {
  assert.equal(ROAD_STEPS, 120_000);
  assert.equal(BOSS_STEPS, 10_000);
  assert.equal(AREA_STEPS, 130_000);
  assert.equal(LAP_STEPS, 910_000);
  assert.equal(LAP_END, 957_300);
  assert.deepEqual(segmentAt(0), { kind: 'road', area: 1, start: 0, end: 120_000, boss: null });
  assert.deepEqual(segmentAt(119_999).kind, 'road');
  assert.deepEqual(segmentAt(120_000), { kind: 'boss', area: 1, start: 120_000, end: 130_000, boss: 'hanafubuki' });
  assert.deepEqual(segmentAt(130_000), { kind: 'road', area: 2, start: 130_000, end: 250_000, boss: null });
  assert.deepEqual(segmentAt(909_999), { kind: 'boss', area: 7, start: 900_000, end: 910_000, boss: 'motsuredama' });
  assert.deepEqual(segmentAt(910_000), { kind: 'ura', area: 'end', start: 910_000, end: 920_800, boss: 'oomisoka' });
  assert.deepEqual(segmentAt(920_800), { kind: 'ura', area: 'end', start: 920_800, end: 957_300, boss: 'hatsuhinode' });
  assert.deepEqual(segmentAt(957_300), { kind: 'after', area: 'end', start: 957_300, end: Infinity, boss: null });
});

// ---------- 出会い ----------

test('出会い：同じ種なら 同じ並び。種・巡り・エリアが ちがえば 並びが変わる', () => {
  const line = (seed: number, lap: number, area: 1 | 2) => Array.from({ length: 160 }, (_, j) => encounterAt(seed, lap, area, j)).join();
  assert.equal(line(5, 1, 1), line(5, 1, 1));
  assert.notEqual(line(5, 1, 1), line(6, 1, 1));
  assert.notEqual(line(5, 1, 1), line(5, 2, 1));
  // エリアの敵は そのエリアの 13体（ふつう12＋レア1）から 出る
  for (const area of [1, 2] as const) {
    const ok = new Set([...AREAS[area - 1].normals, AREAS[area - 1].rare]);
    for (let j = 0; j < 160; j += 1) assert.ok(ok.has(encounterAt(5, 1, area, j)));
  }
});

test('出会い：袋12回で ふつう12体が そろう', () => {
  for (const seed of [1, 2, 3, YAMADA_SEED]) {
    for (let area = 1; area <= 7; area += 1) {
      for (let cycle = 0; cycle < 14; cycle += 1) {
        const bag = normalBag(seed, 1, area, cycle);
        assert.deepEqual([...bag].sort(), [...AREAS[area - 1].normals].sort());
        // レアの回を のぞけば、出会いは 袋の順の とおり
        for (let k = 0; k < 12; k += 1) {
          const j = cycle * 12 + k;
          const met = encounterAt(seed, 1, area as 1, j);
          assert.ok(met === bag[k] || met === AREAS[area - 1].rare, `種${seed} エリア${area} ${j}番目`);
        }
      }
    }
  }
  // 袋の並びは まわりごとに 変わる
  assert.notDeepEqual(normalBag(1, 1, 1, 0), normalBag(1, 1, 1, 1));
});

test('出会い：750歩ごとに 1体。まとめて歩いても 分けて歩いても 同じ結果', () => {
  const seed = 2026;
  assert.equal(walk(newGame(seed), 749).pending?.enemies.length, 0);
  assert.equal(walk(newGame(seed), 750).pending?.enemies.length, 1);
  assert.equal(walk(newGame(seed), ROAD_STEPS).pending?.enemies.length, 160);

  const total = LAP_END + 30_000; // 1巡りと 年こしの峠、ふりかえりの道まで
  const once = walk(newGame(seed), total);
  for (const chunk of [1, 7, 749, 750, 751, 5000, 123_456]) {
    let g = newGame(seed);
    // 1歩ずつは 時間が かかるので、はじめの 3,000歩だけ
    const limit = chunk === 1 ? 3000 : total;
    let walked = 0;
    while (walked < limit) {
      const d = Math.min(chunk, limit - walked);
      g = walk(g, d);
      walked += d;
    }
    assert.deepEqual(g, chunk === 1 ? walk(newGame(seed), limit) : once, `${chunk}歩ずつ`);
  }
  // 成果を 見おわっても、出会いは 変わらない
  let g = newGame(seed);
  const met: string[] = [];
  for (let i = 0; i < 40; i += 1) {
    g = walk(g, 2345);
    met.push(...(g.pending?.enemies ?? []));
    g = clearPending(g);
  }
  assert.deepEqual(met, walk(newGame(seed), 2345 * 40).pending?.enemies);
});

test('出会い：歩数が 1以上なら 敵が 0体でも 成果を作る。0以下・数でない歩数は 何もしない', () => {
  const g = newGame(1);
  const after = walk(g, 10);
  assert.deepEqual(after.pending, { steps: 10, enemies: [], exp: 10, points: 0, fromLevel: 1, toLevel: 1, boss: null, bossBefore: null, clearedAreas: [], rares: [] });
  assert.equal(walk(g, 0), g);
  assert.equal(walk(g, -5), g);
  assert.equal(walk(g, Number.NaN), g);
  assert.equal(walk(g, Infinity), g);
});

test('出会い：ポイントは ふつう10・レア50・ボス100。会った回数が たまる', () => {
  const g = walk(newGame(11), AREA_STEPS);
  const p = g.pending!;
  const kinds = p.enemies.map((id) => enemyDef(id).kind);
  const rares = kinds.filter((k) => k === 'rare').length;
  assert.equal(kinds.filter((k) => k === 'boss').length, 1);
  assert.equal(p.enemies.length, 161);
  assert.equal(p.rares.length, rares);
  assert.equal(p.points, (160 - rares) * 10 + rares * 50 + 100);
  assert.equal(g.points, p.points);
  assert.equal(Object.values(g.seen).reduce((a, b) => a + (b ?? 0), 0), 161);
  assert.equal(g.seen.hanafubuki, 1);
});

// ---------- レア ----------

test('レア：種1000個・出会い160回で、そのエリアのレアに会えた割合が 86.6%±3%', () => {
  for (const area of [1, 4, 7] as const) {
    let met = 0;
    let rareCount = 0;
    for (let seed = 0; seed < 1000; seed += 1) {
      let found = false;
      for (let j = 0; j < 160; j += 1) {
        if (encounterAt(seed, 1, area, j) === AREAS[area - 1].rare) {
          found = true;
          rareCount += 1;
        }
      }
      if (found) met += 1;
    }
    const rate = met / 1000;
    assert.ok(Math.abs(rate - 0.866) <= 0.03, `エリア${area}：会えた割合 ${rate}`);
    // 1回の出会いにつき 1/80（160回で 平均2回）
    assert.ok(Math.abs(rareCount / 1000 - 2) <= 0.15, `エリア${area}：レアの平均 ${rareCount / 1000}回`);
  }
});

test('レア：青天井（会えないまま エリアを こえる人も いる）。会えなくても 先へ進む', () => {
  let none = 0;
  for (let seed = 0; seed < 200; seed += 1) {
    const g = walk(newGame(seed), AREA_STEPS);
    assert.deepEqual(g.pending?.clearedAreas, [1]);
    if (!g.seen.donburako) none += 1;
  }
  assert.ok(none > 0, 'レアに 会えない人が 1人も いない');
});

// ---------- ボス ----------

test('ボス：120,000歩で はじまり、130,000歩で たおす。戦っている間は 道中の出会いが 止まる', () => {
  const seed = 42;
  const before = walk(newGame(seed), 119_999);
  assert.equal(before.pending?.boss, null);
  assert.equal(before.pending?.enemies.length, 159);

  const start = walk(before, 1);
  assert.deepEqual(start.pending?.boss, { id: 'hanafubuki', left: 10_000, total: 10_000 });
  assert.equal(start.pending?.enemies.length, 160);
  assert.equal(upcomingEnemy(start), 'hanafubuki');

  const mid = walk(start, 3800);
  assert.deepEqual(mid.pending?.boss, { id: 'hanafubuki', left: 6200, total: 10_000 });
  assert.equal(mid.pending?.enemies.length, 160, 'ボスと戦っている間は 敵に会わない');
  assert.deepEqual(mid.pending?.clearedAreas, []);

  const almost = walk(mid, 6199);
  assert.equal(almost.pending?.boss?.left, 1);
  const pointsBefore = almost.points;

  const done = walk(almost, 1);
  assert.equal(done.pos, 130_000);
  assert.equal(done.pending?.boss, null);
  assert.equal(done.pending?.enemies.at(-1), 'hanafubuki');
  assert.deepEqual(done.pending?.clearedAreas, [1]);
  assert.equal(done.points, pointsBefore + 100);
  assert.equal(done.seen.hanafubuki, 1);
  // 次は エリア2の敵
  assert.equal(enemyDef(upcomingEnemy(done)).area, 2);
});

test('ボス：日をまたいでも（成果を見て、保存して 読みこんでも）残りが もどらない', () => {
  let g = walk(newGame(42), 123_800);
  assert.equal(g.pending?.boss?.left, 6200);
  g = reload(clearPending(g)); // 次の日
  assert.equal(g.pending, null);
  assert.equal(g.pos, 123_800);
  g = walk(g, 200);
  assert.deepEqual(g.pending?.boss, { id: 'hanafubuki', left: 6000, total: 10_000 });
  assert.deepEqual(g.pending?.enemies, []);
  g = walk(reload(clearPending(g)), 6000);
  assert.deepEqual(g.pending?.enemies, ['hanafubuki']);
  assert.deepEqual(g.pending?.clearedAreas, [1]);
});

test('ボス：一度に大きな歩数が入っても、7体を 順に たおす', () => {
  const g = walk(newGame(8), LAP_STEPS);
  const bosses = g.pending!.enemies.filter((id) => enemyDef(id).kind === 'boss');
  assert.deepEqual(bosses, AREAS.map((a) => a.boss));
  assert.deepEqual(g.pending?.clearedAreas, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(g.pending?.enemies.length, 7 * 161);
  assert.deepEqual(g.pending?.boss, { id: 'oomisoka', left: 10_800, total: 10_800 });
});

// ---------- 年こしの峠・巡り ----------

test('年こしの峠：おおみそか（10,800歩・108ポイント）→ はつひので（36,500歩・365ポイント）。出会いは つづく', () => {
  const cleared = clearPending(walk(newGame(3), LAP_STEPS));
  assert.equal(canStartLap(cleared), false);
  assert.equal(startLap(cleared), cleared, '峠を こえるまで 次の巡りは はじまらない');

  const first = walk(cleared, 10_800);
  const p1 = first.pending!;
  assert.equal(p1.enemies.filter((id) => id === 'oomisoka').length, 1);
  assert.equal(p1.enemies.length, 14 + 1, '750歩ごとの 14体と おおみそか');
  assert.deepEqual(p1.boss, { id: 'hatsuhinode', left: 36_500, total: 36_500 });
  const metPoints = p1.enemies.filter((id) => id !== 'oomisoka').reduce((sum, id) => sum + (enemyDef(id).kind === 'rare' ? 50 : 10), 0);
  assert.equal(p1.points, metPoints + 108);

  const second = walk(clearPending(first), 36_500);
  assert.equal(second.pos, LAP_END);
  assert.equal(second.pending?.enemies.filter((id) => id === 'hatsuhinode').length, 1);
  assert.equal(second.pending?.boss, null);
  assert.deepEqual(second.pending?.clearedAreas, []);
  assert.equal(canStartLap(second), true);

  // ふりかえりの道：巡りを はじめるまで、ふつう84体・レア7体から 敵が出つづける
  const after = walk(clearPending(second), 75_000);
  assert.equal(after.pending?.enemies.length, 100);
  for (const id of after.pending!.enemies) assert.ok(['normal', 'rare'].includes(enemyDef(id).kind));
  assert.ok(new Set(after.pending!.enemies.map((id) => enemyDef(id).area)).size >= 5, 'いろいろなエリアの敵が出る');
});

test('巡り：はじめると 巡りが 1ふえ、入口に もどる。レベル・ポイント・会った回数は そのまま', () => {
  const end = walk(newGame(3), LAP_END + 1000);
  const next = startLap(end);
  assert.equal(next.lap, 2);
  assert.equal(next.pos, 0);
  assert.equal(next.level, end.level);
  assert.equal(next.totalSteps, end.totalSteps);
  assert.equal(next.points, end.points);
  assert.deepEqual(next.seen, end.seen);
  assert.equal(next.pending?.boss, null);
  // 2巡り目は 出会いの並びが 変わる
  const lap1 = walk(newGame(3), 12_000).pending?.enemies;
  const lap2 = walk(clearPending(next), 12_000).pending?.enemies;
  assert.equal(lap2?.length, 16);
  assert.notDeepEqual(lap2, lap1);
  assert.deepEqual(reload(next), next);
});

// ---------- 保存した記録を 直す ----------

test('normalizeGame：古い記録（v2）の山田さん。古い式で 累計歩数を出し、新しい式で レベルを出しなおす', () => {
  const old = { level: 12, exp: 2150, points: 1280, stepsTowardEnemy: 0, nextEnemy: 0, pending: null };
  const g = normalizeGame(old, YAMADA_SEED);
  // 古い式：レベル12まで 3000×11 + 50×(1+…+11) = 36,300歩。そこに 2,150歩
  assert.equal(g.totalSteps, 38_450);
  assert.deepEqual({ level: g.level, exp: g.exp }, levelFromTotal(38_450));
  assert.equal(g.level, 15);
  assert.deepEqual(g, { v: 3, seed: YAMADA_SEED, totalSteps: 38_450, lap: 1, pos: 38_450, level: 15, exp: 650, points: 1280, seen: {}, pending: null });
});

test('normalizeGame：古い記録の 見ていない成果は 消さない', () => {
  const old = {
    level: 13,
    exp: 895,
    points: 1310,
    stepsTowardEnemy: 95,
    nextEnemy: 0,
    pending: { steps: 2345, enemies: ['amagumo', 'ishikoron', 'happappa'], exp: 2345, points: 30, fromLevel: 12, toLevel: 13 },
  };
  const g = normalizeGame(old, 5);
  assert.equal(g.totalSteps, 12 * (3000 + 25 * 13) + 895);
  assert.deepEqual(g.pending, {
    steps: 2345,
    enemies: ['amagumo', 'ishikoron', 'happappa'],
    exp: 2345,
    points: 30,
    fromLevel: levelFromTotal(g.totalSteps - 2345).level,
    toLevel: g.level,
    boss: null,
    bossBefore: null,
    clearedAreas: [],
    rares: [],
  });
  assert.deepEqual(normalizeGame(g, 5), g);
});

test('normalizeGame：項目が欠けた記録は 初めの値で うめる', () => {
  assert.deepEqual(normalizeGame({ v: 3 }, 9), newGame(9));
  assert.deepEqual(normalizeGame({}, 9), newGame(9));
  assert.deepEqual(normalizeGame(null, 9), newGame(9));
  assert.deepEqual(normalizeGame('こわれた記録', 9), newGame(9));
  const g = normalizeGame({ v: 3, seed: 77, totalSteps: 28_550, pos: 28_550 });
  assert.deepEqual(g, { v: 3, seed: 77, totalSteps: 28_550, lap: 1, pos: 28_550, level: 12, exp: 2150, points: 0, seen: {}, pending: null });
  // 成果の 項目が欠けていても 直す
  const p = normalizeGame({ v: 3, seed: 77, totalSteps: 28_550, pos: 123_000, pending: { steps: 100 } }).pending;
  assert.deepEqual(p, {
    steps: 100,
    enemies: [],
    exp: 0,
    points: 0,
    fromLevel: 12,
    toLevel: 12,
    boss: { id: 'hanafubuki', left: 7000, total: 10_000 },
    // 前の残りが 無い 古い記録は「いまの位置 − 成果の歩数」（122,900歩）の ボスで うめる
    bossBefore: { id: 'hanafubuki', left: 7100, total: 10_000 },
    clearedAreas: [],
    rares: [],
  });
});

test('normalizeGame：NaN や 負の数・知らない敵が入った記録は、0 や 空に直す', () => {
  const broken = {
    v: 3,
    seed: Number.NaN,
    totalSteps: Number.NaN,
    lap: -2,
    pos: Infinity,
    level: Number.NaN,
    exp: -10,
    points: Number.NaN,
    seen: { amagumo: 3, ishikoron: Number.NaN, nazo: 5, happappa: -1, donburako: 1.9 },
    pending: {
      steps: Number.NaN,
      enemies: ['amagumo', 'nazo', 42, null],
      exp: Number.NaN,
      points: -30,
      fromLevel: Number.NaN,
      toLevel: 99,
      boss: { id: 'nazo', left: Number.NaN, total: 1 },
      clearedAreas: [1, 1, 9, 'x', 2.5],
      rares: ['donburako', 'amagumo', 'nazo'],
    },
  };
  const g = normalizeGame(broken, 9);
  assert.deepEqual(g, {
    v: 3,
    seed: 0,
    totalSteps: 0,
    lap: 1,
    pos: 0,
    level: 1,
    exp: 0,
    points: 0,
    seen: { amagumo: 3, donburako: 1 },
    pending: { steps: 0, enemies: ['amagumo'], exp: 0, points: 0, fromLevel: 1, toLevel: 1, boss: null, bossBefore: null, clearedAreas: [1], rares: ['donburako'] },
  });
  for (const value of Object.values(g)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
  // 古い形の NaN（JSON では null になる）も 直す
  const old = normalizeGame({ level: null, exp: Number.NaN, points: null, pending: null }, 9);
  assert.deepEqual(old, newGame(9));
  // 直した記録で そのまま 歩ける
  assert.equal(walk(g, 750).pending?.enemies.length, 2);
});

test('normalizeGame：2回通しても 同じ結果。歩いた記録は 通しても 変わらない', () => {
  const samples: unknown[] = [
    { level: 12, exp: 2150, points: 1280, stepsTowardEnemy: 0, nextEnemy: 0, pending: null },
    { level: 40, exp: 99_999, points: 5, pending: { steps: 500, enemies: ['amagumo'], exp: 500, points: 10, fromLevel: 39, toLevel: 40 } },
    { v: 3, seed: 1, totalSteps: 5000.7, lap: 2.5, pos: 124_000.2, pending: { steps: 3 } },
    {},
    null,
  ];
  for (const raw of samples) {
    const once = normalizeGame(raw, 123);
    assert.deepEqual(normalizeGame(once, 123), once);
    assert.deepEqual(normalizeGame(once, 456), once, '種は 1回目に 決まる');
    assert.deepEqual(reload(once), once);
  }
  for (const steps of [10, 2345, 125_000, LAP_STEPS + 5000, LAP_END + 5000]) {
    const g = walk(gameAt(12, 1450, 1280, YAMADA_SEED), steps);
    assert.deepEqual(reload(g), g, `${steps}歩`);
  }
});

test('normalizeGame：level が 数でない記録も 人ごと なくさず 受けとって 直す（store は game が オブジェクトなら通す）', () => {
  // 受けとるか どうか：オブジェクトなら通す
  for (const game of [{ level: null }, { level: '12' }, {}, { v: 3 }, { v: 3, level: 'x', totalSteps: 28_550, pos: 28_550 }]) {
    assert.equal(isGameRecord(game), true);
  }
  for (const game of [null, undefined, 12, 'game']) assert.equal(isGameRecord(game), false);

  // 受けとった記録は 直って、そのまま 歩ける
  assert.deepEqual(normalizeGame({ level: null }, 9), newGame(9));
  assert.deepEqual(normalizeGame({ level: '12', exp: 100, points: 40 }, 9), { ...newGame(9), totalSteps: 100, pos: 100, exp: 100, points: 40 });
  const fixed = normalizeGame({ v: 3, seed: 7, level: 'x', totalSteps: 28_550, pos: 28_550, points: 1280 }, 9);
  assert.equal(fixed.level, 12);
  assert.equal(fixed.exp, 2150);
  assert.equal(fixed.points, 1280);
  assert.equal(walk(fixed, 2345).level, 13);
});

// ---------- 画面に出す ことば ----------

test('いまいる所の名前：エリアの名前 → 年こしの峠 → ふりかえりの道', () => {
  assert.equal(placeName(0), 'はなあかりの小道');
  assert.equal(placeName(129_999), 'はなあかりの小道');
  assert.equal(placeName(130_000), 'わかばの田んぼ道');
  assert.equal(placeName(909_999), 'めぐりの丘');
  assert.equal(placeName(LAP_STEPS), '年こしの峠');
  assert.equal(placeName(LAP_END - 1), '年こしの峠');
  assert.equal(placeName(LAP_END), 'ふりかえりの道');
});

test('巡りの数の言い方：二巡り目・十巡り目・十二巡り目・二十一巡り目', () => {
  assert.equal(lapLabel(1), '一巡り目');
  assert.equal(lapLabel(2), '二巡り目');
  assert.equal(lapLabel(10), '十巡り目');
  assert.equal(lapLabel(12), '十二巡り目');
  assert.equal(lapLabel(20), '二十巡り目');
  assert.equal(lapLabel(21), '二十一巡り目');
  assert.equal(lapLabel(100), '100巡り目');
  assert.equal(lapLabel(Number.NaN), '一巡り目');
});

test('成果に足す行：何もなければ 空。ボス・レア・こえたエリアが あるときだけ 出る（3行まで）', () => {
  // 山田さんの 2,345歩：何も足さない
  assert.deepEqual(resultNotes(walk(gameAt(12, 1450, 1280, YAMADA_SEED), 2345).pending!), []);

  // ボスと戦っている途中
  const boss = walk(newGame(42), 123_800).pending!;
  assert.ok(resultNotes(boss).includes('ボス はなふぶき　あと 6,200歩'));

  // エリア1を こえた
  const cleared = walk(clearPending(walk(newGame(42), 123_800)), 6200).pending!;
  assert.deepEqual(resultNotes(cleared), ['はなあかりの小道を こえた。次は わかばの田んぼ道']);

  // レア（種によって ちがうので、成果を 手で作る）
  const base = { steps: 750, enemies: [], exp: 750, points: 50, fromLevel: 1, toLevel: 1, boss: null, clearedAreas: [], rares: [] };
  assert.deepEqual(resultNotes({ ...base, rares: ['donburako'] }), ['レアの どんぶらこに 会えた！']);
  assert.deepEqual(resultNotes({ ...base, rares: ['donburako', 'hotarubi', 'donburako'] }), ['レアの どんぶらこ・ほたるびに 会えた！']);
  assert.deepEqual(resultNotes({ ...base, rares: ['donburako', 'hotarubi', 'ooatari'] }), ['レアの どんぶらこ など 3体に 会えた！']);

  // いくつも こえたとき・エリア7を こえたとき・峠を こえたとき
  assert.deepEqual(resultNotes({ ...base, clearedAreas: [1, 2] }), ['わかばの田んぼ道まで こえた。次は ゆうすずみ商店街']);
  const all = walk(newGame(8), LAP_STEPS).pending!;
  const notes = resultNotes(all);
  assert.equal(notes[0], 'めぐりの丘まで こえた。次は 年こしの峠');
  assert.equal(notes.at(-1), 'ボス おおみそか　あと 10,800歩');
  assert.ok(notes.length <= 3);
  const pass = walk(clearPending(walk(newGame(8), LAP_STEPS)), 47_300).pending!;
  assert.equal(resultNotes(pass)[0], '年こしの峠を こえた。「わたし」から 次の巡りを はじめられます');
  assert.ok(resultNotes(pass).every((line) => !line.startsWith('ボス')));
});

// ---------- サンプルの利用者 ----------

test('山田さんの種：次の敵が あまぐも。2,345歩で会う3体が ふつうの敵（+30ポイント・レベル12→13）', () => {
  const yamada = buildSampleUsers(new Date(2026, 10, 16, 12, 0)).find((u) => u.id === 's-yamada')!;
  const game = yamada.game;
  assert.equal(game.seed, YAMADA_SEED);
  assert.equal(game.level, 12);
  assert.equal(game.points, 1280);
  assert.equal(stepsToNextLevel(game), 1450);
  assert.equal(game.totalSteps, 28_550);
  assert.equal(upcomingEnemy(game), 'amagumo');

  const after = walk(game, 2345);
  const p = after.pending!;
  // Figma の H-03 と同じ 3体・同じ順
  assert.deepEqual(p.enemies, ['amagumo', 'ishikoron', 'happappa']);
  for (const id of p.enemies) assert.equal(enemyDef(id).kind, 'normal');
  assert.equal(p.points, 30);
  assert.deepEqual(p.rares, []);
  assert.equal(p.boss, null);
  assert.deepEqual([p.fromLevel, p.toLevel], [12, 13]);
  assert.equal(after.points, 1310);
});

test('山田さんの種の 決め方：fnv1a("s-yamada") に 1ずつ足して、はじめに 条件に合った数', () => {
  const base = fnv1a('s-yamada');
  let found = -1;
  for (let k = 0; k < 5000 && found < 0; k += 1) {
    const game = gameAt(12, 1450, 1280, (base + k) >>> 0);
    if (upcomingEnemy(game) !== 'amagumo') continue;
    if (walk(game, 2345).pending?.enemies.join() === 'amagumo,ishikoron,happappa') found = (base + k) >>> 0;
  }
  assert.equal(found, YAMADA_SEED);
});

test('サンプルの利用者：種は 人ごとに ちがい、レベルと ポイントは Figma の数の まま', () => {
  const users = buildSampleUsers(new Date(2026, 10, 16, 12, 0));
  assert.equal(users.length, 12);
  assert.equal(new Set(users.map((u) => u.game.seed)).size, 12);
  for (const u of users) {
    assert.equal(u.game.v, 3);
    assert.equal(u.game.pending, null);
    assert.equal(u.game.pos, u.game.totalSteps);
    assert.deepEqual({ level: u.game.level, exp: u.game.exp }, levelFromTotal(u.game.totalSteps));
    assert.deepEqual(normalizeGame(u.game), u.game);
  }
  assert.equal(users.find((u) => u.id === 's-kato')?.game.level, 17);
  assert.equal(users.find((u) => u.id === 's-kato')?.game.points, 1800);
});

test('こわれた記録に とても大きな数が入っていても 止まらない（上を 10億歩で おさえる）', () => {
  const big = levelFromTotal(1e300);
  assert.ok(Number.isFinite(big.level) && big.level > 1000);
  assert.deepEqual(big, levelFromTotal(1_000_000_000));
  const fixed = normalizeGame({ v: 3, seed: 1, totalSteps: 1e300, lap: 1, pos: 0, level: 1e300, exp: 0, points: 0, seen: {}, pending: null });
  assert.ok(Number.isFinite(fixed.level));
  assert.deepEqual(normalizeGame(fixed), fixed);
  // 古い形（v が無い）で レベルが とても大きい記録も 止まらない
  assert.ok(Number.isFinite(normalizeGame({ level: 1e300, exp: 0, points: 0, stepsTowardEnemy: 0, nextEnemy: 0, pending: null }).level));
});

// ---------- 次の敵まで（ホームの HPバー） ----------

/** pos 歩 進んだ所に いる 記録（成果は 見おわった） */
const at = (pos: number, seed = 42) => clearPending(walk(newGame(seed), pos));

test('次の敵まで：道中は 次の出会いまで（1〜750歩）。ボス・裏ボスは その のこり', () => {
  assert.equal(stepsToNextEnemy(newGame(1)), 750);
  assert.equal(stepsToNextEnemy(at(50)), 700);
  assert.equal(stepsToNextEnemy(at(749)), 1);
  assert.equal(stepsToNextEnemy(at(750)), 750);
  assert.equal(stepsToNextEnemy(at(119_999)), 1);
  // ボスと 戦っている間は ボスの のこり
  assert.equal(stepsToNextEnemy(at(120_000)), 10_000);
  assert.equal(stepsToNextEnemy(at(121_000)), 9000);
  // 山田さん（28,550歩）は 次の あまぐもまで 700歩
  const yamada = gameAt(12, 1450, 1280, YAMADA_SEED);
  assert.equal(stepsToNextEnemy(yamada), 700);
  // 年こしの峠は 裏ボスの のこり、ふりかえりの道は 次の出会いまで
  assert.equal(stepsToNextEnemy(at(LAP_STEPS + 100)), 10_700);
  const after = at(LAP_END + 10);
  assert.equal(segmentAt(after.pos).kind, 'after');
  assert.equal(stepsToNextEnemy(after), LAP_STEPS + 64 * 750 - (LAP_END + 10));
});

test('次の敵まで：その歩数 歩くと 次の敵（upcomingEnemy）を ちょうど 1体 たおす。1歩 少ないと たおさない', () => {
  // 年こしの峠（LAP_STEPS 〜 LAP_END の 裏ボスの 区間）は 入れない。そこでは 裏ボスと 戦いながら 750歩ごとの 出会いも つづくので、
  // 裏ボスの のこりの歩数を 歩くと、とちゅうで ふつうの敵にも 会い「ちょうど 1体」に ならない（裏ボスの 数は 上の テストで 確かめる）
  for (const pos of [0, 1, 375, 749, 28_550, 60_001, 119_250, 120_000, 125_555, 129_999, 300_123, LAP_END, LAP_END + 999]) {
    const g = at(pos, 7);
    const left = stepsToNextEnemy(g);
    assert.ok(left >= 1, `${pos}歩の所で ${left}歩`);
    if (left > 1) assert.deepEqual(walk(g, left - 1).pending?.enemies, [], `${pos}歩の所で 1歩 少なくても たおした`);
    assert.deepEqual(walk(g, left).pending?.enemies, [upcomingEnemy(g)], `${pos}歩の所`);
  }
});

test('次の敵の HP：ふつうは「次の出会いまで / 750歩」、ボスは「ボスの のこり / 10,000歩」', () => {
  assert.deepEqual(nextEnemyHp(at(28_550, YAMADA_SEED)), { id: 'amagumo', left: 700, total: 750, boss: false });
  assert.deepEqual(nextEnemyHp(at(121_000)), { id: 'hanafubuki', left: 9000, total: 10_000, boss: true });
  assert.deepEqual(nextEnemyHp(at(LAP_STEPS + 800)), { id: 'oomisoka', left: 10_000, total: 10_800, boss: true });
});

// ---------- ボスの 前の残り（戦闘の HPバー） ----------

test('ボスの前の残り：成果を 作りはじめた ときの ボスの のこりを 覚え、歩きたしても かわらない', () => {
  // 道中から はじめた 成果は null（ボスに 入っても）
  assert.equal(walk(newGame(42), 121_000).pending?.bossBefore, null);
  // ボスの 途中から はじめた 成果は その時の のこり
  let g = walk(at(121_000), 2000);
  assert.deepEqual(g.pending?.bossBefore, { id: 'hanafubuki', left: 9000, total: 10_000 });
  assert.deepEqual(g.pending?.boss, { id: 'hanafubuki', left: 7000, total: 10_000 });
  g = walk(g, 1000);
  assert.deepEqual(g.pending?.bossBefore, { id: 'hanafubuki', left: 9000, total: 10_000 }, '歩きたすと かわった');
  assert.equal(g.pending?.boss?.left, 6000);
  // 保存して 読みこんでも のこる。2回 通しても 同じ
  assert.deepEqual(reload(g).pending?.bossBefore, g.pending?.bossBefore);
  assert.deepEqual(normalizeGame(reload(g)), reload(g));
  // たおしきっても 前の残りは のこる（戦闘で 9,000 → 0 と 見せる）
  const done = walk(g, 6000);
  assert.equal(done.pending?.boss, null);
  assert.equal(done.pending?.bossBefore?.left, 9000);
});

test('ボスの前の残り：無い 古い記録は「いまの位置 − 成果の歩数」の ボスで うめ、null は そのまま、こわれた値は 直す', () => {
  const base = { v: 3, seed: 1, totalSteps: 125_000, lap: 1, pos: 125_000 };
  const pending = { steps: 2000, enemies: [], exp: 2000, points: 0, fromLevel: 30, toLevel: 30, clearedAreas: [], rares: [] };
  assert.deepEqual(normalizeGame({ ...base, pending }).pending?.bossBefore, { id: 'hanafubuki', left: 7000, total: 10_000 });
  // 成果の 歩数が ボスの 前から なら null（ボスは いっぱいから 見せる）
  assert.equal(normalizeGame({ ...base, pending: { ...pending, steps: 6000 } }).pending?.bossBefore, null);
  assert.equal(normalizeGame({ ...base, pending: { ...pending, bossBefore: null } }).pending?.bossBefore, null);
  // 大きすぎる のこりは はじめの歩数に、知らない敵・ふつうの敵・0以下は うめなおす
  assert.deepEqual(normalizeGame({ ...base, pending: { ...pending, bossBefore: { id: 'hanafubuki', left: 99_999, total: 1 } } }).pending?.bossBefore, {
    id: 'hanafubuki',
    left: 10_000,
    total: 10_000,
  });
  for (const broken of [{ id: 'nazo', left: 5 }, { id: 'amagumo', left: 5 }, { id: 'hanafubuki', left: 0 }, { id: 'hanafubuki', left: Number.NaN }, 'x']) {
    assert.deepEqual(normalizeGame({ ...base, pending: { ...pending, bossBefore: broken } }).pending?.bossBefore, { id: 'hanafubuki', left: 7000, total: 10_000 });
  }
  const fixed = normalizeGame({ ...base, pending });
  assert.deepEqual(normalizeGame(JSON.parse(JSON.stringify(fixed))), fixed);
});
