// 全ボタンの動作テスト：画面を実際に押して、押したとおりに動くかを確かめる。
// 使い方：開発サーバー（npm run dev）を起動したまま `npm run e2e`。別のアドレスは BASE=http://…/ で指定。
// ブラウザは入っている Chrome を使う（E2E_CHANNEL=msedge で Edge）。

import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://localhost:5173/';
const CHANNEL = process.env.E2E_CHANNEL || 'chrome';
const TIMEOUT = 8000;

const browser = await chromium.launch({ channel: CHANNEL });
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
page.setDefaultTimeout(TIMEOUT);

const results = [];
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') problems.push(`console.${m.type()}: ${m.text()} ${m.location().url ?? ''}`);
});

// ---- 道具 ----
const hash = () => page.evaluate(() => location.hash.replace(/^#/, ''));
const go = async (id) => {
  await page.evaluate((h) => (location.hash = h), id);
  await page.waitForFunction((h) => location.hash === `#${h}`, id);
};
const btn = (name) => page.getByRole('button', { name, exact: true });
const btnLike = (name) => page.getByRole('button', { name });
const dialog = (name) => page.getByRole('dialog', { name });
const reset = async () => {
  await btn('データを はじめの状態に もどす').click();
  await waitHash('start');
};
const waitHash = (id) => page.waitForFunction((h) => location.hash === `#${h}`, id);
const enterSample = async () => {
  await page.getByRole('button', { name: /^サンプルの利用者/ }).click();
  await waitHash('home');
};
const enterAdmin = async (account, pc) => {
  await page.locator('aside li', { hasText: account }).getByRole('button', { name: pc ? 'PC版で入る' : 'スマホ版で入る' }).click();
  await waitHash(pc ? 'admin-pc-list' : 'admin-list');
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const visible = async (locator, msg) => {
  await locator.first().waitFor({ state: 'visible' }).catch(() => {
    throw new Error(`見つからない：${msg}`);
  });
};
const test = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  OK  ${name}`);
  } catch (e) {
    results.push({ name, ok: false, why: String(e.message || e).split('\n')[0] });
    console.log(`  NG  ${name}\n      ${String(e.message || e).split('\n')[0]}`);
  }
};
const checked = async (name) => {
  await page.getByRole('radio', { name }).and(page.locator('[aria-checked=true]')).waitFor({ state: 'visible' }).catch(() => {
    throw new Error(`${name} が選ばれていない`);
  });
};

await page.goto(BASE);
await page.waitForSelector('aside');

// ---- 利用者アプリ ----
console.log('利用者アプリ');

await test('01 はじめの画面：「はじめて使う」で登録へ、「前に使ったことがある」でログインへ', async () => {
  await reset();
  await btn('はじめて使う').click();
  await waitHash('register-name');
  await go('start');
  await btn('前に使ったことがある').click();
  await waitHash('login-name');
});

await test('02 サンプルの利用者で入ると、山田 花子さんのホームが開く', async () => {
  await reset();
  await enterSample();
  await visible(page.locator('aside').getByText('山田 花子さん（レベル12・今日 3,210歩）'), 'いまの状態の表示');
});

await test('03 下のタブ：記録・わたし・冒険を行き来できる', async () => {
  await btn('記録').click();
  await waitHash('records');
  await btn('わたし').click();
  await waitHash('me');
  await btn('冒険').click();
  await waitHash('home');
});

await test('04 記録：「1か月」と「1週間」を切りかえると選びが移る', async () => {
  await btn('記録').click();
  await waitHash('records');
  await page.getByRole('radio', { name: '1か月' }).click();
  await waitHash('records-month');
  await checked('1か月');
  await page.getByRole('radio', { name: '1週間' }).click();
  await waitHash('records');
  await checked('1週間');
});

await test('05 記録：「戻る」で記録の画面を出る', async () => {
  await btn('戻る').click();
  await page.waitForFunction(() => !/^#records/.test(location.hash));
});

await test('06 わたし：4つの行がそれぞれの画面へ進む', async () => {
  await go('me');
  await btnLike(/^1日の目標歩数/).click();
  await waitHash('me-goal');
  await go('me');
  await btnLike(/文字の大きさ/).click();
  await waitHash('me-text-size');
  await go('me');
  await btnLike(/^記録を見せる相手/).click();
  await waitHash('me-share');
  await go('me');
  await btn('お名前・身長・体重').click();
  await waitHash('me-profile');
});

await test('07 目標歩数：＋500歩で 5,500歩になり、「この目標にする」で わたしの行に出る', async () => {
  await reset();
  await enterSample();
  await go('me-goal');
  await btn('＋ 500歩').click();
  await btn('この目標にする').click();
  await waitHash('me');
  await visible(btnLike(/^1日の目標歩数.*5,500歩/), '1日の目標歩数 5,500歩の行');
});

await test('08 目標歩数：－500歩で 下がる', async () => {
  await go('me-goal');
  await btn('－ 500歩').click();
  await btn('－ 500歩').click();
  await btn('この目標にする').click();
  await waitHash('me');
  await visible(btnLike(/^1日の目標歩数.*4,500歩/), '1日の目標歩数 4,500歩の行');
});

await test('09 文字の大きさ：「とても大きい」を選んで決めると わたしの行に出て、ホームも崩れない', async () => {
  await go('me-text-size');
  await page.getByRole('radio', { name: /^とても大きい/ }).click();
  assert((await page.getByRole('radio', { name: /^とても大きい/ }).getAttribute('aria-checked')) === 'true', '選びが移っていない');
  await btn('この大きさにする').click();
  await waitHash('me');
  await visible(btnLike(/文字の大きさ.*とても大きい/), '文字の大きさ とても大きい の行');
  await btn('冒険').click();
  await waitHash('home');
  await visible(page.getByLabel('今日の歩数'), 'ホームの今日の歩数');
});

await test('10 文字の大きさ：「ふつう」にもどせる', async () => {
  await go('me-text-size');
  await page.getByRole('radio', { name: /^ふつう/ }).click();
  await btn('この大きさにする').click();
  await waitHash('me');
  await visible(btnLike(/文字の大きさ.*ふつう/), '文字の大きさ ふつう の行');
});

await test('11 記録を見せる相手：「やめずにもどる」で何も変わらない', async () => {
  await go('me-share');
  await page.getByRole('button', { name: '見せるのを やめる', exact: true }).first().click();
  await visible(dialog('見せるのをやめる確認'), '確認の窓');
  await btn('やめずに もどる').click();
  await dialog('見せるのをやめる確認').waitFor({ state: 'detached' });
  await go('me');
  await visible(btnLike(/^記録を見せる相手.*2か所/), '見せている相手 2か所');
});

await test('12 記録を見せる相手：確認で「見せるのをやめる」を押すと 1か所へる', async () => {
  await go('me-share');
  await page.getByRole('button', { name: '見せるのを やめる', exact: true }).first().click();
  await visible(dialog('見せるのをやめる確認'), '確認の窓');
  await dialog('見せるのをやめる確認').getByRole('button', { name: '見せるのを やめる', exact: true }).click();
  await dialog('見せるのをやめる確認').waitFor({ state: 'detached' });
  await go('me');
  await visible(btnLike(/^記録を見せる相手.*1か所/), '見せている相手 1か所');
});

await test('13 お名前・呼び名の変更：新しい名前が行に出る', async () => {
  await go('me-profile-name');
  const input = page.getByRole('textbox');
  await input.fill('山田 はなよ');
  await btn('このお名前にする').click();
  await waitHash('me-profile');
  await visible(btnLike(/^お名前 山田 はなよ/), '新しいお名前の行');
  await go('me-profile-nickname');
  await page.getByRole('textbox').fill('はなちゃん');
  await btn('この呼び名にする').click();
  await waitHash('me-profile');
  await visible(btnLike(/^呼び名 はなちゃん/), '新しい呼び名の行');
});

await test('14 身長・体重の変更：1cm ふやす／1kg へらすが 行に出る', async () => {
  await go('me-profile-height');
  await btn('1cm ふやす').click();
  await btn('この身長にする').click();
  await waitHash('me-profile');
  await visible(btnLike(/^身長 153cm/), '身長 153cm の行');
  await go('me-profile-weight');
  await btn('1kg へらす').click();
  await btn('この体重にする').click();
  await waitHash('me-profile');
  await visible(btnLike(/^体重 49kg/), '体重 49kg の行');
});

await test('15 ログアウト：「やめずにもどる」で残り、「ログアウトする」ではじめの画面へ', async () => {
  await go('me-profile');
  await btnLike(/ログアウトする$/).first().click();
  await visible(dialog('ログアウトの確認'), 'ログアウトの確認の窓');
  await btn('やめずに もどる').click();
  await dialog('ログアウトの確認').waitFor({ state: 'detached' });
  assert((await hash()) === 'me-profile', 'やめたのに画面が変わった');
  await btnLike(/ログアウトする$/).first().click();
  await dialog('ログアウトの確認').getByRole('button', { name: 'ログアウトする', exact: true }).click();
  await waitHash('start');
  await visible(page.locator('aside').getByText('利用者アプリ：ログインしていません'), 'ログアウト後の状態');
});

await test('16 歩く：歩きスマホ防止が出て、立ち止まると外れる', async () => {
  await reset();
  await enterSample();
  await page.getByRole('button', { name: /^歩きはじめる/ }).click();
  await visible(dialog('歩きスマホ防止'), '歩きスマホ防止の画面');
  await btn('立ち止まる').click();
  await dialog('歩きスマホ防止').waitFor({ state: 'detached', timeout: 10000 });
  await page.getByRole('button', { name: /^歩きはじめる/ }).waitFor({ state: 'visible' });
});

await test('17 アプリを閉じて 2,345歩：冒険の成果 → レベルアップ（12→13）→ ホーム', async () => {
  await reset();
  await enterSample();
  await page.getByRole('button', { name: /^アプリを閉じて/ }).click();
  await waitHash('adventure-result');
  await btn('つづける').click();
  await waitHash('level-up');
  await visible(page.getByLabel('レベル12から13に上がりました'), 'レベル12→13の表示');
  await btn('つづける').click();
  await waitHash('home');
  await visible(page.locator('aside').getByText(/レベル13/), 'レベル13の状態');
});

// ---- 管理者画面（スマホ版）----
console.log('管理者画面（スマホ）');

await test('18 ログイン：空欄・まちがい・パスワード表示・成功', async () => {
  await reset();
  await go('admin-login');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await visible(page.getByText('アカウントIDと パスワードを 入れてください'), '空欄の注意');
  await page.locator('#admin-phone-id').fill('cm-sato-0412');
  await page.locator('#admin-phone-password').fill('wrong-password');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await visible(page.getByText('アカウントIDか パスワードが ちがいます'), 'まちがいの注意');
  await btn('パスワードを 表示する').click();
  assert((await page.locator('#admin-phone-password').getAttribute('type')) === 'text', 'パスワードが表示されない');
  await page.locator('#admin-phone-password').fill('hoho-2026');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await waitHash('admin-list');
});

await test('19 一覧：並べかえ（名前順↔歩数が少ない順）と「更新」', async () => {
  const names = () => page.getByRole('button', { name: /歳・/ }).evaluateAll((els) => els.map((e) => e.innerText.split('\n')[0]));
  const bySteps = await names();
  await page.getByRole('radio', { name: '名前順' }).click();
  const byName = await names();
  assert(JSON.stringify(bySteps) !== JSON.stringify(byName), '並びが変わらない');
  assert(byName.length === 6, `担当の6人が出ていない（${byName.length}人）`);
  await page.getByRole('radio', { name: '歩数が少ない順' }).click();
  assert(JSON.stringify(await names()) === JSON.stringify(bySteps), '元の並びにもどらない');
  await btn('更新').click();
  assert((await names()).length === 6, '更新のあと一覧がこわれた');
});

await test('20 測定結果：一覧から開いて、期間を切りかえ、「一覧」でもどる', async () => {
  await page.getByRole('button', { name: /^山田 花子 79歳/ }).click();
  await waitHash('admin-user');
  await visible(page.getByRole('heading', { name: '山田 花子 さん' }), '利用者の見出し');
  await page.getByRole('radio', { name: '1か月' }).click();
  await checked('1か月');
  await page.getByRole('radio', { name: '1週間' }).click();
  await checked('1週間');
  await btn('一覧').click();
  await waitHash('admin-list');
});

await test('21 目標歩数の変更（管理者から）：利用者アプリの目標にも反映される', async () => {
  await page.getByRole('button', { name: /^山田 花子 79歳/ }).click();
  await waitHash('admin-user');
  await btn('変更する').click();
  await visible(dialog('1日の目標歩数を変える'), '目標変更の窓');
  await btn('変えずに もどる').click();
  await dialog('1日の目標歩数を変える').waitFor({ state: 'detached' });
  await btn('変更する').click();
  await btn('＋ 500歩').click();
  await btn('この目標にする').click();
  await dialog('1日の目標歩数を変える').waitFor({ state: 'detached' });
  await enterSample();
  await go('me');
  await visible(btnLike(/^1日の目標歩数.*5,500歩/), '管理者が変えた目標 5,500歩');
});

await test('22 管理者のログアウトでログイン画面にもどる', async () => {
  await enterAdmin('佐藤 恵子', false);
  await btn('ログアウト').click();
  await waitHash('admin-login');
});

// ---- 管理者画面（PC版）----
console.log('管理者画面（PC）');

await test('23 PCログイン：まちがいは入れず、正しい組み合わせで一覧へ', async () => {
  await go('admin-pc-login');
  await page.locator('#admin-pc-id').fill('temari-tamura01');
  await page.locator('#admin-pc-password').fill('nope');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await visible(page.getByText('アカウントIDか パスワードが ちがいます'), 'まちがいの注意');
  await page.locator('#admin-pc-password').fill('hoho-2026');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await waitHash('admin-pc-list');
});

await test('24 PC一覧：名前でさがす・「記録が届いていない」だけ・並び順・最新にする', async () => {
  const rows = () => page.locator('a[href*="admin-pc-user"], a[href^="#admin-pc-user"]').count();
  const link = (name) => page.getByRole('link', { name, exact: true });
  await visible(link('山田 花子'), '山田 花子の行');
  await page.getByRole('searchbox').fill('山田');
  await visible(link('山田 花子'), '検索後の山田 花子');
  assert((await link('鈴木 和子').count()) === 0, '検索で絞られていない');
  await page.getByRole('searchbox').fill('');
  await page.getByRole('radio', { name: /^記録が届いていない/ }).click();
  assert((await link('山田 花子').count()) === 0, '届いていない人だけになっていない');
  await visible(link('田中 幸子'), '届いていない人（田中 幸子）');
  await page.getByRole('radio', { name: /^すべて/ }).click();
  await visible(link('山田 花子'), 'すべてにもどす');
  const first = () => page.locator('select').evaluate((s) => s.value);
  const before = await first();
  const opts = await page.locator('select option').evaluateAll((os) => os.map((o) => o.value));
  assert(opts.length >= 2, '並び順の選びが足りない');
  await page.locator('select').selectOption(opts.find((v) => v !== before));
  assert((await first()) !== before, '並び順が変わらない');
  await btn('最新にする').click();
  await visible(link('山田 花子'), '最新にしたあとの一覧');
  void rows;
});

await test('25 PC測定結果：開いて、期間・目標の窓・一覧へもどる', async () => {
  await page.getByRole('link', { name: '山田 花子', exact: true }).click();
  await waitHash('admin-pc-user');
  await visible(page.getByRole('heading', { name: '山田 花子 さん' }), '利用者の見出し');
  await page.getByRole('radio', { name: '1か月' }).click();
  await checked('1か月');
  await page.getByRole('radio', { name: '1週間' }).click();
  await checked('1週間');
  await btn('変更する').click();
  await visible(dialog('1日の目標歩数を変える'), '目標変更の窓');
  await btn('変えずに もどる').click();
  await dialog('1日の目標歩数を変える').waitFor({ state: 'detached' });
  await page.getByRole('link', { name: '利用者の一覧', exact: true }).first().click();
  await waitHash('admin-pc-list');
});

await test('26 見せるのをやめた人は、管理者の一覧から消える（N-14）', async () => {
  await reset();
  await enterSample();
  await go('me-share');
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: '見せるのを やめる', exact: true }).first().click();
    await dialog('見せるのをやめる確認').getByRole('button', { name: '見せるのを やめる', exact: true }).click();
    await dialog('見せるのをやめる確認').waitFor({ state: 'detached' });
  }
  await enterAdmin('田村 美咲', true);
  assert((await page.getByRole('link', { name: '山田 花子', exact: true }).count()) === 0, '施設の一覧に残っている');
  await enterAdmin('佐藤 恵子', false);
  assert((await page.getByRole('button', { name: /^山田 花子 79歳/ }).count()) === 0, '担当の一覧に残っている');
});

// ---- まとめ ----
await test('27 画面のエラー・警告が出ていない', async () => {
  const filtered = problems.filter((p) => !/favicon\.ico|fonts\.(googleapis|gstatic)/i.test(p));
  assert(filtered.length === 0, filtered.slice(0, 3).join(' / '));
});

await browser.close();
const ng = results.filter((r) => !r.ok);
console.log(`\n${results.length - ng.length}/${results.length} 件が通りました`);
if (ng.length) {
  console.log('通らなかったもの：');
  for (const r of ng) console.log(`  - ${r.name}: ${r.why}`);
  process.exit(1);
}
