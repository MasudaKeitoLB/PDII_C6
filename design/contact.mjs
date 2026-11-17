// 一覧の画像（コンタクトシート）を作る。
// 使い方： node design/contact.mjs            → design/contact/area1.png
//          node design/contact.mjs area2      → design/contact/area2.png（エリアを えらぶ）
//          node design/contact.mjs --parts <フォルダ>  （行ごとの 画像も 出す。目で 確かめる用）
// Playwright は もとの リポジトリに 入っている playwright-core と、PC の Chrome を 使う。
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSprites } from './build-sprites.mjs';

const PLAYWRIGHT = process.env.HOHO_PLAYWRIGHT ?? 'file:///C:/Users/hapic/pdii_c6/user-app/node_modules/playwright-core/index.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const SPRITE_DIR = join(here, '..', 'user-app', 'src', 'assets', 'sprite');

// エリアごとの 並び（5章の 表の 順）。file を 書かない ものは enemy-<id>.svg を 使う
const AREAS = {
  area1: {
    title: 'エリア1　はなあかりの小道（春）',
    scene: 'linear-gradient(#8FD0F2 0 80%, #6CC04A 80% 100%)',
    ids: [
      { id: 'amagumo', name: 'あまぐも' },
      // いしころんは 小さい絵（1マス 3px）しか ないので、5/3倍で 同じ ドットの 大きさに する
      { id: 'ishikoron', name: 'いしころん', file: 'enemy-ishikoron-small.svg', zoom: 5 / 3 },
      { id: 'happappa', name: 'はっぱっぱ' },
      'tsukushinbo', 'fuwawatage', 'hirachou', 'mitsudango', 'nokitsubame', 'tsuchimoko',
      'takenokon', 'bunbunbachi', 'oborozuki', 'donburako', 'hanafubuki',
    ],
  },
  area2: {
    title: 'エリア2　わかばの田んぼ道（初夏）',
    scene: 'linear-gradient(#C3D0E0 0 80%, #3E9A63 80% 100%)',
    sceneLabel: '雨雲と 田んぼ',
    ids: [
      'azegaeru', 'dendenmaru', 'ajisaidama', 'otamakko', 'noborigoi', 'terubouzu', 'pichagutsu',
      'mizutamari', 'naetaba', 'kamikabuto', 'potsurin', 'amenbou', 'hotarubi', 'samidare',
    ],
  },
  area3: {
    title: 'エリア3　ゆうすずみ商店街（夏）',
    scene: 'linear-gradient(#2D3A6B 0 80%, #7A5C4A 80% 100%)',
    sceneLabel: '夕やみと 灯りの 道',
    ids: [
      'chouchin', 'kintoto', 'fuurinrin', 'kakigoori', 'patauchiwa', 'kayaributa', 'asagaon',
      'ramunebin', 'omensan', 'karakorogeta', 'hanabidon', 'akaposuto', 'ooatari', 'matsuribayashi',
    ],
  },
};

const names = Object.fromEntries(listSprites().map((s) => [s.id, s.name]));

function svgAt(entry, scale) {
  const e = typeof entry === 'string' ? { id: entry, name: names[entry] ?? entry } : entry;
  let svg = readFileSync(join(SPRITE_DIR, e.file ?? `enemy-${e.id}.svg`), 'utf8');
  const w = Number(svg.match(/width="([\d.]+)"/)[1]);
  const h = Number(svg.match(/height="([\d.]+)"/)[1]);
  const k = scale * (e.zoom ?? 1);
  svg = svg
    .replace(/width="[\d.]+"/, `width="${w * k}"`)
    .replace(/height="[\d.]+"/, `height="${h * k}"`)
    .replace('<svg ', '<svg shape-rendering="crispEdges" ')
    .replace(/(<svg shape-rendering="crispEdges" [^>]*?) shape-rendering="crispEdges"/, '$1');
  const box = Math.max(80, Math.ceil((Math.max(w, h) * (e.zoom ?? 1)) / 80) * 80) * scale;
  return `<figure><div class="box" style="width:${box}px;height:${box}px">${svg}</div><figcaption>${e.name}</figcaption></figure>`;
}

function html(area) {
  const rows = (bg, label) => `
    <section class="panel" style="--bg:${bg}">
      <h2>${label}</h2>
      <div class="row r1"><h3>実際の大きさ（1マス 5px）</h3><div class="items">${area.ids.map((e) => svgAt(e, 1)).join('')}</div></div>
      <div class="row r3"><h3>3倍</h3><div class="items">${area.ids.map((e) => svgAt(e, 3)).join('')}</div></div>
    </section>`;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 16px; width: 1368px; background: #fbf6ea; color: #1e1b18;
      font-family: "BIZ UDPGothic", Meiryo, sans-serif; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 16px 0 4px; }
    h3 { font-size: 14px; margin: 8px 0 4px; font-weight: normal; }
    .row { padding: 4px 8px 8px; background: #fff; border: 2px solid #d9cfbf; margin-bottom: 8px; }
    .items { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    figure { margin: 0; text-align: center; }
    .box { background: var(--bg); display: flex; align-items: flex-end; justify-content: center; }
    .box svg { display: block; }
    figcaption { font-size: 13px; line-height: 20px; }
  </style></head><body>
    <h1>${area.title}　一覧</h1>
    ${rows('#ffffff', '背景：白')}
    ${rows(area.scene, `背景：場面の色（${area.sceneLabel ?? '空と 土手'}）`)}
  </body></html>`;
}

async function main() {
  const key = process.argv.find((a) => AREAS[a]) ?? 'area1';
  const partsAt = process.argv.indexOf('--parts');
  const { chromium } = await import(PLAYWRIGHT);
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
    await page.setContent(html(AREAS[key]));
    const outDir = join(here, 'contact');
    mkdirSync(outDir, { recursive: true });
    await page.screenshot({ path: join(outDir, `${key}.png`), fullPage: true });
    console.log(`作りました： design/contact/${key}.png`);
    if (partsAt > 0) {
      const dir = process.argv[partsAt + 1];
      mkdirSync(dir, { recursive: true });
      const rows = await page.locator('.row').all();
      for (let i = 0; i < rows.length; i += 1) await rows[i].screenshot({ path: join(dir, `${key}-part${i + 1}.png`) });
      console.log(`行ごとの 画像： ${dir}`);
    }
  } finally {
    await browser.close();
  }
}

main();
