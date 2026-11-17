// この端末だけの 設定（音・歩いている間の音・動きを へらす）。
// 利用者の記録（AppUser）には 入れず、端末に 保存する。ログインする人が かわっても 同じ設定を 使う。
// このファイルは 単体テスト（node --test）で そのまま動かすので、React を入れない。

import { readJson, writeJson } from './storage.ts';

export interface Preferences {
  /** 音（止まって 画面を 見ている ときの 音・ボタンの 音） */
  sound: boolean;
  /** 歩いている 間の 音（敵を たおした 時の 小さな 鈴）。はじめは 切 */
  walkSound: boolean;
  /** 動きを へらす（動く 演出を やめて、絵と 文を ぱっと 出す） */
  reduceMotion: boolean;
}

export type PreferenceKey = keyof Preferences;

export const PREFERENCES_KEY = 'hoho.preferences';

/** はじめの 設定。音は 入（音量は 小さめ）、歩いている 間の 音は 切 */
export const DEFAULT_PREFERENCES: Preferences = { sound: true, walkSound: false, reduceMotion: false };

/** 保存した 値を 直す（こわれた 値・足りない 項目は はじめの 値） */
export function normalizePreferences(raw: unknown): Preferences {
  const p = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const flag = (key: PreferenceKey) => (typeof p[key] === 'boolean' ? (p[key] as boolean) : DEFAULT_PREFERENCES[key]);
  return { sound: flag('sound'), walkSound: flag('walkSound'), reduceMotion: flag('reduceMotion') };
}

let current: Preferences | null = null;
const listeners = new Set<() => void>();

/** いまの 設定（はじめて 読む ときだけ 端末から 読む） */
export function getPreferences(): Preferences {
  if (!current) current = normalizePreferences(readJson<unknown>(PREFERENCES_KEY, null));
  return current;
}

/** 設定を 1つ かえて 保存する。かわったら 購読している 所に 知らせる */
export function setPreference(key: PreferenceKey, value: boolean): void {
  const prev = getPreferences();
  if (prev[key] === value) return;
  current = { ...prev, [key]: value };
  writeJson(PREFERENCES_KEY, current);
  for (const fn of listeners) fn();
}

/** 入・切を 入れかえる */
export function togglePreference(key: PreferenceKey): void {
  setPreference(key, !getPreferences()[key]);
}

/** 設定が かわったら fn を 呼ぶ。もどり値を 呼ぶと やめる */
export function subscribePreferences(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** テスト用：覚えている 設定を 捨てて、次は 端末から 読みなおす */
export function resetPreferencesCache(): void {
  current = null;
}

/** 画面に 出す 言い方 */
export function onOffLabel(value: boolean): string {
  return value ? '入' : '切';
}
