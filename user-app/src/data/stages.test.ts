// ステージの 表と 時間帯・天気・粒の 数の テスト（npm test）。設計は docs/設計-ステージ.md

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AREA_STEPS, END_BOSSES, LAP_END, LAP_STEPS } from '../lib/game.ts';
import {
  GIMMICKS,
  LANDMARK_HEIGHT,
  drawCount,
  MAX_PARTICLES,
  STAGES,
  activeGimmicks,
  fallbackTintOf,
  mixTint,
  particleCount,
  stageDef,
  stagePlaceAt,
  stageSky,
  threadDots,
  timeOfDay,
  timeTint,
  weatherFor,
  type EndPhase,
  type StageLayout,
  type TimeOfDay,
  type Weather,
} from './stages.ts';

const HEX = /^#[0-9A-F]{6}$/i;
const TIMES: TimeOfDay[] = ['morning', 'day', 'evening', 'night'];
const LAYOUTS: StageLayout[] = ['home', 'walk', 'battle'];
const at = (h: number, m = 0) => new Date(2026, 10, 19, h, m);
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

test('ステージは 8つ（エリア1〜7 と 年こしの峠）、どれにも 設定が ある', () => {
  assert.deepEqual(
    STAGES.map((s) => s.id),
    ['area1', 'area2', 'area3', 'area4', 'area5', 'area6', 'area7', 'end'],
  );
  for (const s of STAGES) {
    assert.ok(s.name.length > 0 && s.season.length > 0, s.id);
    assert.match(s.sky.top, HEX, `${s.id} の 空`);
    assert.match(s.sky.bottom, HEX, `${s.id} の 空`);
    for (const t of TIMES) {
      assert.match(s.tints[t].color, HEX, `${s.id} の ${t}`);
      assert.ok(s.tints[t].alpha >= 0 && s.tints[t].alpha <= 0.35, `${s.id} の ${t} は うすく`);
    }
    // 夜は 昼より こい（夜の 色を うすく 重ねる）
    assert.ok(s.tints.night.alpha > s.tints.day.alpha, `${s.id} の 夜`);
    assert.ok(s.weathers.length >= 1 && s.weathers.every((w) => w.weight > 0), `${s.id} の 天気`);
    assert.ok(s.landmark.name.length > 0 && s.landmark.id.length > 0, `${s.id} の 目じるし`);
    assert.equal(s.colors.length, 4, `${s.id} の 季節の 色`);
    for (const c of s.colors) assert.match(c, HEX);
    assert.match(s.fallbackTint.color, HEX);
    assert.ok(s.fallbackTint.alpha > 0 && s.fallbackTint.alpha < 0.5);
  }
});

test('エリア1〜7 の 名前と 糸の色は 7エリアの 表と 同じ', async () => {
  const { AREAS } = await import('./areas.ts');
  for (const a of AREAS) {
    const s = stageDef(`area${a.no}` as 'area1');
    assert.equal(s.name, a.name);
    assert.equal(s.area, a.no);
    assert.equal(s.colors[0].toUpperCase(), a.color.toUpperCase());
  }
});

test('目じるしの 押せる 箱：大きめ（はば 54px 以上。幅 320px の 画面でも 44px 以上）で、主人公（x=67〜152）と 敵（x=258〜）に かからない', () => {
  assert.ok(LANDMARK_HEIGHT >= 44);
  // 箱の 上は 次の敵の HPバー（敵の 頭の 上。いちばん 背の ひくい 敵は 57.6px で、バーの 下は 地面から 64px）より 下
  assert.ok(LANDMARK_HEIGHT <= 62);
  for (const s of STAGES) {
    const { x, width } = s.landmark;
    assert.ok(width >= 54, `${s.id} の はば ${width}`);
    // 幅 320px の 画面（場面は 393 → 320 に ちぢむ）でも 指で 押せる 大きさ
    assert.ok((width * 320) / 393 >= 44 && (LANDMARK_HEIGHT * 320) / 393 >= 44, `${s.id} は 小さい 画面で 小さすぎる`);
    assert.ok(x >= 0 && x + width <= 393, `${s.id} が 場面から はみ出す`);
    const hitHero = x < 153 && x + width > 67;
    const hitEnemy = x + width > 258;
    assert.ok(!hitHero && !hitEnemy, `${s.id} の 箱 ${x}〜${x + width}`);
  }
  // 名前と id が かぶらない
  assert.equal(new Set(STAGES.map((s) => s.landmark.id)).size, STAGES.length);
  assert.equal(new Set(STAGES.map((s) => s.landmark.name)).size, STAGES.length);
});

test('ギミックは どの ステージも 3〜5つ。同じものを 2回 入れない', () => {
  for (const s of STAGES) {
    assert.ok(s.gimmicks.length >= 3 && s.gimmicks.length <= 5, `${s.id} は ${s.gimmicks.length}つ`);
    assert.equal(new Set(s.gimmicks).size, s.gimmicks.length, s.id);
  }
  // 年こしの峠の ようすで 出る ものは 年こしの峠だけ
  for (const s of STAGES.filter((st) => st.id !== 'end')) {
    for (const id of s.gimmicks) assert.equal(GIMMICKS[id].phases, undefined, `${s.id} の ${id}`);
  }
});

test('どの ステージも、どの 場面・時間帯・天気でも ギミックが 1つ 以上 出る（ホーム）', () => {
  for (const s of STAGES) {
    const phases: (EndPhase | null)[] = s.id === 'end' ? ['night', 'dawn'] : [null];
    for (const phase of phases) {
      for (const time of TIMES) {
        for (const { weather } of s.weathers) {
          const list = activeGimmicks(s, { layout: 'home', time, weather, phase });
          assert.ok(list.length >= 1, `${s.id} ${phase} ${time} ${weather}`);
        }
      }
    }
  }
});

test('粒は 1場面で 多くても 12こ（タップで 出る 粒も 入れて、すべての 組み合わせで）', () => {
  assert.equal(MAX_PARTICLES, 12);
  for (const s of STAGES) {
    const phases: (EndPhase | null)[] = s.id === 'end' ? ['night', 'dawn'] : [null];
    for (const layout of LAYOUTS) {
      for (const phase of phases) {
        for (const time of TIMES) {
          for (const weather of ['sunny', 'cloudy', 'rain', 'snow'] as Weather[]) {
            const n = particleCount(s, { layout, time, weather, phase });
            assert.ok(n <= MAX_PARTICLES, `${s.id} ${layout} ${phase} ${time} ${weather} で ${n}こ`);
          }
        }
      }
    }
  }
});

test('描く 粒の 数：表の 数だけ 描く（歩行中の ちょうちんは 7つ、縁側の 窓の あかりは 2つ）。どの 場面でも 描く 数の 合計は 12こ まで', () => {
  assert.equal(drawCount('lanterns', 'walk'), 7);
  assert.equal(drawCount('lanterns', 'home'), 3);
  assert.equal(drawCount('lanterns', 'battle'), 3);
  assert.equal(drawCount('windowLight', 'home'), 2);
  for (const id of Object.keys(GIMMICKS) as (keyof typeof GIMMICKS)[]) {
    for (const layout of LAYOUTS) {
      const want = layout === 'walk' ? (GIMMICKS[id].walkParticles ?? GIMMICKS[id].particles) : GIMMICKS[id].particles;
      assert.equal(drawCount(id, layout), want, `${id} ${layout}`);
    }
  }
  // 1場面で 描く 数（いま 出る ギミックの 描く 数＋タップの 粒）の いちばん 多い ときでも 12こ まで
  for (const s of STAGES) {
    const phases: (EndPhase | null)[] = s.id === 'end' ? ['night', 'dawn'] : [null];
    let most = 0;
    for (const layout of LAYOUTS) {
      for (const phase of phases) {
        for (const time of TIMES) {
          for (const { weather } of s.weathers) {
            const drawn = activeGimmicks(s, { layout, time, weather, phase }).reduce((n, id) => n + drawCount(id, layout), 0) + (layout === 'home' ? s.landmark.burst : 0);
            assert.equal(drawn, particleCount(s, { layout, time, weather, phase }));
            most = Math.max(most, drawn);
          }
        }
      }
    }
    assert.ok(most <= MAX_PARTICLES, `${s.id} は いちばん 多い ときに ${most}こ`);
  }
});

test('天気：候補の 中から 決まり、同じ日・同じ人なら 同じ天気', () => {
  const days = Array.from({ length: 120 }, (_, i) => {
    const d = new Date(2026, 0, 1 + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  for (const s of STAGES) {
    const allowed = s.weathers.map((w) => w.weather);
    const seen = new Set<Weather>();
    for (const day of days) {
      const w = weatherFor(s, 12345, day);
      assert.ok(allowed.includes(w), `${s.id} ${day} が ${w}`);
      assert.equal(weatherFor(s, 12345, day), w, '同じ日は 同じ天気');
      seen.add(w);
    }
    // 候補が 2つ ある ステージは、日によって どちらも 出る
    assert.equal(seen.size, allowed.length, `${s.id} で 出た 天気 ${[...seen]}`);
  }
  // エリアに 合う 天気だけ：2は 雨／晴れ、6は 雪／晴れ。ほかの エリアに 雨や 雪は ない
  assert.deepEqual(stageDef('area2').weathers.map((w) => w.weather).sort(), ['rain', 'sunny']);
  assert.deepEqual(stageDef('area6').weathers.map((w) => w.weather).sort(), ['snow', 'sunny']);
  for (const s of STAGES.filter((st) => st.id !== 'area2')) assert.ok(!s.weathers.some((w) => w.weather === 'rain'), s.id);
  for (const s of STAGES.filter((st) => st.id !== 'area6')) assert.ok(!s.weathers.some((w) => w.weather === 'snow'), s.id);
  // 人が ちがうと 天気の 並びも ちがう
  const a = days.map((d) => weatherFor(stageDef('area2'), 1, d)).join();
  const b = days.map((d) => weatherFor(stageDef('area2'), 2, d)).join();
  assert.notEqual(a, b);
});

test('時間帯：朝 5〜10時・昼 10〜16時・夕 16〜19時・夜 19〜5時', () => {
  assert.equal(timeOfDay(at(0)), 'night');
  assert.equal(timeOfDay(at(4, 59)), 'night');
  assert.equal(timeOfDay(at(5)), 'morning');
  assert.equal(timeOfDay(at(9, 59)), 'morning');
  assert.equal(timeOfDay(at(10)), 'day');
  assert.equal(timeOfDay(at(15, 59)), 'day');
  assert.equal(timeOfDay(at(16)), 'evening');
  assert.equal(timeOfDay(at(18, 59)), 'evening');
  assert.equal(timeOfDay(at(19)), 'night');
  assert.equal(timeOfDay(at(23, 59)), 'night');
});

test('時間帯の 色：昼は 重ねず、夜は あい色。1分で 少しずつしか かわらない（急に かえない）', () => {
  for (const s of STAGES) {
    assert.equal(timeTint(s, at(12)).alpha, s.tints.day.alpha, `${s.id} の 昼`);
    assert.deepEqual(timeTint(s, at(23)), s.tints.night, `${s.id} の 夜`);
    assert.deepEqual(timeTint(s, at(2)), s.tints.night, `${s.id} の 夜中`);
    let prev = timeTint(s, at(0, 0));
    for (let m = 1; m <= 24 * 60; m += 1) {
      const cur = timeTint(s, new Date(2026, 10, 19, 0, m));
      // 重ねた ときの 見え方（色 × こさ）と こさが 1分で 少ししか かわらない
      assert.ok(Math.abs(cur.alpha - prev.alpha) <= 0.006, `${s.id} ${m}分 こさ ${prev.alpha} → ${cur.alpha}`);
      const pa = rgb(prev.color).map((c) => c * prev.alpha);
      const ca = rgb(cur.color).map((c) => c * cur.alpha);
      for (let i = 0; i < 3; i += 1) assert.ok(Math.abs(ca[i] - pa[i]) <= 1.5, `${s.id} ${m}分 色 ${prev.color} → ${cur.color}`);
      prev = cur;
    }
  }
});

test('色の まぜ方：はしは もとの 色、こさが 0 の 方の 色へ とばない', () => {
  const a = { color: '#1B2240', alpha: 0.34 };
  const b = { color: '#FFFFFF', alpha: 0 };
  assert.deepEqual(mixTint(a, b, 0), a);
  assert.equal(mixTint(a, b, 0.5).color, '#1B2240');
  assert.equal(mixTint(a, b, 1).alpha, 0);
});

test('いまの 所の ステージ：道ごとに かわり、クリアの あとは 年こしの峠（はつひのでの あとは 夜明け）', () => {
  assert.equal(stagePlaceAt(0).stage.id, 'area1');
  assert.equal(stagePlaceAt(AREA_STEPS - 1).stage.id, 'area1');
  assert.equal(stagePlaceAt(AREA_STEPS).stage.id, 'area2');
  assert.equal(stagePlaceAt(AREA_STEPS * 5 + 10).stage.id, 'area6');
  assert.equal(stagePlaceAt(LAP_STEPS - 1).stage.id, 'area7');
  assert.deepEqual(
    [stagePlaceAt(LAP_STEPS).stage.id, stagePlaceAt(LAP_STEPS).phase],
    ['end', 'night'],
  );
  assert.equal(stagePlaceAt(LAP_STEPS + END_BOSSES[0].steps).phase, 'night');
  assert.deepEqual([stagePlaceAt(LAP_END).stage.id, stagePlaceAt(LAP_END).phase], ['end', 'dawn']);
  assert.equal(stagePlaceAt(0).phase, null);
  // 夜明けは 空と 重ねる 色が かわる
  const end = stageDef('end');
  assert.notDeepEqual(stageSky(end, 'dawn'), stageSky(end, 'night'));
  assert.notDeepEqual(fallbackTintOf(end, 'dawn'), fallbackTintOf(end, 'night'));
  // 年こしの峠：夜は 星空と 鐘の音の 輪、夜明けは 初日の出
  const c = { layout: 'home' as const, time: 'day' as const, weather: 'sunny' as const };
  assert.deepEqual(activeGimmicks(end, { ...c, phase: 'night' }), ['starrySky', 'bellRings']);
  assert.deepEqual(activeGimmicks(end, { ...c, phase: 'dawn' }), ['sunrise']);
});

test('ギミックは 天気と 時間帯で かわる（2は 雨の日に 雨と 水の輪、晴れの日は かえる、夕〜夜は ほたる）', () => {
  const s2 = stageDef('area2');
  const g = (time: TimeOfDay, weather: Weather, layout: StageLayout = 'home') => activeGimmicks(s2, { layout, time, weather, phase: null });
  assert.deepEqual(g('day', 'rain'), ['rain', 'ripples']);
  assert.deepEqual(g('day', 'sunny'), ['frog']);
  assert.deepEqual(g('night', 'sunny'), ['fireflies']);
  assert.deepEqual(g('evening', 'sunny'), ['frog', 'fireflies']);
  // 3：夜だけ 花火。風鈴は ホームの 目じるし
  const s3 = stageDef('area3');
  assert.ok(activeGimmicks(s3, { layout: 'home', time: 'night', weather: 'sunny', phase: null }).includes('fireworks'));
  assert.ok(!activeGimmicks(s3, { layout: 'home', time: 'day', weather: 'sunny', phase: null }).includes('fireworks'));
  assert.ok(!activeGimmicks(s3, { layout: 'walk', time: 'day', weather: 'sunny', phase: null }).includes('windchime'));
  // 6：雪の日だけ 雪。夜は 窓に あかり
  const s6 = stageDef('area6');
  assert.ok(activeGimmicks(s6, { layout: 'home', time: 'day', weather: 'snow', phase: null }).includes('snow'));
  assert.ok(!activeGimmicks(s6, { layout: 'home', time: 'day', weather: 'sunny', phase: null }).includes('snow'));
  assert.ok(activeGimmicks(s6, { layout: 'home', time: 'night', weather: 'sunny', phase: null }).includes('windowLight'));
});

test('7色の 糸：いまの 道・もどった 道・まだの 道', () => {
  const states = (pos: number, lap = 1) => threadDots(pos, lap).map((d) => d.state);
  assert.deepEqual(states(0), ['current', 'faded', 'faded', 'faded', 'faded', 'faded', 'faded']);
  assert.deepEqual(states(AREA_STEPS * 2 + 5), ['restored', 'restored', 'current', 'faded', 'faded', 'faded', 'faded']);
  assert.deepEqual(states(LAP_STEPS), Array(7).fill('restored'));
  assert.deepEqual(states(LAP_END + 100), Array(7).fill('restored'));
  // 2巡り目からは 七色が もどっている
  assert.deepEqual(states(0, 2), ['current', 'restored', 'restored', 'restored', 'restored', 'restored', 'restored']);
  assert.deepEqual(
    threadDots(0, 1).map((d) => d.area),
    [1, 2, 3, 4, 5, 6, 7],
  );
  for (const d of threadDots(0, 1)) assert.match(d.color, HEX);
});
