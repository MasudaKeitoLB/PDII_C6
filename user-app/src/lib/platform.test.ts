// 端末とブラウザの見分けの テスト（npm test）

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectBrowser, detectOs } from './platform.ts';

const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36',
  androidChromeReduced: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/143.0.0.0 Mobile Safari/537.36',
  firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.1 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.1 Safari/605.1.15',
  windowsChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
  // Android で「PC版サイト」にすると Linux の PC と名乗る
  androidDesktopMode: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
};

test('Android の Chrome（userAgentData あり・なし）', () => {
  assert.equal(detectOs({ userAgent: UA.androidChrome, userAgentData: { platform: 'Android' } }), 'android');
  assert.equal(detectOs({ userAgent: UA.androidChromeReduced }), 'android');
  assert.equal(detectBrowser({ userAgent: UA.androidChrome }), 'chrome');
});

test('Samsung Internet・Firefox for Android', () => {
  assert.equal(detectOs({ userAgent: UA.samsung }), 'android');
  assert.equal(detectBrowser({ userAgent: UA.samsung }), 'samsung');
  assert.equal(detectOs({ userAgent: UA.firefoxAndroid }), 'android');
  assert.equal(detectBrowser({ userAgent: UA.firefoxAndroid }), 'firefox');
});

test('iPhone と iPad（iPad は Mac と名乗るが 指で触れる）', () => {
  assert.equal(detectOs({ userAgent: UA.iphone }), 'ios');
  assert.equal(detectBrowser({ userAgent: UA.iphone }), 'safari');
  assert.equal(detectOs({ userAgent: UA.ipad, maxTouchPoints: 5 }), 'ios');
  assert.equal(detectOs({ userAgent: UA.ipad, maxTouchPoints: 0 }), 'other');
});

test('Windows の PC と、PC版サイト表示の Android は other', () => {
  assert.equal(detectOs({ userAgent: UA.windowsChrome, userAgentData: { platform: 'Windows' } }), 'other');
  assert.equal(detectOs({ userAgent: UA.androidDesktopMode }), 'other');
});
