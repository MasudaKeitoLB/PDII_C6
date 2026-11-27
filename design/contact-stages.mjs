// 背景・遠景・ギミックの 一覧の 画像を 作る。 node design/contact-stages.mjs → design/contact/stages.png
// 8つの 背景に 今の 主人公と あまぐもを 立たせ、名前の 札・ポイントの 枠・HPバーの 場所を うすく 重ねる。
// 遠景は 2回 ならべて つなぎめを 確かめる。ギミックの 絵は 4倍。
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLAYWRIGHT = process.env.HOHO_PLAYWRIGHT ?? 'file:///C:/Users/hapic/pdii_c6/user-app/node_modules/playwright-core/index.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const A = join(here, '..', 'user-app', 'src', 'assets');
const rd = (p) => readFileSync(join(A, p), 'utf8');
const sized = (svg, k) => {
  const w = Number(svg.match(/width="([\d.]+)"/)[1]), h = Number(svg.match(/height="([\d.]+)"/)[1]);
  return svg.replace(/width="[\d.]+"/, `width="${w * k}"`).replace(/height="[\d.]+"/, `height="${h * k}"`);
};
const STAGES = [['area1', 'エリア1 はなあかりの小道'], ['area2', 'エリア2 わかばの田んぼ道'], ['area3', 'エリア3 ゆうすずみ商店街'], ['area4', 'エリア4 うみかぜの浜'],
  ['area5', 'エリア5 みのりの里山'], ['area6', 'エリア6 ゆきあかりの縁側'], ['area7', 'エリア7 めぐりの丘'], ['end', 'エンド 年こしの峠']];
const hero = rd('sprite/hero.svg'), enemy = rd('sprite/enemy-amagumo.svg');
const fx = readdirSync(join(A, 'scene', 'fx')).filter((f) => f.endsWith('.svg')).sort();

const cell = ([id, name], i) => {
  const far = sized(rd(`scene/stage/${id}-far.svg`), 0.49);
  return `<div class="st"><h3>${name}</h3>
  <div class="scene">${rd(`scene/stage/${id}-bg.svg`)}
    <div class="a" style="left:67px;top:170px">${hero}</div><div class="a" style="left:258px;top:184px">${enemy}</div>
    <div class="a pill" style="left:11px;top:61px">${name.split(' ')[1]}</div>
    <div class="a win" style="left:228px;top:61px">ポイント</div>
    <div class="a hp" style="left:223px;top:152px"></div>
  </div>
  <div class="far"><div class="two">${far}${far}</div><div class="seam"></div></div></div>`;
};
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
body{margin:0;padding:16px;width:1260px;background:#fbf6ea;color:#1e1b18;font-family:"BIZ UDPGothic",Meiryo,sans-serif}
h1{font-size:20px;margin:0 0 8px}h2{font-size:17px;margin:16px 0 6px}h3{font-size:14px;margin:0 0 4px}
.grid{display:grid;grid-template-columns:repeat(3,395px);gap:16px 20px}
.scene{position:relative;width:395px;height:420px;overflow:hidden}.scene svg{display:block}.a{position:absolute}.a svg{display:block}
.pill{background:rgba(27,34,64,.78);color:#fff;font-size:16px;font-weight:700;padding:5px 12px 6px;border-radius:14px}
.win{width:155px;height:50px;background:rgba(255,255,255,.7);border:2px solid #1b2240;box-sizing:border-box;font-size:13px;padding:4px}
.hp{width:150px;height:14px;background:rgba(255,255,255,.6);border:2px solid #1b2240;box-sizing:border-box}
.far{position:relative;width:395px;height:70px;background:#c9d6e0;margin-top:2px}.two{display:flex;width:790px}.two svg{display:block}
.seam{position:absolute;left:196px;top:0;height:70px;border-left:1px dashed #e33}
.fx{display:flex;flex-wrap:wrap;gap:14px;background:#d9d2c2;padding:10px}.fx figure{margin:0;text-align:center;font-size:11px}.fx .b{background:#8FD0F2;padding:4px}
.fx svg{display:block}.dark .b{background:#2D3A6B}
</style></head><body><h1>背景8つ（主人公・あまぐも・名前の札・ポイントの枠・HPバーの 場所つき）と 遠景（2回ならべ。赤い点線が つなぎめ）</h1>
<div class="grid">${STAGES.map(cell).join('')}</div>
<h2>ギミックの絵（4倍。空色の 上と 紺の 上）</h2>
<div class="fx">${fx.map((f) => `<figure><div class="b">${sized(rd(`scene/fx/${f}`), 4)}</div>${f.replace('.svg', '')}</figure>`).join('')}</div>
<div class="fx dark">${fx.map((f) => `<figure><div class="b">${sized(rd(`scene/fx/${f}`), 4)}</div>${f.replace('.svg', '')}</figure>`).join('')}</div>
</body></html>`;
const { chromium } = await import(PLAYWRIGHT);
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1292, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  mkdirSync(join(here, 'contact'), { recursive: true });
  await page.screenshot({ path: join(here, 'contact', 'stages.png'), fullPage: true });
  console.log('作りました： design/contact/stages.png');
} finally { await browser.close(); }
