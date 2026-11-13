// スマホの 体の動き（加速度）を 受けとる（M-03）。
// 試作は Web アプリなので、ブラウザの devicemotion を使う。届くのは 画面を開いている間だけ（11/6決定）。
//
// Android の Chrome で「モーション センサー」を止めていると、エラーにならず 値の入っていないものが1回届くだけになる。
// そのため 値が届いているか（MotionSignal）も 見張る（Android版）。

import type { MotionSample } from './stepDetector';

/** unknown：まだ分からない／receiving：値が届いている／silent：しばらく 値が届かない */
export type MotionSignal = 'unknown' | 'receiving' | 'silent';

/** これだけ 値が届かなければ「届かない」とみなす（試作で決めた案） */
export const MOTION_SILENT_MS = 3000;

export function motionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/**
 * 値が届いているかを見張る（ブラウザに頼らない部分。テストで そのまま確かめられる）。
 * 状態が かわったときだけ onSignal を呼ぶ
 */
export function createSignalWatcher({ silentAfterMs = MOTION_SILENT_MS, onSignal }: { silentAfterMs?: number; onSignal: (signal: MotionSignal) => void }) {
  let signal: MotionSignal = 'unknown';
  let startedAt: number | null = null;
  let lastValidAt: number | null = null;
  const set = (next: MotionSignal) => {
    if (next === signal) return;
    signal = next;
    onSignal(next);
  };
  return {
    start(now: number) {
      startedAt = now;
      lastValidAt = null;
    },
    /** 値が1つ届いた（valid：中身が入っているか） */
    sample(valid: boolean, now: number) {
      if (!valid) return;
      lastValidAt = now;
      set('receiving');
    },
    /** 1秒ごとに呼ぶ */
    tick(now: number) {
      const since = lastValidAt ?? startedAt;
      if (since !== null && now - since >= silentAfterMs) set('silent');
    },
    current: () => signal,
  };
}

export interface ListenOptions {
  /** 値が届いているかが かわったとき */
  onSignal?: (signal: MotionSignal) => void;
  /** 値が1つ届くたび（確かめる画面で 回数と間隔を出すため） */
  onEvent?: (info: { interval: number | null; valid: boolean }) => void;
}

/** 値が届くたびに onSample を呼ぶ。もどり値を呼ぶと やめる */
export function listenMotion(onSample: (sample: MotionSample) => void, options: ListenOptions = {}): () => void {
  const watcher = createSignalWatcher({ onSignal: (s) => options.onSignal?.(s) });
  watcher.start(performance.now());
  if (!motionSupported()) {
    // このブラウザでは 値が来ないので、見張りだけ動かす（しばらくして silent になる）
    const timer = window.setInterval(() => watcher.tick(performance.now()), 1000);
    return () => window.clearInterval(timer);
  }
  const handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    // 起動した直後や、Android で センサーを止めているときに 値の入っていないものが届くので 捨てる
    const valid = !!a && a.x !== null && a.y !== null && a.z !== null;
    watcher.sample(valid, performance.now());
    options.onEvent?.({ interval: Number.isFinite(e.interval) ? e.interval : null, valid });
    if (valid && a) onSample({ t: e.timeStamp, x: a.x as number, y: a.y as number, z: a.z as number });
  };
  window.addEventListener('devicemotion', handler);
  const timer = window.setInterval(() => watcher.tick(performance.now()), 1000);
  return () => {
    window.removeEventListener('devicemotion', handler);
    window.clearInterval(timer);
  };
}
