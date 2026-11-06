// 許可の 調べなおしの テスト（npm test）。ブラウザの外（センサーの無い所）で 動かす

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recheckMotionAccess } from './permissions.ts';

test('はじめの調べ（checking）の途中は 調べなおさない（その結果を 捨てないため）', () => {
  assert.equal(recheckMotionAccess('checking'), null);
});

test('許可を求める しくみが無い所では 調べなおす（センサーが無いので unsupported）', async () => {
  const pending = recheckMotionAccess('granted');
  assert.ok(pending);
  assert.equal(await pending, 'unsupported');
});
