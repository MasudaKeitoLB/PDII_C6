// 体の動きの値が 届いているかを見張る部分の テスト（npm test）

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSignalWatcher, type MotionSignal } from './motion.ts';

function watch() {
  const seen: MotionSignal[] = [];
  const watcher = createSignalWatcher({ silentAfterMs: 3000, onSignal: (s) => seen.push(s) });
  watcher.start(0);
  return { watcher, seen };
}

test('3秒 値が来なければ「届かない」、来たら「届いている」', () => {
  const { watcher, seen } = watch();
  watcher.tick(2000);
  assert.deepEqual(seen, []);
  watcher.tick(3000);
  assert.deepEqual(seen, ['silent']);
  watcher.sample(true, 3100);
  assert.deepEqual(seen, ['silent', 'receiving']);
});

test('中身のない値（センサーを止めているとき）だけでは「届いている」にしない', () => {
  const { watcher, seen } = watch();
  watcher.sample(false, 100);
  watcher.tick(3000);
  assert.deepEqual(seen, ['silent']);
});

test('同じ状態は 二度 知らせない。届いたあと 3秒 とぎれたら「届かない」', () => {
  const { watcher, seen } = watch();
  watcher.sample(true, 100);
  watcher.sample(true, 116);
  watcher.tick(1000);
  watcher.tick(3115);
  assert.deepEqual(seen, ['receiving']);
  watcher.tick(3116);
  watcher.tick(4000);
  assert.deepEqual(seen, ['receiving', 'silent']);
});
