// 全ボタンの動作テスト：画面を実際に押して、押したとおりに動くかを確かめる。
// 使い方：開発サーバー（npm run dev）を起動したまま `npm run e2e`。別のアドレスは BASE=http://…/ で指定。
// ブラウザは入っている Chrome を使う（E2E_CHANNEL=msedge で Edge）。

import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://localhost:5173/';
const CHANNEL = process.env.E2E_CHANNEL || 'chrome';
const TIMEOUT = 8000;

const browser = await chromium.launch({ channel: CHANNEL });
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });

/** 外の Google Fonts を読まない（そのときの ネットワークで 開くのが 遅れて テストが落ちないように。文字は ほかのフォントで出る） */
const blockFonts = (target) =>
  target.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.fulfill({ status: 200, contentType: route.request().url().includes('googleapis') ? 'text/css' : 'font/woff2', body: '' }),
  );
await blockFonts(page);
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

await test('17 2,345歩 歩いて止まったことにする：冒険の成果 → レベルアップ（12→13）→ ホーム', async () => {
  await reset();
  await enterSample();
  await page.getByRole('button', { name: /^2,345歩 歩いて 止まったことにする/ }).click();
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

// ---- 体の動きで 歩数を数える（M-03・M-11）----
console.log('体の動きで 歩数を数える');

/**
 * スマホを持って steps 歩 歩いたときの 体の動きを、実際の時間に合わせて 1秒に rate 回 送る
 * （iPhone・Chrome は 60、Firefox は 10 ほど）。target で 送るページを えらべる
 */
const walkMotion = (steps, { hz = 1.8, amp = 3, rate = 60 } = {}, target = page) =>
  target.evaluate(
    async ({ steps, hz, amp, rate }) => {
      // 送る回数ではなく 実際の時間で止める（PC が重くて 待ちが長くなっても、送る波が ちょうど steps 歩分になるように）
      const startedAt = performance.now();
      for (;;) {
        const sec = (performance.now() - startedAt) / 1000;
        if (sec >= steps / hz) break;
        const y = 9.8 + amp * Math.sin(2 * Math.PI * hz * sec);
        window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x: 0, y, z: 0 }, interval: 1000 / rate }));
        await new Promise((r) => setTimeout(r, 1000 / rate));
      }
    },
    { steps, hz, amp, rate },
  );
/** 手で 2回 ゆらしただけの 動き */
const shakeMotion = () =>
  page.evaluate(async () => {
    const startedAt = performance.now();
    for (let i = 0; i < 90; i++) {
      const sec = (performance.now() - startedAt) / 1000;
      const bump = (at) => 6 * Math.exp(-(((sec - at) / 0.08) ** 2));
      window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x: 0, y: 9.8 + bump(0.4) + bump(0.9), z: 0 }, interval: 16 }));
      await new Promise((r) => setTimeout(r, 1000 / 60));
    }
  });
const setPageHidden = (hidden) =>
  page.evaluate((h) => {
    if (h) Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    else delete document.visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
const todayStatus = () => page.locator('aside').getByText(/山田 花子さん（レベル\d+・今日 [\d,]+歩）/).innerText();
const todaySteps = async () => Number((await todayStatus()).match(/今日 ([\d,]+)歩/)[1].replace(/,/g, ''));

await test('28 体の動きで歩くと 歩きスマホ防止が出て、止まると外れて 冒険の成果へ。歩数も ふえる', async () => {
  await reset();
  await enterSample();
  const before = await todaySteps();
  await walkMotion(10);
  await visible(dialog('歩きスマホ防止'), '歩きスマホ防止の画面');
  await dialog('歩きスマホ防止').waitFor({ state: 'detached', timeout: 10000 });
  await waitHash('adventure-result');
  const added = (await todaySteps()) - before;
  assert(Math.abs(added - 10) <= 2, `ふえた歩数が ${added}歩`);
});

await test('29 手で 2回 ゆらしただけでは ロックも出ず、歩数も ふえない', async () => {
  await reset();
  await enterSample();
  const before = await todaySteps();
  await shakeMotion();
  await page.waitForTimeout(500);
  assert((await dialog('歩きスマホ防止').count()) === 0, 'ロックが出た');
  assert((await todaySteps()) === before, '歩数が ふえた');
});

await test('30 ログインしていない間に歩いた分は、だれにも入らない', async () => {
  await reset();
  const before = await page.evaluate(async () => {
    const s = await import('/src/lib/store.ts');
    return s.findUser('s-yamada').days;
  });
  await walkMotion(10);
  await page.waitForTimeout(2500);
  await enterSample();
  const after = await page.evaluate(async () => {
    const s = await import('/src/lib/store.ts');
    return s.findUser('s-yamada').days;
  });
  assert(JSON.stringify(after) === JSON.stringify(before), 'ログインしていない間の歩数が 入った');
});

await test('31 歩いている途中で 画面が隠れると、すぐに ロックが外れる', async () => {
  await reset();
  await enterSample();
  await walkMotion(8);
  await visible(dialog('歩きスマホ防止'), '歩きスマホ防止の画面');
  await setPageHidden(true);
  await dialog('歩きスマホ防止').waitFor({ state: 'detached', timeout: 1000 });
  await setPageHidden(false);
  await waitHash('adventure-result');
});

await test('32 歩数の精度を確かめる画面（チーム用）：10歩で B が 10±1、記録すると 一覧に出る', async () => {
  await reset();
  await go('check-steps');
  await btn('はじめる').click();
  await walkMotion(10);
  await page.waitForTimeout(600);
  const b = Number(await page.locator('[data-variant="B"]').innerText());
  assert(Math.abs(b - 10) <= 1, `B が ${b}歩`);
  await page.getByLabel('実際の歩数').fill('10');
  await btn('記録する').click();
  await visible(page.getByRole('cell', { name: '手に持つ' }), '記録の行');
  await btn('記録を消す').click();
  await btn('おわる').click();
});

await test('33 iPhone：まだ許可していないと ホームに案内が出て、ボタンを押すと 許可を求めて 数えはじめる', async () => {
  const ios = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
  await blockFonts(ios);
  ios.setDefaultTimeout(TIMEOUT);
  ios.on('pageerror', (e) => problems.push(`pageerror(iPhone): ${e.message}`));
  // iPhone の Safari と同じく、ボタン操作の中で呼んだときだけ 許可を求められる（それ以外は NotAllowedError）
  await ios.addInitScript(() => {
    window.__motionAsked = 0;
    DeviceMotionEvent.requestPermission = () => {
      if (!navigator.userActivation?.isActive) return Promise.reject(new DOMException('ボタン操作が必要', 'NotAllowedError'));
      window.__motionAsked += 1;
      return Promise.resolve('granted');
    };
  });
  try {
    await ios.goto(BASE);
    await ios.waitForSelector('aside');
    await ios.evaluate(async () => {
      const s = await import('/src/lib/store.ts');
      s.resetAll();
      s.loginAs('s-yamada');
      location.hash = 'home';
    });
    const allow = ios.getByRole('button', { name: '歩数を 数えはじめる', exact: true });
    await allow.click();
    await allow.waitFor({ state: 'detached' });
    assert((await ios.evaluate(() => window.__motionAsked)) === 1, 'ボタン操作の中で 許可を求めていない');
    await ios.locator('aside').getByText('体の動き：数えられます').first().waitFor({ state: 'visible' });
  } finally {
    await ios.close();
  }
});

// ---- Android版 ----
console.log('Android版');

const ANDROID_CHROME_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36';
const FIREFOX_ANDROID_UA = 'Mozilla/5.0 (Android 14; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0';

/**
 * スマホ（412×915、指で触れる）として 開いた ページ。init で ブラウザの ちがいを まねる。
 * 確認パネルは出ないので、サンプルの利用者には 試作のサーバー（store.ts）から入る
 */
const openPhone = async ({ userAgent = ANDROID_CHROME_UA, init } = {}) => {
  const phone = await browser.newPage({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, userAgent });
  await blockFonts(phone);
  phone.setDefaultTimeout(TIMEOUT);
  phone.on('pageerror', (e) => problems.push(`pageerror(スマホ): ${e.message}`));
  phone.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`console.${m.type()}(スマホ): ${m.text()} ${m.location().url ?? ''}`);
  });
  if (init) await phone.addInitScript(init);
  await phone.goto(BASE);
  await phone.evaluate(async () => {
    const s = await import('/src/lib/store.ts');
    s.resetAll();
    s.loginAs('s-yamada');
    location.hash = 'home';
  });
  await phone.getByLabel('今日の歩数').waitFor({ state: 'visible' });
  return phone;
};
/** 山田 花子さんの これまでの歩数の合計（試作のサーバーから読む） */
const totalSteps = (target) =>
  target.evaluate(async () => {
    const s = await import('/src/lib/store.ts');
    return Object.values(s.findUser('s-yamada').days).reduce((a, b) => a + b, 0);
  });
const cannotCountNotice = (target) => target.getByRole('region', { name: '歩数を数える準備' }).getByText('いまは 歩数を 数えられません');

/** Android の古い Chrome・Samsung Internet：requestPermission が無い（Permissions API はある） */
const NO_PERMISSION_BUTTON = () => {
  delete DeviceMotionEvent.requestPermission;
  Object.defineProperty(navigator, 'userAgentData', { configurable: true, get: () => ({ platform: 'Android', mobile: true }) });
};

await test('34 Android の Chrome：許可のボタンなしで 数えられ、案内も出ない', async () => {
  const phone = await openPhone({ init: NO_PERMISSION_BUTTON });
  try {
    const before = await totalSteps(phone);
    await walkMotion(10, {}, phone);
    assert((await phone.getByRole('region', { name: '歩数を数える準備' }).count()) === 0, '数えられるのに 案内が出た');
    await phone.waitForTimeout(2300);
    const added = (await totalSteps(phone)) - before;
    assert(Math.abs(added - 10) <= 2, `ふえた歩数が ${added}歩`);
  } finally {
    await phone.close();
  }
});

await test('35 Android：モーション センサーを止めていると 案内が出て 数えない。設定を直すと 消える', async () => {
  // (a) requestPermission が無く、Permissions API が「ブロック」を返す（Samsung Internet・古い Chrome）
  const phone = await openPhone({
    init: () => {
      delete DeviceMotionEvent.requestPermission;
      const status = new EventTarget();
      status.state = 'denied';
      window.__accelerometer = status;
      const query = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = (desc) => (desc?.name === 'accelerometer' ? Promise.resolve(status) : query(desc));
    },
  });
  try {
    await visible(cannotCountNotice(phone), '数えられない案内');
    const before = await totalSteps(phone);
    await walkMotion(8, {}, phone);
    await phone.waitForTimeout(500);
    assert((await totalSteps(phone)) === before, '止めているのに 数えた');
    await phone.evaluate(() => {
      window.__accelerometer.state = 'granted';
      window.__accelerometer.dispatchEvent(new Event('change'));
    });
    await cannotCountNotice(phone).waitFor({ state: 'detached' });
  } finally {
    await phone.close();
  }
  // (b) Chrome 152 から：requestPermission が「denied」を返す
  const chrome = await openPhone({ init: () => (DeviceMotionEvent.requestPermission = () => Promise.resolve('denied')) });
  try {
    await visible(cannotCountNotice(chrome), '数えられない案内（Chrome 152 から）');
  } finally {
    await chrome.close();
  }
});

await test('36 値が届かないと 3秒で 案内が出て、「もう一度 たしかめる」で 値が届けば 消える', async () => {
  const phone = await openPhone({ init: NO_PERMISSION_BUTTON });
  try {
    // センサーを止めた Chrome と同じく、中身のない値が 1回だけ届く
    await phone.evaluate(() => window.dispatchEvent(new DeviceMotionEvent('devicemotion')));
    await visible(cannotCountNotice(phone), '値が届かない案内');
    await phone.getByRole('button', { name: 'もう一度 たしかめる', exact: true }).click();
    await walkMotion(3, {}, phone);
    await cannotCountNotice(phone).waitFor({ state: 'detached' });
  } finally {
    await phone.close();
  }
});

await test('37 PC の画面では 値が届かなくても ホームに案内を出さず、確認パネルに出す', async () => {
  await reset();
  await enterSample();
  await page.evaluate(() => window.dispatchEvent(new DeviceMotionEvent('devicemotion')));
  await page.locator('aside').getByText('値が届いていません。PC では ふつう', { exact: false }).waitFor({ state: 'visible', timeout: 6000 });
  assert((await page.getByRole('region', { name: '歩数を数える準備' }).count()) === 0, 'PC のホームに 案内が出た');
});

await test('38 Firefox（1秒に 10回）：数えられ、確かめる画面の B も 10±1', async () => {
  const phone = await openPhone({
    userAgent: FIREFOX_ANDROID_UA,
    init: () => {
      delete DeviceMotionEvent.requestPermission;
      Object.defineProperty(navigator, 'userAgentData', { configurable: true, get: () => undefined });
      const query = navigator.permissions.query.bind(navigator.permissions);
      // Firefox は accelerometer を 知らない
      navigator.permissions.query = (desc) => (desc?.name === 'accelerometer' ? Promise.reject(new TypeError('accelerometer is not a valid value')) : query(desc));
    },
  });
  try {
    const before = await totalSteps(phone);
    await walkMotion(10, { rate: 10 }, phone);
    await phone.waitForTimeout(2300);
    const added = (await totalSteps(phone)) - before;
    assert(Math.abs(added - 10) <= 2, `ふえた歩数が ${added}歩`);
    await phone.evaluate(() => (location.hash = 'check-steps'));
    await phone.getByRole('button', { name: 'はじめる', exact: true }).click();
    await walkMotion(10, { rate: 10 }, phone);
    await phone.waitForTimeout(600);
    const b = Number(await phone.locator('[data-variant="B"]').innerText());
    assert(Math.abs(b - 10) <= 1, `B が ${b}歩`);
    await visible(phone.getByText('Android・Firefox'), '端末の表示');
  } finally {
    await phone.close();
  }
});

// ---- ゲームの核（エリア・ボス・絵の無い敵）----
console.log('ゲームの核');

/** 大きな歩数は ページの中で store の関数を呼んで入れる（山田さんは はじめ 28,550歩の所に いる） */
const walkInStore = (steps) =>
  page.evaluate(async (n) => {
    const s = await import('/src/lib/store.ts');
    s.recordSteps('s-yamada', n);
    s.finishAdventure('s-yamada');
  }, steps);
const YAMADA_START = 28550;

await test('39 ボスの手前まで進めて 歩くと、成果に「ボス」と「あと」が出る', async () => {
  await reset();
  await enterSample();
  await walkInStore(119000 - YAMADA_START);
  await page.getByRole('button', { name: /^2,345歩 歩いて 止まったことにする/ }).click();
  await waitHash('adventure-result');
  await visible(page.getByText(/ボス はなふぶき\s+あと 8,655歩/), '成果の ボスの行');
  // この歩数では レベルは上がらない（レベル29のまま）ので、成果から そのまま ホームへ
  await btn('つづける').click();
  await waitHash('home');
  await visible(page.getByLabel('ボス はなふぶき あと 8,655歩'), 'ホームの ボスの残り歩数');
  await visible(page.locator('[data-enemy="hanafubuki"]'), 'ホームの ボスの絵');
});

await test('40 エリア1をこえると、こえたことの行が出て、ホームの敵が エリア2の敵になる', async () => {
  await reset();
  await enterSample();
  await visible(page.getByLabel('いまいる所：はなあかりの小道'), 'はじめのエリアの名前');
  await page.evaluate(async (n) => {
    const s = await import('/src/lib/store.ts');
    s.recordSteps('s-yamada', n);
  }, 130000 - YAMADA_START);
  await go('adventure-result');
  await visible(page.getByText('はなあかりの小道を こえた。次は わかばの田んぼ道'), 'こえたことの行');
  await btn('つづける').click();
  await waitHash('level-up');
  await btn('つづける').click();
  await waitHash('home');
  await visible(page.getByLabel('いまいる所：わかばの田んぼ道'), '次のエリアの名前');
  const enemy = await page.locator('[data-frame] [data-enemy]').first().getAttribute('data-enemy');
  const area = await page.evaluate(async (id) => {
    const d = await import('/src/data/enemies.ts');
    return d.ENEMIES.find((e) => e.id === id)?.area;
  }, enemy);
  assert(area === 2, `ホームの敵が ${enemy}（エリア${area}）`);
});

// エリア4（うみかぜの浜）の敵は まだ絵が無い。絵ができたら、まだ絵の無い エリアに うつす
await test('41 絵の無い敵（エリア4以降）が出ても、代わりの絵が出て、コンソールのエラーが 0件', async () => {
  const before = problems.length;
  await reset();
  await enterSample();
  // 450,000歩：エリア4の道の中。750歩の区切りに ちょうど合うので、このあと 2,345歩で 3体に会う
  await walkInStore(450000 - YAMADA_START);
  await go('records');
  await go('home');
  await visible(page.getByLabel('いまいる所：うみかぜの浜'), 'エリア4の名前');
  await visible(page.locator('[data-frame] svg[data-placeholder]'), 'ホームの 代わりの絵');
  await page.getByRole('button', { name: /^2,345歩 歩いて 止まったことにする/ }).click();
  await waitHash('adventure-result');
  await visible(page.getByRole('list', { name: /^たおした敵/ }).locator('svg[data-placeholder]'), '成果の 代わりの絵');
  const count = await page.getByRole('list', { name: /^たおした敵/ }).locator('svg[data-placeholder]').count();
  assert(count === 3, `代わりの絵が ${count}こ`);
  await page.waitForTimeout(300);
  assert(problems.length === before, problems.slice(before, before + 3).join(' / '));
});

// ---- 演出と音・設定 ----
console.log('演出と音・設定');

/** 「わたし」の 入・切の 行（aria-pressed で 入・切を 読む） */
const prefRow = (name) => page.getByRole('button', { name: new RegExp(`^${name}`) });
const pressedOf = async (name) => (await prefRow(name).getAttribute('aria-pressed')) === 'true';
/** 入・切を want に そろえる */
const setPref = async (name, want) => {
  if ((await pressedOf(name)) !== want) await prefRow(name).click();
  await prefRow(name).and(page.locator(`[aria-pressed="${want}"]`)).waitFor({ state: 'visible' }).catch(() => {
    throw new Error(`${name} が ${want ? '入' : '切'}に ならない`);
  });
};
/** 歩いた分を 入れて、成果の画面を 開く（ボタンを 押さずに 開くので、ボタンの 音は 入らない） */
const openResultWithSteps = async (steps) => {
  await page.evaluate(async (n) => {
    const s = await import('/src/lib/store.ts');
    s.recordSteps('s-yamada', n);
  }, steps);
  await go('adventure-result');
  await visible(page.getByRole('list', { name: /^たおした敵/ }), '成果の 敵の絵');
};

await test('42 わたし：音・歩いている間の音・動きをへらす の入・切を 押して かえられ、開きなおしても のこる', async () => {
  await reset();
  await enterSample();
  await go('me');
  for (const name of ['音', '歩いている間の音', '動きをへらす']) await visible(prefRow(name), `${name} の行`);
  assert((await pressedOf('音')) === true, '音は はじめ 入');
  assert((await pressedOf('歩いている間の音')) === false, '歩いている間の音は はじめ 切');
  assert((await pressedOf('動きをへらす')) === false, '動きをへらすは はじめ 切');
  await visible(prefRow('歩いている間の音').getByText('切', { exact: true }), '切の 表示');
  await setPref('音', false);
  await setPref('歩いている間の音', true);
  await setPref('動きをへらす', true);
  await visible(prefRow('音').getByText('切', { exact: true }), '音の 切の 表示');
  await page.reload();
  await page.waitForSelector('aside');
  await waitHash('me');
  await visible(prefRow('音'), '開きなおした あとの 音の行');
  assert((await pressedOf('音')) === false, '音の 切が のこっていない');
  assert((await pressedOf('歩いている間の音')) === true, '歩いている間の音の 入が のこっていない');
  assert((await pressedOf('動きをへらす')) === true, '動きをへらすの 入が のこっていない');
  // もとに もどす
  await setPref('音', true);
  await setPref('歩いている間の音', false);
  await setPref('動きをへらす', false);
});

await test('43 音が「切」のときは 鳴らさず、「入」のときは 成果の画面で 鳴らそうとする（にせの AudioContext で 数える）', async () => {
  await page.addInitScript(() => {
    const audio = { contexts: 0, notes: 0 };
    window.__audio = audio;
    const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
    const node = () => ({ connect() {} });
    class FakeAudioContext {
      constructor() {
        audio.contexts += 1;
        this.state = 'running';
        this.currentTime = 0;
        this.destination = node();
      }
      resume() {
        return Promise.resolve();
      }
      createGain() {
        return { ...node(), gain: param() };
      }
      createOscillator() {
        audio.notes += 1;
        return { ...node(), type: 'sine', frequency: param(), start() {}, stop() {} };
      }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });
  await page.reload();
  await page.waitForSelector('aside');
  await reset();
  await enterSample();
  await go('me');
  await setPref('音', false);
  await page.evaluate(() => (window.__audio.notes = 0));
  await openResultWithSteps(2345);
  await page.waitForTimeout(800);
  const off = await page.evaluate(() => window.__audio.notes);
  assert(off === 0, `切なのに ${off}回 鳴らそうとした`);
  await btn('つづける').click();
  await waitHash('level-up');
  await btn('つづける').click();
  await waitHash('home');
  assert((await page.evaluate(() => window.__audio.notes)) === 0, '切なのに レベルアップや ボタンで 鳴らそうとした');

  await go('me');
  await setPref('音', true);
  await page.evaluate(() => (window.__audio.notes = 0));
  await openResultWithSteps(2345);
  await page.waitForFunction(() => window.__audio.notes > 0, null, { timeout: 3000 }).catch(() => {
    throw new Error('入なのに 成果の画面で 鳴らそうとしない');
  });
  assert((await page.evaluate(() => window.__audio.contexts)) === 1, 'AudioContext は 1つだけ 作る');
});

await test('44 動きをへらすが「入」のとき、成果の画面の アニメーションが 止まっている', async () => {
  await reset();
  await enterSample();
  const animOf = () =>
    page.evaluate(() => {
      const li = document.querySelector('[aria-label^="たおした敵"] li');
      const st = getComputedStyle(li);
      return { name: st.animationName, duration: parseFloat(st.animationDuration) || 0 };
    });
  // 切のときは 動いている（テストが 意味を もつことの 確かめ）
  await openResultWithSteps(2345);
  const moving = await animOf();
  assert(moving.name !== 'none' && moving.duration > 0.1, `切なのに 動いていない（${moving.name} ${moving.duration}s）`);
  await btn('つづける').click();
  await waitHash('level-up');
  await btn('つづける').click();
  await waitHash('home');

  await reset();
  await enterSample();
  await go('me');
  await setPref('動きをへらす', true);
  await openResultWithSteps(2345);
  const still = await animOf();
  assert(still.name === 'none' || still.duration <= 0.001, `入なのに 動いている（${still.name} ${still.duration}s）`);
  await btn('つづける').click();
  await waitHash('level-up');
  await visible(page.getByLabel(/に上がりました$/), 'レベルの 数字');
  const sparkle = await page.evaluate(() => {
    const st = getComputedStyle(document.querySelector('[aria-label$="に上がりました"] span:last-child'));
    return { name: st.animationName, duration: parseFloat(st.animationDuration) || 0 };
  });
  assert(sparkle.name === 'none' || sparkle.duration <= 0.001, `レベルアップの 数字が 動いている（${sparkle.name}）`);
  await btn('つづける').click();
  await waitHash('home');
  await go('me');
  await setPref('動きをへらす', false);
});

// ---- アニメーション（段階B〜E）----
console.log('アニメーション');

/** 動いている 要素の animation（名前・長さ・再生の 状態） */
const animsOf = (selector) =>
  page.evaluate(
    (sel) =>
      [...document.querySelectorAll(sel)].map((e) => {
        const st = getComputedStyle(e);
        return { kind: e.dataset.walkAnim ?? e.dataset.enemyMotion ?? '', name: st.animationName, duration: parseFloat(st.animationDuration) || 0, play: st.animationPlayState };
      }),
    selector,
  );
const stillAnim = (a) => a.name === 'none' || a.duration <= 0.001;
/** 道の帯の いまの 横の位置（px） */
const roadX = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-walk-anim="road"]')).transform).m41);
const walkSceneIs = (state, timeout = TIMEOUT) =>
  page.waitForFunction((st) => document.querySelector('[data-walk-scene]')?.dataset.walkScene === st, state, { timeout }).catch(() => {
    throw new Error(`歩行中の 場面が ${state} に ならない`);
  });
/** 成果の画面の 戦闘：おわったか と HP の 数 */
const battleState = () =>
  page.evaluate(() => {
    const b = document.querySelector('[data-battle]');
    return { state: b?.dataset.battle, hp: [...(b?.querySelectorAll('[data-hp-left]') ?? [])].map((e) => Number(e.dataset.hpLeft)) };
  });
const battleDone = (timeout) =>
  page.waitForFunction(() => document.querySelector('[data-battle]')?.dataset.battle === 'done', null, { timeout }).catch(() => {
    throw new Error(`戦闘が ${timeout}ms で おわらない`);
  });
/** 手に入れた ポイントの 目に見える 数と、読み上げる 数 */
const shownPoints = () =>
  page.evaluate(() => {
    const hidden = [...document.querySelectorAll('.visually-hidden')].find((e) => e.nextElementSibling?.getAttribute('aria-hidden') === 'true');
    return { shown: hidden?.nextElementSibling?.textContent, read: hidden?.textContent };
  });
/** 成果 →（レベルアップ）→ ホーム */
const finishResult = async () => {
  await btn('つづける').click();
  await page.waitForFunction(() => /^#(level-up|home)$/.test(location.hash));
  if ((await hash()) === 'level-up') {
    await btn('つづける').click();
    await waitHash('home');
  }
};

await test('45 歩行中の画面：道と主人公が 流れ、立ち止まると ゆっくり 止まる（文字は そのまま）', async () => {
  await reset();
  await enterSample();
  await page.getByRole('button', { name: /^歩きはじめる/ }).click();
  await visible(dialog('歩きスマホ防止'), '歩きスマホ防止の画面');
  await walkSceneIs('moving');
  const moving = await animsOf('[data-walk-anim]');
  assert(moving.some((a) => a.kind === 'road') && moving.some((a) => a.kind === 'hero'), '道と 主人公の 動きが ない');
  assert(moving.every((a) => !stillAnim(a) && a.play === 'running'), `流れていない（${JSON.stringify(moving.find((a) => stillAnim(a) || a.play !== 'running'))}）`);
  const x1 = await roadX();
  await page.waitForTimeout(300);
  const x2 = await roadX();
  assert(Math.abs(x2 - x1) > 1, `道の 位置が かわらない（${x1} → ${x2}）`);
  await visible(dialog('歩きスマホ防止').getByText('歩いています', { exact: true }), '「歩いています」の 文字');
  await visible(dialog('歩きスマホ防止').getByText('止まると、自動で使えるようになります'), '下の 文');
  await btn('立ち止まる').click();
  // ロックが 外れる（2.5秒）より 前に、ゆっくり 止まりおわる
  await walkSceneIs('stopped', 2400);
  const stopped = await animsOf('[data-walk-anim]');
  assert(stopped.every((a) => a.play === 'paused'), '止まっても 流れている');
  const y1 = await roadX();
  await page.waitForTimeout(300);
  const y2 = await roadX();
  assert(Math.abs(y2 - y1) < 0.01, `止まっても 道が うごく（${y1} → ${y2}）`);
  await dialog('歩きスマホ防止').waitFor({ state: 'detached', timeout: 10000 });
});

await test('46 成果の画面：戦闘で HPバーが 出て 750 → 0 に へり、おわると +30。画面を さわると すぐ おわる', async () => {
  await reset();
  await enterSample();
  await openResultWithSteps(2345);
  await visible(page.locator('[data-battle] [data-hp-left]'), '戦闘の HPバー');
  const first = await battleState();
  assert(first.state === 'playing', 'はじめから おわっている');
  assert(first.hp.length === 3 && first.hp.every((v) => v === 750), `はじめの HP が ${first.hp}`);
  // 文字と 絵は はじめから ある
  await visible(page.getByRole('list', { name: /^たおした敵/ }), 'たおした敵の 列');
  await battleDone(8000);
  const last = await battleState();
  assert(last.hp.every((v) => v === 0), `おわりの HP が ${last.hp}`);
  const pts = await shownPoints();
  assert(pts.shown === '+30' && pts.read === '+30', `ポイントが ${JSON.stringify(pts)}`);
  // もう一度 開いて、すぐ 画面を さわると すぐ おわりの 形
  await reset();
  await enterSample();
  await openResultWithSteps(2345);
  assert((await battleState()).state === 'playing', '2回目が はじめから おわっている');
  await page.getByRole('heading', { name: 'おかえりなさい！' }).click();
  await battleDone(600);
  const skipped = await battleState();
  assert(skipped.hp.every((v) => v === 0), `さわった あとの HP が ${skipped.hp}`);
  assert((await shownPoints()).shown === '+30', 'さわった あとの ポイントが +30 でない');
  await finishResult();
});

await test('47 ホーム：次の敵の HPバーと「あと ○歩」が 歩いた歩数と 合う（ボスは ボスの残り）', async () => {
  await reset();
  await enterSample();
  const hpOf = () =>
    page.evaluate(() => {
      const box = document.querySelector('[data-next-hp]');
      const el = box?.querySelector('[data-hp-left]');
      const fill = el?.querySelector('span > span');
      return {
        kind: box?.dataset.nextHp,
        left: Number(el?.dataset.hpLeft),
        total: Number(el?.dataset.hpTotal),
        text: el?.textContent ?? '',
        ratio: fill ? fill.offsetWidth / fill.parentElement.clientWidth : NaN,
      };
    });
  let walked = 0;
  for (const add of [0, 300, 450, 749]) {
    if (add > 0) {
      await walkInStore(add);
      walked += add;
      await go('records');
      await go('home');
    }
    // 道中は 750歩ごとに 出会う。次の出会いまで = 750 − （いまの位置 ÷ 750 の あまり）
    const expected = 750 - ((YAMADA_START + walked) % 750);
    const hp = await hpOf();
    assert(hp.kind === 'enemy' && hp.left === expected && hp.total === 750, `${walked}歩で ${JSON.stringify(hp)}（${expected}歩の はず）`);
    assert(hp.text.includes(`あと ${expected}歩`), `${walked}歩で 文字が「${hp.text}」`);
    assert(Math.abs(hp.ratio - expected / 750) < 0.03, `${walked}歩で バーの 長さが ${hp.ratio.toFixed(2)}`);
    await visible(page.getByLabel(`次の敵に 会うまで あと ${expected}歩`), '次の敵までの 読み上げ');
  }
  // ボス：のこりの歩数（左上の 行と 同じ数）
  await walkInStore(121000 - YAMADA_START - walked);
  await go('records');
  await go('home');
  const boss = await hpOf();
  assert(boss.kind === 'boss' && boss.left === 9000 && boss.total === 10000, `ボスの HP が ${JSON.stringify(boss)}`);
  assert(boss.text.includes('あと 9,000歩'), `ボスの 文字が「${boss.text}」`);
  assert(Math.abs(boss.ratio - 0.9) < 0.03, `ボスの バーの 長さが ${boss.ratio.toFixed(2)}`);
  await visible(page.getByLabel('ボス はなふぶき あと 9,000歩'), '左上の ボスの 行');
  // 文字の大きさ（ふつう・大きい・とても大きい）で、次の敵の バーが 主人公・ポイントの枠・エリア名・ボスの行に 重ならず、場面から はみ出さない
  const setSize = (size) =>
    page.evaluate(async (sz) => {
      const s = await import('/src/lib/store.ts');
      s.setTextSize('s-yamada', sz);
    }, size);
  const hpOverlap = () =>
    page.evaluate(() => {
      const r = document.querySelector('[data-next-hp] [data-hp-left]').getBoundingClientRect();
      const f = document.querySelector('[data-frame]').getBoundingClientRect();
      const hit = (sel) => {
        const o = document.querySelector(sel)?.getBoundingClientRect();
        return Boolean(o) && r.left < o.right && o.left < r.right && r.top < o.bottom && o.top < r.bottom;
      };
      return {
        hero: hit('[data-frame] img[data-hero]'),
        point: hit('[class*="pointWindow"]'),
        place: hit('[aria-label^="いまいる所"]'),
        bossRow: hit('[aria-label^="ボス "]'),
        outside: r.left < f.left || r.right > f.right,
      };
    });
  const noOverlapEachSize = async (label, text) => {
    for (const size of ['normal', 'large', 'xlarge']) {
      await setSize(size);
      await go('records');
      await go('home');
      const hp = await hpOf();
      assert(hp.text.includes(text), `${label}・${size}：文字が「${hp.text}」`);
      const o = await hpOverlap();
      assert(Object.values(o).every((v) => !v), `${label}・${size}：重なっている ${JSON.stringify(o)}`);
    }
  };
  try {
    await noOverlapEachSize('ボス（あと 9,000歩）', 'あと 9,000歩');
    // ボスの はじめ（いちばん 長い 数「あと 10,000歩」）
    await reset();
    await enterSample();
    await walkInStore(120000 - YAMADA_START);
    await noOverlapEachSize('ボスの はじめ', 'あと 10,000歩');
    // ふつうの敵（頭の上・とても大きいときは 足もとの下）
    await reset();
    await enterSample();
    await noOverlapEachSize('ふつうの敵', 'あと 700歩');
  } finally {
    await setSize('normal');
  }
});

/** 動きが 止まっているかを まとめて 確かめる（ホームの敵・歩行中の道・戦闘・画面に 重ねる 演出） */
const expectStill = async (label) => {
  await reset();
  await enterSample();
  await go('home');
  const enemy = await animsOf('[data-enemy-motion], [data-enemy-motion] *');
  assert(enemy.length >= 1 && enemy.every(stillAnim), `${label}：ホームの敵が 動いている（${JSON.stringify(enemy.find((a) => !stillAnim(a)))}）`);
  // 歩行中：はじめから 止まった 絵
  await page.getByRole('button', { name: /^歩きはじめる/ }).click();
  await visible(dialog('歩きスマホ防止'), '歩きスマホ防止の画面');
  await walkSceneIs('still');
  const walkAnims = await animsOf('[data-walk-anim]');
  assert(walkAnims.length > 0 && walkAnims.every(stillAnim), `${label}：歩行中の 道が 動いている（${JSON.stringify(walkAnims.find((a) => !stillAnim(a)))}）`);
  await btn('立ち止まる').click();
  await dialog('歩きスマホ防止').waitFor({ state: 'detached', timeout: 10000 });
  // 戦闘：開いた ときから 結果（たおした・ポイント）だけ
  await openResultWithSteps(2345);
  const st = await battleState();
  assert(st.state === 'done', `${label}：戦闘が はじめから おわっていない`);
  assert(st.hp.length >= 3 && st.hp.every((v) => v === 0), `${label}：戦闘の HP が ${st.hp}`);
  const pts = await shownPoints();
  assert(pts.shown === pts.read, `${label}：ポイントが すぐ 出ない（${JSON.stringify(pts)}）`);
  const battleAnims = await animsOf('[data-battle] *');
  assert(battleAnims.every(stillAnim), `${label}：戦闘の 中で 動いている（${JSON.stringify(battleAnims.find((a) => !stillAnim(a)))}）`);
  // [data-battle] の 外の 画面に 重ねる 演出（レアの 光）も 止まって 見えない
  const overlay = await page.evaluate(() => {
    const root = document.querySelector('[data-battle-overlay]');
    if (!root) return null;
    return {
      skip: root.hasAttribute('data-skip'),
      parts: [...root.querySelectorAll('*')].map((e) => {
        const cs = getComputedStyle(e);
        return { opacity: Number(cs.opacity), anim: cs.animationName === 'none' || (parseFloat(cs.animationDuration) || 0) <= 0.001, trans: (parseFloat(cs.transitionDuration) || 0) <= 0.001 };
      }),
    };
  });
  assert(overlay && overlay.skip && overlay.parts.length > 0, `${label}：画面に 重ねる 演出が ない（${JSON.stringify(overlay)}）`);
  assert(overlay.parts.every((x) => x.opacity === 0 && x.anim && x.trans), `${label}：画面に 重ねる 演出が 動いている（${JSON.stringify(overlay.parts)}）`);
  await finishResult();
};

await test('48 動きをへらす（わたしの 設定・端末の 視差効果を減らす）のとき、ホームの敵・歩行中の道・戦闘の 動きが 止まっている', async () => {
  // 「わたし」の 動きをへらす
  await reset();
  await enterSample();
  await go('me');
  await setPref('動きをへらす', true);
  try {
    await expectStill('わたしの 設定');
  } finally {
    await go('me');
    await setPref('動きをへらす', false);
  }
  // 端末の「視差効果を減らす」（prefers-reduced-motion）
  await page.emulateMedia({ reducedMotion: 'reduce' });
  try {
    await expectStill('端末の 設定');
  } finally {
    await page.emulateMedia({ reducedMotion: null });
  }
});

/** にせの AudioContext（43 と 同じ）。鳴らそうとした 音の 数を window.__audio.notes に 数える */
const fakeAudio = () => {
  const audio = { contexts: 0, notes: 0 };
  window.__audio = audio;
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
  const node = () => ({ connect() {} });
  class FakeAudioContext {
    constructor() {
      audio.contexts += 1;
      this.state = 'running';
      this.currentTime = 0;
      this.destination = node();
    }
    resume() {
      return Promise.resolve();
    }
    createGain() {
      return { ...node(), gain: param() };
    }
    createOscillator() {
      audio.notes += 1;
      return { ...node(), type: 'sine', frequency: param(), start() {}, stop() {} };
    }
  }
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
};

await test('49 成果の画面を 開いたまま 歩きはじめても、ロックの下で 音を 鳴らしなおさず、戦闘は おわりの 形', async () => {
  if (!(await page.evaluate(() => Boolean(window.__audio)))) {
    await page.addInitScript(fakeAudio);
    await page.reload();
    await page.waitForSelector('aside');
  }
  await reset();
  await enterSample();
  await go('me');
  await setPref('音', true);
  // ボタンの 音を 数えないよう、成果の画面を 開く 前に 0 に もどす
  await page.evaluate(() => (window.__audio.notes = 0));
  await openResultWithSteps(2345);
  // 1体目を たおした 音（約1.4秒）が 鳴るのを 待つ（ここまで 画面には さわらない）
  await page.waitForFunction(() => window.__audio.notes > 0, null, { timeout: 4000 }).catch(() => {
    throw new Error('成果の画面で 音を 鳴らそうとしない');
  });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.__audio.notes);
  // 画面に さわらず 体の動きで 歩く（2秒ごとに 歩数が 記録されて 成果が かわる）
  await walkMotion(8);
  await visible(dialog('歩きスマホ防止'), '歩きスマホ防止の画面');
  assert((await battleState()).state === 'done', '歩いている間も 戦闘が 動いている');
  await dialog('歩きスマホ防止').waitFor({ state: 'detached', timeout: 10000 });
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => window.__audio.notes);
  assert(after === before, `歩いている間・止まった あとに ${after - before}回 鳴らそうとした`);
  await finishResult();
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
