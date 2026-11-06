// スマホの 体の動き（加速度）を 受けとる（M-03）。
// 試作は Web アプリなので、ブラウザの devicemotion を使う。届くのは 画面を開いている間だけ（11/6決定）。

import type { MotionSample } from './stepDetector';

export function motionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/** 値が届くたびに onSample を呼ぶ。もどり値を呼ぶと やめる */
export function listenMotion(onSample: (sample: MotionSample) => void): () => void {
  if (!motionSupported()) return () => {};
  const handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    // 起動した直後などに 値の入っていないものが届くので 捨てる
    if (!a || a.x === null || a.y === null || a.z === null) return;
    onSample({ t: e.timeStamp, x: a.x, y: a.y, z: a.z });
  };
  window.addEventListener('devicemotion', handler);
  return () => window.removeEventListener('devicemotion', handler);
}
