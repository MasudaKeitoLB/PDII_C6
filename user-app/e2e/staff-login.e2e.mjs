// Supabaseへの通信だけを差し替え、実画面の分岐を検証する。
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

process.env.VITE_SUPABASE_URL = 'https://login-test.invalid';
process.env.VITE_SUPABASE_ANON_KEY = 'test-public-key';
const server = await createServer({ server: { host: '127.0.0.1', port: 5187, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let fail = false;
  await page.route('https://login-test.invalid/**', async route => {
    const args = route.request().postDataJSON();
    const exists = route.request().url().endsWith('hoho_staff_exists');
    const result = exists ? args.p_name === '管理者テスト' :
      args.p_password === 'correct-test-password' ? {
        id: 'test-admin', name: '管理者テスト', role: 'staff', organization: 'テスト施設', facilityId: '',
      } : null;
    await route.fulfill({ status: fail ? 503 : 200, contentType: 'application/json', body: JSON.stringify(result) });
  });
  const go = async () => { await page.goto('http://127.0.0.1:5187/#login-name'); };
  const next = async name => {
    await page.locator('#login-name').fill(name);
    await page.getByRole('button', { name: 'つぎへ', exact: true }).click();
  };
  await go();
  await next('利用者テスト');
  await page.waitForURL('**/#login-birthday');
  await go();
  fail = true;
  await next('管理者テスト');
  await page.getByText('認証サービスに接続できません。Supabaseの設定を確認してください。').waitFor();
  assert.equal(new URL(page.url()).hash, '#login-name');
  fail = false;
  await next('管理者テスト');
  await page.waitForURL('**/#admin-login');
  assert.equal(await page.locator('#admin-phone-id').inputValue(), '管理者テスト');
  await page.locator('#admin-phone-password').fill('wrong');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.getByText('アカウントIDか パスワードが ちがいます').waitFor();
  assert.equal(new URL(page.url()).hash, '#admin-login');
  await page.locator('#admin-phone-password').fill('correct-test-password');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.waitForURL('**/#admin-list');
  await page.reload();
  await page.locator('#admin-phone-password').waitFor();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  assert.ok(!saved.includes('correct-test-password'));
  assert.deepEqual(errors, []);
  console.log('PASS: 利用者分岐・通信失敗・管理者分岐・誤パスワード・認証成功・再読込時の保護・パスワード非保存');
} finally {
  await browser?.close();
  await server.close();
}
