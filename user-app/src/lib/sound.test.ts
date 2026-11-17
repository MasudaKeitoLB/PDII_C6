// 演出の 音の 決まりの テスト（npm test）。音は 鳴らさず、音の 並び（データ）だけを 確かめる

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ATTACK_SEC,
  MAX_FREQ,
  MAX_NOTE_GAIN,
  MAX_NOTE_SEC,
  MAX_SOUND_SEC,
  MAX_TOTAL_GAIN,
  MAX_VOICES,
  MIN_ATTACK_SEC,
  MIN_FREQ,
  MIN_NOTE_SEC,
  MIN_TAIKO_FREQ,
  SCALE,
  SOUNDS,
  SUZU_DETUNE,
  TAIKO_DROP,
  notesAt,
  playSound,
  playSounds,
  resultSounds,
  soundLength,
  type SoundName,
} from './sound.ts';

const NAMES = Object.keys(SOUNDS) as SoundName[];

/** 音の 鳴りはじめと おわりの 時刻（ここで 同時に 鳴る 数・音量が かわる） */
const edges = (name: SoundName) => SOUNDS[name].flatMap((n) => [n.at, n.at + n.dur - 1e-9]);

test('場面は 8つ そろっている', () => {
  assert.deepEqual(NAMES.sort(), ['areaClear', 'bossDefeat', 'bossMeet', 'defeat', 'levelUp', 'rare', 'tap', 'walkBell']);
  for (const name of NAMES) assert.ok(SOUNDS[name].length > 0, name);
});

test('大きすぎない：1つの 音も、同時に 鳴る 音の 合計も 上限まで', () => {
  for (const name of NAMES) {
    for (const note of SOUNDS[name]) {
      assert.ok(note.gain > 0 && note.gain <= MAX_NOTE_GAIN, `${name} の 音量 ${note.gain}`);
    }
    for (const t of edges(name)) {
      const sum = notesAt(SOUNDS[name], t).reduce((a, n) => a + n.gain, 0);
      assert.ok(sum <= MAX_TOTAL_GAIN + 1e-9, `${name} の ${t}秒で 合計 ${sum}`);
    }
  }
  assert.ok(MAX_TOTAL_GAIN <= 0.3);
});

test('長すぎない：1つの 音は 0.1〜1.5秒、1つの 場面は 2.5秒まで', () => {
  for (const name of NAMES) {
    for (const note of SOUNDS[name]) {
      assert.ok(note.dur >= MIN_NOTE_SEC && note.dur <= MAX_NOTE_SEC, `${name} の 長さ ${note.dur}`);
      assert.ok(note.at >= 0, `${name} の 鳴りはじめ`);
    }
    assert.ok(soundLength(name) <= MAX_SOUND_SEC, `${name} は ${soundLength(name)}秒`);
  }
});

test('高すぎない・低すぎない：主な 音は 200〜1,500Hz、太鼓だけ 低め（90Hz より 上）', () => {
  for (const name of NAMES) {
    for (const note of SOUNDS[name]) {
      if (note.timbre === 'taiko') {
        // 太鼓は 高さを 下げるので、下げた 先も 低すぎない
        assert.ok(note.freq * TAIKO_DROP >= MIN_TAIKO_FREQ && note.freq < MIN_FREQ, `${name} の 太鼓 ${note.freq}Hz`);
      } else {
        const top = note.timbre === 'suzu' ? note.freq * SUZU_DETUNE : note.freq;
        assert.ok(note.freq >= MIN_FREQ && top <= MAX_FREQ, `${name} の ${note.freq}Hz`);
      }
    }
  }
});

test('にごらない：太鼓の ほかは ヨナ抜きの 音階の 音だけ', () => {
  for (const name of NAMES) {
    for (const note of SOUNDS[name]) {
      if (note.timbre !== 'taiko') assert.ok(SCALE.includes(note.freq), `${name} の ${note.freq}Hz は 音階の 外`);
    }
  }
});

test('同時に 鳴るのは 2音まで', () => {
  for (const name of NAMES) {
    for (const t of edges(name)) {
      assert.ok(notesAt(SOUNDS[name], t).length <= MAX_VOICES, `${name} の ${t}秒`);
    }
  }
});

test('急に 鳴らさない：どの 音色も 少し かけて 立ち上げる', () => {
  for (const [timbre, sec] of Object.entries(ATTACK_SEC)) {
    assert.ok(sec >= MIN_ATTACK_SEC, `${timbre} の 立ち上がり ${sec}秒`);
  }
});

test('ボタンと 歩いている 間の 鈴は ほかより 小さい・短い', () => {
  const loudest = (name: SoundName) => Math.max(...SOUNDS[name].map((n) => n.gain));
  for (const quiet of ['tap', 'walkBell'] as const) {
    for (const name of ['defeat', 'levelUp', 'rare'] as const) assert.ok(loudest(quiet) < loudest(name), `${quiet} と ${name}`);
  }
  assert.equal(SOUNDS.walkBell.length, 1);
  assert.equal(SOUNDS.walkBell[0].timbre, 'suzu');
  assert.ok(soundLength('tap') <= 0.2);
});

test('成果の 音：中身に 合わせて 2つまで 選ぶ', () => {
  const base = { defeated: 0, bossDefeated: false, areaCleared: false, rare: false, bossAhead: false };
  assert.deepEqual(resultSounds(base), []);
  assert.deepEqual(resultSounds({ ...base, defeated: 3 }), ['defeat']);
  assert.deepEqual(resultSounds({ ...base, defeated: 3, rare: true }), ['rare']);
  assert.deepEqual(resultSounds({ ...base, defeated: 3, bossAhead: true }), ['defeat', 'bossMeet']);
  assert.deepEqual(resultSounds({ ...base, defeated: 5, bossDefeated: true, areaCleared: true }), ['bossDefeat', 'areaClear']);
  assert.deepEqual(resultSounds({ ...base, defeated: 5, bossDefeated: true, rare: true }), ['bossDefeat', 'rare']);
  assert.deepEqual(resultSounds({ ...base, bossAhead: true }), ['bossMeet']);
  for (const r of [
    { ...base, defeated: 9, bossDefeated: true, areaCleared: true, rare: true, bossAhead: true },
    { ...base, defeated: 1, rare: true, bossAhead: true },
  ]) {
    assert.ok(resultSounds(r).length <= 2);
  }
});

test('音を 出せない 環境（ブラウザの外）では 何もしない：例外を 出さない', () => {
  for (const name of NAMES) assert.doesNotThrow(() => playSound(name));
  assert.doesNotThrow(() => playSounds(['defeat', 'areaClear'])());
});
