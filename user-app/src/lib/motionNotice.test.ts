// ホームの「歩数を数える準備」の案内を どれにするかの テスト（npm test）

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { motionNoticeKind } from './motionNotice.ts';

test('数えられる人には 何も出さない（N-06）', () => {
  assert.equal(motionNoticeKind('granted', 'receiving', true), null);
  assert.equal(motionNoticeKind('granted', 'unknown', true), null);
  assert.equal(motionNoticeKind('checking', 'unknown', true), null);
});

test('iPhone で まだ許可していない：画面の広さに かかわらず ボタンを出す', () => {
  assert.equal(motionNoticeKind('needs-button', 'unknown', true), 'needs-button');
  assert.equal(motionNoticeKind('needs-button', 'unknown', false), 'needs-button');
});

test('許可されていない：どの画面でも 出す', () => {
  assert.equal(motionNoticeKind('denied', 'unknown', true), 'blocked');
  assert.equal(motionNoticeKind('denied', 'unknown', false), 'blocked');
});

test('数えられないブラウザ・値が届かない：スマホのときだけ 出す（PC のデモには センサーが無い）', () => {
  assert.equal(motionNoticeKind('unsupported', 'unknown', true), 'blocked');
  assert.equal(motionNoticeKind('unsupported', 'unknown', false), null);
  assert.equal(motionNoticeKind('granted', 'silent', true), 'silent');
  assert.equal(motionNoticeKind('granted', 'silent', false), null);
});
