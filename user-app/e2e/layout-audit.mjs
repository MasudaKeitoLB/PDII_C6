// 配置の検査：全画面を 393×852（PC版は 1440×1024）で開き、
// 左右の余白が そろっていない箱・画面からはみ出す箱を一覧にして、スクリーンショットを残す。
// 使い方：開発サーバーを起動したまま `node e2e/layout-audit.mjs [出力フォルダ]`（ONLY=home,me で しぼる）

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://localhost:5173/';
const OUT = process.argv[2] || 'layout-audit';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
mkdirSync(OUT, { recursive: true });

// ふだんの Windows の Chrome と同じく、スクロールバーが幅をとる状態で調べる（Playwright は 既定で かくす）
const browser = await chromium.launch({ channel: process.env.E2E_CHANNEL || 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.goto(BASE);
await page.waitForSelector('aside');

const store = (body) =>
  page.evaluate(async (b) => {
    const s = await import('/src/lib/store.ts');
    return new Function('s', b)(s);
  }, body);
const go = async (id) => {
  await page.evaluate((h) => (location.hash = h), id);
  await page.waitForTimeout(350);
};

const NEW_USER = `s.resetAll(); s.registerAppUser({ name: '新井 一郎', birthday: { year: 1950, month: 4, day: 1 }, letter: 'A', nickname: 'いちろう', gender: 'male', heightCm: 165, weightKg: 60, dailyGoalSteps: 5000 }, true);`;
const SAMPLE = `s.resetAll(); s.loginAs('s-yamada');`;
const SIZE = (size) => `s.setTextSize(s.getStore().sessionUserId, '${size}');`;
const ADMIN = (id) => `s.setAdminSession('${id}');`;

/** 調べる場面：[名前, 準備, 画面] */
const CASES = [];
const userRoutes = ['home', 'records', 'records-month', 'me', 'me-goal', 'me-text-size', 'me-share', 'me-share-stop', 'me-profile', 'me-profile-name', 'me-profile-nickname', 'me-profile-height', 'me-profile-weight'];
for (const r of ['start', 'register-name', 'register-birthday', 'register-letter', 'register-nickname', 'register-gender', 'register-height', 'register-weight', 'register-goal', 'register-share', 'register-permission', 'register-ready', 'login-name', 'login-birthday', 'login-letter'])
  CASES.push([`guest-${r}`, `s.resetAll();`, r]);
for (const r of userRoutes) CASES.push([`sample-${r}`, SAMPLE, r]);
for (const r of userRoutes) CASES.push([`new-${r}`, NEW_USER, r]);
for (const size of ['large', 'xlarge']) for (const r of ['home', 'records', 'me', 'me-text-size']) CASES.push([`sample-${size}-${r}`, SAMPLE + SIZE(size), r]);
for (const size of ['large', 'xlarge']) CASES.push([`new-${size}-home`, NEW_USER + SIZE(size), 'home']);
CASES.push(['sample-walk-result', SAMPLE + `s.recordSteps('s-yamada', 2345);`, 'adventure-result']);
CASES.push(['sample-level-up', SAMPLE + `s.recordSteps('s-yamada', 2345);`, 'level-up']);
CASES.push(['new-walk-result', NEW_USER + `s.recordSteps(s.getStore().sessionUserId, 1600);`, 'adventure-result']);
for (const r of ['admin-login', 'admin-pc-login']) CASES.push([`guest-${r}`, `s.resetAll(); s.setAdminSession(null);`, r]);
for (const r of ['admin-list', 'admin-user']) CASES.push([`cm-${r}`, SAMPLE + ADMIN('cm-sato-0412'), r]);
for (const r of ['admin-pc-list', 'admin-pc-user']) CASES.push([`staff-${r}`, SAMPLE + ADMIN('temari-tamura01'), r]);

for (const [name, prep, route] of CASES) {
  if (ONLY && !ONLY.some((o) => name.includes(o))) continue;
  await go('start');
  await store(prep);
  if (route === 'admin-user' || route === 'admin-pc-user') {
    // 測定結果は 一覧から開く
    await go(route.replace('-user', '-list'));
    const card = route.includes('pc') ? page.getByRole('link', { name: '山田 花子', exact: true }) : page.getByRole('button', { name: /^山田 花子 79歳/ });
    await card.click();
    await page.waitForTimeout(350);
  } else {
    await go(route);
  }
  const frame = page.locator('[data-frame]').first();
  await frame.screenshot({ path: `${OUT}/${name}.png` });
  const found = await page.evaluate(() => {
    const frame = document.querySelector('[data-frame]');
    const f = frame.getBoundingClientRect();
    const out = [];
    const label = (e) => {
      const raw = typeof e.className === 'string' ? e.className : e.getAttribute('class') || '';
      const cls = raw.replace(/_([a-zA-Z0-9]+)_[a-z0-9]+_\d+/g, '$1').split(' ').filter(Boolean).join('.');
      const t = (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24);
      return `${e.tagName.toLowerCase()}.${cls} "${t}"`;
    };
    const isBoxed = (e, cs) =>
      (cs.borderLeftStyle !== 'none' && cs.borderLeftWidth !== '0px') ||
      (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
      cs.boxShadow !== 'none' ||
      ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName);
    for (const e of frame.querySelectorAll('*')) {
      const bar = e.offsetWidth - e.clientWidth - (parseFloat(getComputedStyle(e).borderLeftWidth) || 0) - (parseFloat(getComputedStyle(e).borderRightWidth) || 0);
      if (bar > 0.5 && e.scrollHeight > e.clientHeight) out.push({ kind: 'scrollbar', el: label(e), width: +bar.toFixed(1) });
      const r = e.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      if (e.closest('[aria-hidden="true"]')) continue;
      if (!isBoxed(e, cs)) continue;
      // 画面からはみ出す
      const left = r.left - f.left;
      const right = f.right - r.right;
      if ((left < -0.5 || right < -0.5) && !(left <= 0.5 && right <= 0.5)) {
        out.push({ kind: 'overflow', el: label(e), left: +left.toFixed(1), right: +right.toFixed(1) });
      }
      // 画面に対する 左右の余白の差（はば広の箱だけ）
      if (left > 0.5 && right > 0.5 && left < 80 && right < 80 && Math.abs(left - right) > 1.5 && r.width > f.width * 0.5) {
        out.push({ kind: 'asym-screen', el: label(e), left: +left.toFixed(1), right: +right.toFixed(1) });
      }
      // 親の箱に対する 左右の余白の差
      let parent = e.parentElement;
      while (parent && parent !== frame && !isBoxed(parent, getComputedStyle(parent))) parent = parent.parentElement;
      if (!parent || parent === frame) continue;
      const p = parent.getBoundingClientRect();
      const pl = r.left - p.left;
      const pr = p.right - r.right;
      if (pl < -0.5 || pr < -0.5) {
        out.push({ kind: 'out-of-box', el: label(e), in: label(parent), left: +pl.toFixed(1), right: +pr.toFixed(1) });
      } else if (pl < 60 && pr < 60 && Math.abs(pl - pr) > 1.5 && r.width > p.width * 0.5) {
        out.push({ kind: 'asym-box', el: label(e), in: label(parent), left: +pl.toFixed(1), right: +pr.toFixed(1) });
      }
    }
    return out;
  });
  console.log(`## ${name} (${route})${found.length ? '' : '  -- ok'}`);
  for (const x of found) console.log('   ', JSON.stringify(x));
}
await browser.close();
