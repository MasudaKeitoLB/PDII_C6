// この端末だけの 設定（音・歩いている間の音・動きを へらす）の テスト（npm test）

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  getPreferences,
  normalizePreferences,
  onOffLabel,
  resetPreferencesCache,
  setPreference,
  subscribePreferences,
  togglePreference,
} from './preferences.ts';
import { readJson, removeKey, writeJson } from './storage.ts';

const fresh = () => {
  removeKey(PREFERENCES_KEY);
  resetPreferencesCache();
};

test('はじめは 音が 入、歩いている 間の 音は 切、動きを へらすは 切', () => {
  fresh();
  assert.deepEqual(getPreferences(), { sound: true, walkSound: false, reduceMotion: false });
  assert.deepEqual(DEFAULT_PREFERENCES, { sound: true, walkSound: false, reduceMotion: false });
});

test('こわれた 値・足りない 項目は はじめの 値に 直す', () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
  assert.deepEqual(normalizePreferences('切'), DEFAULT_PREFERENCES);
  assert.deepEqual(normalizePreferences({ sound: 'no', walkSound: 1 }), DEFAULT_PREFERENCES);
  assert.deepEqual(normalizePreferences({ sound: false }), { ...DEFAULT_PREFERENCES, sound: false });
  assert.deepEqual(normalizePreferences({ reduceMotion: true, extra: 1 }), { ...DEFAULT_PREFERENCES, reduceMotion: true });
});

test('かえると 端末に 保存され、読みなおしても のこる', () => {
  fresh();
  setPreference('sound', false);
  togglePreference('walkSound');
  togglePreference('reduceMotion');
  assert.deepEqual(readJson(PREFERENCES_KEY, null), { sound: false, walkSound: true, reduceMotion: true });
  resetPreferencesCache();
  assert.deepEqual(getPreferences(), { sound: false, walkSound: true, reduceMotion: true });
  togglePreference('reduceMotion');
  assert.equal(getPreferences().reduceMotion, false);
});

test('保存してあった 値を 読む', () => {
  writeJson(PREFERENCES_KEY, { sound: false, walkSound: false, reduceMotion: true });
  resetPreferencesCache();
  assert.deepEqual(getPreferences(), { sound: false, walkSound: false, reduceMotion: true });
});

test('購読：かわった ときだけ 知らせ、やめたら 知らせない', () => {
  fresh();
  let calls = 0;
  const stop = subscribePreferences(() => {
    calls += 1;
  });
  setPreference('sound', true); // 同じ 値なので 知らせない
  assert.equal(calls, 0);
  setPreference('sound', false);
  assert.equal(calls, 1);
  stop();
  setPreference('sound', true);
  assert.equal(calls, 1);
});

test('画面の 言い方は 入・切', () => {
  assert.equal(onOffLabel(true), '入');
  assert.equal(onOffLabel(false), '切');
});
