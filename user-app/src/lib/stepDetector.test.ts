// 歩数を数える関数の テスト（npm test）。作った波形を入れて、数えた歩数を たしかめる。

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countSteps, createStepDetector, type MotionSample } from './stepDetector.ts';

const RATE = 60;
const G = 9.8;

/** いつも同じ ゆらぎを出す 乱数（テストの結果を 毎回そろえる） */
function noiseSource(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296 - 0.5;
  };
}

/** 1秒に hz 歩、amp の強さで steps 歩 歩いたときの 値の列 */
function walking({ steps, hz = 2, amp = 3, noise = 0.2, start = 0 }: { steps: number; hz?: number; amp?: number; noise?: number; start?: number }): MotionSample[] {
  const rand = noiseSource(steps * 7 + 3);
  const count = Math.round((steps / hz) * RATE);
  return Array.from({ length: count }, (_, i) => {
    const sec = i / RATE;
    return { t: start + sec * 1000, x: rand() * noise, y: G + amp * Math.sin(2 * Math.PI * hz * sec) + rand() * noise, z: rand() * noise };
  });
}

/** じっとしているとき */
function resting(ms: number, start = 0, noise = 0.3): MotionSample[] {
  const rand = noiseSource(5);
  return Array.from({ length: Math.round((ms / 1000) * RATE) }, (_, i) => ({ t: start + (i * 1000) / RATE, x: rand() * noise, y: G + rand() * noise, z: rand() * noise }));
}

/** 時刻 at に 幅のせまい山を1つ */
function bump(sec: number, at: number, amp: number, widthSec = 0.05) {
  return amp * Math.exp(-(((sec - at) / widthSec) ** 2));
}

test('① じっとしていると 数えない', () => {
  assert.equal(countSteps(resting(5000)), 0);
});

test('② ふつうに 20歩 歩くと 20歩（±1）', () => {
  const n = countSteps(walking({ steps: 20, hz: 2, amp: 3 }));
  assert.ok(Math.abs(n - 20) <= 1, `${n}歩`);
});

test('③ ゆっくり 20歩 歩いても 20歩（±1）', () => {
  const n = countSteps(walking({ steps: 20, hz: 1.2, amp: 1.8 }));
  assert.ok(Math.abs(n - 20) <= 1, `${n}歩`);
});

test('④ 手で 2回 ゆらしただけでは 数えない', () => {
  const samples = Array.from({ length: RATE * 3 }, (_, i) => {
    const sec = i / RATE;
    return { t: sec * 1000, x: 0, y: G + bump(sec, 0.5, 6, 0.08) + bump(sec, 1.0, 6, 0.08), z: 0 };
  });
  assert.equal(countSteps(samples), 0);
});

test('⑤ 3歩 → 3秒 休む → 3歩 は 数えない（つづいていない）', () => {
  const a = walking({ steps: 3 });
  const rest = resting(3000, a[a.length - 1].t + 1000 / RATE);
  const b = walking({ steps: 3, start: rest[rest.length - 1].t + 1000 / RATE });
  assert.equal(countSteps([...a, ...rest, ...b]), 0);
});

test('⑥ 4歩 つづいたところで まとめて 4、そのあとは 1ずつ', () => {
  const detector = createStepDetector();
  const added = walking({ steps: 10 }).map((s) => detector.push(s)).filter((n) => n > 0);
  assert.equal(added[0], 4);
  assert.ok(added.slice(1).every((n) => n === 1));
});

test('⑦ 1歩の中に 山が2つあっても 1歩', () => {
  const samples = Array.from({ length: RATE * 10 }, (_, i) => {
    const sec = i / RATE;
    const phase = sec % 1;
    return { t: sec * 1000, x: 0, y: G + bump(phase, 0.3, 3) + bump(phase, 0.4, 3), z: 0 };
  });
  const n = countSteps(samples);
  assert.ok(Math.abs(n - 10) <= 1, `${n}歩`);
});

test('⑧ 数でない値が来ても こわれない', () => {
  const detector = createStepDetector();
  assert.equal(detector.push({ t: 0, x: Number.NaN, y: G, z: 0 }), 0);
  assert.equal(detector.push({ t: 16, x: 0, y: Number.POSITIVE_INFINITY, z: 0 }), 0);
});

test('⑨ 値が 1.5秒 来なかったら はじめから', () => {
  const detector = createStepDetector();
  const samples = walking({ steps: 6 });
  samples.forEach((s) => detector.push(s));
  assert.ok(detector.inspect().streak >= 4);
  detector.push({ t: samples[samples.length - 1].t + 1500, x: 0, y: G, z: 0 });
  assert.equal(detector.inspect().streak, 0);
});

test('⑪ 時間が もどったら はじめから', () => {
  const detector = createStepDetector();
  const samples = walking({ steps: 6 });
  samples.forEach((s) => detector.push(s));
  assert.ok(detector.inspect().streak >= 4);
  detector.push({ t: samples[samples.length - 1].t - 500, x: 0, y: G, z: 0 });
  assert.equal(detector.inspect().streak, 0);
});

test('⑫ 立ち止まって（値は届いたまま）また歩くと、もう一度 4歩 つづいてから 足す', () => {
  const detector = createStepDetector();
  const first = walking({ steps: 8 });
  const rest = resting(3000, first[first.length - 1].t + 1000 / RATE);
  const again = walking({ steps: 8, start: rest[rest.length - 1].t + 1000 / RATE });
  first.forEach((s) => detector.push(s));
  rest.forEach((s) => detector.push(s));
  const added = again.map((s) => detector.push(s)).filter((n) => n > 0);
  assert.equal(added[0], 4);
  assert.ok(Math.abs(added.reduce((a, b) => a + b, 0) - 8) <= 1);
});

test('⑩ しきい値を上げると 小さな ゆれは 数えない', () => {
  const small = walking({ steps: 20, hz: 2, amp: 1.6 });
  assert.ok(countSteps(small) >= 19);
  assert.equal(countSteps(small, { threshold: 2 }), 0);
});
