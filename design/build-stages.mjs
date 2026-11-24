// エリアごとの 背景（395×420）と 流れる遠景（400×140）を 作る。1マス 5px。
// 使い方： node design/build-stages.mjs
//   → user-app/src/assets/scene/stage/area1-bg.svg 〜 area7-bg.svg、end-bg.svg
//   → user-app/src/assets/scene/stage/area1-far.svg 〜 area7-far.svg、end-far.svg
// 場所は 今の home-bg.svg と そろえてある（マス目で：道 50〜56行、主人公 x=13〜30・足もと 56行、敵 x=51〜66・足もと 50行）。
// 目じるしは 主人公と 敵の あいだ（x=29〜48）に 置く。動くもの（花びら・雨・鳥など）は 描かない（fx/ の 絵を 別に 動かす）。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid, rng, toSvg } from './pix.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'user-app', 'src', 'assets', 'scene', 'stage');
const W = 79, H = 84, CELL = 5;
const sin = Math.sin;
const wave = (x, k, ph = 0) => sin((2 * Math.PI * k * x) / W + ph);

/** 空・遠い 丘・近い 丘・地面・道・手前の 地面 を 描く 土台 */
function base(g, P) {
  let r0 = 0;
  for (const [end, col] of P.sky) { g.rect(0, r0, W, end - r0, col); r0 = end; }
  const rr = rng(P.seed ?? 1);
  if (P.far) for (let x = 0; x < W; x++) {
    const top = Math.round(P.far.base + P.far.amp * (wave(x, 2, 1) + 0.6 * wave(x, 5, 2)));
    for (let y = top; y < 50; y++) g.put(x, y, y === top && P.far.edge ? P.far.edge : P.far.col);
  }
  if (P.mid) for (let x = 0; x < W; x++) {
    const top = Math.round(P.mid.base + P.mid.amp * (wave(x, 3, 0.5) + 0.5 * wave(x, 7, 1)));
    for (let y = top; y < 50; y++) g.put(x, y, y === top && P.mid.edge ? P.mid.edge : P.mid.col);
  }
  g.rect(0, P.groundTop ?? 43, W, 50 - (P.groundTop ?? 43), P.ground);
  if (P.groundDots) for (let k = 0; k < 60; k++) g.put(Math.floor(rr() * W), (P.groundTop ?? 43) + Math.floor(rr() * 7), P.groundDots);
  const R = P.road;
  g.rect(0, 50, W, 1, R.edge);
  g.rect(0, 51, W, 2, R.top);
  g.rect(0, 53, W, 2, R.mid);
  g.rect(0, 55, W, 1, R.low);
  g.rect(0, 56, W, 1, R.line ?? R.low);
  for (let k = 0; k < 40; k++) g.put(Math.floor(rr() * W), 51 + Math.floor(rr() * 4), R.dot ?? R.low);
  g.rect(0, 57, W, H - 57, P.fg);
  if (P.fgDots) for (let k = 0; k < 150; k++) g.put(Math.floor(rr() * W), 57 + Math.floor(rr() * 27), P.fgDots[k % P.fgDots.length]);
}

function pine(g, cx, baseY, h, col, snow, light) {
  for (let i = 0; i < h; i++) {
    const half = Math.floor((i * 3.2) / h) + (i > 0 ? 1 : 0) + Math.floor(i / 4);
    const y = baseY - h + 1 + i;
    g.rect(cx - half, y, half * 2 + 1, 1, col);
    if (snow && i % 3 === 0) g.rect(cx - half, y, half * 2 + 1, 1, snow);
    if (light && i % 3 === 1) g.put(cx - half, y, light);
  }
  g.rect(cx, baseY, 1, 2, '#5C3A20');
}

const STAGES = {};
const FAR = {};

/* ---------- 1 桜の大木 ---------- */
STAGES.area1 = ['エリア1 はなあかりの小道（春）：さくらの大木', (g) => {
  base(g, {
    seed: 1, sky: [[10, '#8FD0F2'], [22, '#A9DCF6'], [34, '#C8EAF9'], [43, '#D8F0F9']],
    far: { base: 33, amp: 2, col: '#B6DCCD', edge: '#CBE6DC' }, mid: { base: 39, amp: 2, col: '#93C7B4', edge: '#B6DCCD' },
    ground: '#7FC46C', groundDots: '#9AD486', groundTop: 43,
    road: { edge: '#7DB65A', top: '#DCCDA6', mid: '#D3C39A', low: '#C2B088', line: '#B09E76' },
    fg: '#62B04E', fgDots: ['#4A9A40', '#F49AB8', '#4A9A40', '#FFE066'],
  });
  const r = rng(11);
  // 遠くの さくら
  for (const x of [3, 9, 55, 63, 71, 76]) { g.ell(x, 35, 3, 2, '#F2A7B8'); g.rect(x, 37, 1, 2, '#7A4E2A'); g.put(x - 1, 34, '#F9DDE3'); }
  // 大木：みき
  g.rect(37, 34, 4, 15, '#7A4E2A'); g.rect(40, 34, 1, 15, '#5C3A20'); g.rect(36, 47, 1, 2, '#7A4E2A'); g.rect(41, 47, 1, 2, '#5C3A20');
  g.line(37, 37, 31, 32, '#7A4E2A'); g.line(40, 37, 46, 31, '#5C3A20'); g.line(38, 35, 37, 28, '#7A4E2A');
  // かんむり
  const inC = (x, y) =>
    ((x - 38) / 9.5) ** 2 + ((y - 27) / 6.5) ** 2 <= 1 || ((x - 30) / 5.5) ** 2 + ((y - 31) / 3.8) ** 2 <= 1 ||
    ((x - 46) / 5.5) ** 2 + ((y - 30) / 4) ** 2 <= 1 || ((x - 38) / 6) ** 2 + ((y - 21.5) / 3.8) ** 2 <= 1 ||
    ((x - 34) / 4) ** 2 + ((y - 33) / 2.2) ** 2 <= 1;
  for (let y = 16; y < 38; y++) for (let x = 22; x < 56; x++) if (inC(x, y)) {
    let c = '#F2A7B8';
    if (!inC(x, y + 1) || (!inC(x + 1, y) && y > 27)) c = '#E58AA3';
    else if (!inC(x, y - 1) || ((x * 7 + y * 3) % 11 === 0)) c = '#F9DDE3';
    else if ((x * 5 + y * 13) % 9 === 0) c = '#F5B9C8';
    g.put(x, y, c);
  }
  // 地面に 花びら と 菜の花
  for (let k = 0; k < 26; k++) g.put(30 + Math.floor(r() * 20), 47 + Math.floor(r() * 3), k % 3 ? '#F2A7B8' : '#F9DDE3');
  for (const x of [8, 14, 22, 52, 60, 67, 74]) { g.put(x, 46, '#FFE066'); g.put(x, 47, '#6CC04A'); g.put(x + 3, 48, '#FFE066'); }
}];
FAR.area1 = [(g) => {
  const ph = (x, k, p = 0) => sin((2 * Math.PI * k * x) / 80 + p);
  for (let x = 0; x < 80; x++) { const t = Math.round(7 + 3 * ph(x, 2, 1) + 1.5 * ph(x, 3)); for (let y = t; y < 22; y++) g.put(x, y, '#C3D6E0'); }
  for (let x = 0; x < 80; x++) { const t = Math.round(13 + 2 * ph(x, 2, 3) + ph(x, 5)); for (let y = t; y < 22; y++) g.put(x, y, '#B6DCCD'); }
  for (const x of [6, 19, 33, 48, 61, 72]) { g.rect(x, 12, 1, 4, '#7A4E2A'); g.ell(x, 10, 3.5, 2.5, '#F2A7B8'); g.put(x - 1, 9, '#F9DDE3'); g.put(x + 1, 11, '#E58AA3'); }
}];

/* ---------- 2 水車と田んぼ ---------- */
STAGES.area2 = ['エリア2 わかばの田んぼ道（初夏）：水車と田んぼ', (g) => {
  base(g, {
    seed: 2, sky: [[7, '#B7C4D6'], [16, '#C3D0E0'], [28, '#D5DEEA'], [43, '#E3EAF2']],
    far: { base: 31, amp: 2, col: '#8FB89A', edge: '#A8CBB0' }, mid: { base: 38, amp: 2, col: '#6FA67F', edge: '#8FB89A' },
    ground: '#3E9A63', groundTop: 42,
    road: { edge: '#3E9A63', top: '#BDB28A', mid: '#B4A981', low: '#A59A73', dot: '#A59A73' },
    fg: '#3E9A63', fgDots: ['#6BB07A', '#2F8553', '#6BB07A', '#A8D672'],
  });
  // 雨雲
  for (const [x, y, rx] of [[8, 3, 9], [24, 5, 8], [44, 2, 10], [62, 5, 9], [74, 2, 7]]) {
    g.ell(x, y, rx, 3, '#A9B7CC'); g.ell(x - 2, y - 1.5, rx - 3, 2, '#B9C5D8'); g.ell(x + 2, y + 2, rx - 2, 1.4, '#98A7BF');
  }
  // 田んぼ（水と 苗）
  for (let y = 42; y < 50; y++) {
    if ((y - 42) % 2 === 1) { g.rect(0, y, W, 1, '#6BB07A'); continue; }
    for (let x = 0; x < W; x++) g.put(x, y, (x + y) % 4 < 2 ? '#C3D0E0' : '#9FB4D4');
    for (let x = (y % 4) + 1; x < W; x += 4) { g.put(x, y, '#3E9A63'); g.put(x, y - 1, '#A8D672'); }
  }
  // あじさい
  for (const [x, y] of [[4, 47], [9, 48], [71, 47], [76, 48]]) {
    g.rect(x - 1, y + 1, 4, 1, '#3E9A63');
    g.ell(x + 1, y, 2.6, 1.8, '#7A8FD0'); g.put(x, y - 1, '#A9B7E8'); g.put(x + 2, y, '#A9B7E8'); g.put(x + 1, y + 1, '#5E72B8');
  }
  g.ox = 3;
  // 水車小屋
  g.rect(39, 37, 10, 11, '#C9A46A'); for (let x = 40; x < 49; x += 3) g.rect(x, 37, 1, 11, '#B08E55');
  g.rect(48, 37, 1, 11, '#9A7A48'); g.rect(39, 47, 10, 1, '#7A5A38');
  for (let k = 0; k < 7; k++) { const w = 3 + k * 2; g.rect(44 - ((w - 1) >> 1), 30 + k, w, 1, k === 0 ? '#4B5A6F' : '#6B7A8F'); g.put(44 - ((w - 1) >> 1), 30 + k, '#8A99AE'); }
  g.rect(37, 36, 14, 1, '#4B5A6F'); g.rect(44, 41, 3, 6, '#5C3A20'); g.rect(41, 40, 2, 2, '#FFE9A8');
  // 水車
  const cx = 34.5, cy = 40.5, R = 7;
  g.rect(28, 31, 9, 1, '#7A4E2A'); g.rect(29, 32, 1, 3, '#9FB4D4'); g.rect(30, 33, 1, 2, '#C3D0E0');
  for (let a = 0; a < 360; a += 3) {
    const t = (a * Math.PI) / 180;
    g.put(cx + R * Math.cos(t), cy + R * Math.sin(t), '#7A4E2A');
    if (a % 45 === 0) { g.line(cx, cy, cx + R * Math.cos(t), cy + R * Math.sin(t), '#9A6A3A'); g.rect(cx + (R + 0.5) * Math.cos(t) - 0.5, cy + (R + 0.5) * Math.sin(t) - 0.5, 2, 2, '#5C3A20'); }
  }
  g.rect(cx - 1, cy - 1, 2, 2, '#3B2A1A');
  g.rect(28, 47, 22, 2, '#9FB4D4'); g.rect(29, 48, 8, 1, '#C3D0E0'); g.rect(40, 47, 8, 1, '#C3D0E0');
  g.ox = 0;
}];
FAR.area2 = [(g) => {
  const ph = (x, k, p = 0) => sin((2 * Math.PI * k * x) / 80 + p);
  for (let x = 0; x < 80; x++) { const t = Math.round(8 + 2.5 * ph(x, 2) + 1.5 * ph(x, 4, 1)); for (let y = t; y < 22; y++) g.put(x, y, '#8FB89A'); }
  for (let x = 0; x < 80; x++) { const t = Math.round(13 + 2 * ph(x, 3, 2) + ph(x, 6)); for (let y = t; y < 22; y++) g.put(x, y, '#6FA67F'); }
  for (const x of [10, 38, 64]) { g.rect(x, 14, 7, 4, '#E6D8B0'); for (let k = 0; k < 3; k++) g.rect(x - k + 0 - 0 + 1 - 1 + k - k, 13 - k, 1, 1, null); g.rect(x - 1, 12, 9, 2, '#6B7A8F'); g.rect(x + 1, 11, 5, 1, '#6B7A8F'); g.rect(x + 3, 15, 2, 3, '#5C3A20'); }
  for (let x = 0; x < 80; x++) if (x % 5 < 3) g.put(x, 18, '#E3EAF2cc');
  for (let x = 2; x < 80; x += 7) for (let y = 19; y < 22; y++) if ((x + y) % 2) g.put(x, y, '#3E9A63');
}];

/* ---------- 3 商店街 ---------- */
STAGES.area3 = ['エリア3 ゆうすずみ商店街（夏）：商店街のアーチと ちょうちん', (g) => {
  base(g, {
    seed: 3, sky: [[8, '#2D3A6B'], [18, '#3B4A85'], [28, '#5A5F9A'], [36, '#8B6B8F'], [43, '#D98B5A']],
    far: { base: 36, amp: 1, col: '#4A3F70' }, ground: '#80614E', groundTop: 43,
    road: { edge: '#A98A72', top: '#9A7B64', mid: '#8B6B55', low: '#80614E', line: '#6C5040', dot: '#6C5040' },
    fg: '#7A5C4A',
  });
  const r = rng(33);
  for (let k = 0; k < 18; k++) g.put(Math.floor(r() * W), Math.floor(r() * 18), k % 2 ? '#FFFFFF' : '#C9CCEA');
  // 石だたみ（手前）
  for (let y = 57; y < H; y += 4) { g.rect(0, y, W, 1, '#6C5040'); for (let x = ((y / 4) % 2) * 4; x < W; x += 8) g.rect(x, y + 1, 1, 3, '#6C5040'); }
  g.ell(12, 64, 8, 3, '#8F6B50'); g.ell(66, 64, 8, 3, '#8F6B50'); g.ell(12, 64, 4, 1.4, '#B8895A'); g.ell(66, 64, 4, 1.4, '#B8895A');
  // 家なみ（左はし・右はし だけ 灯りを 入れる。主人公と 敵の うしろは 暗く しずか）
  const shop = (x, top, w, wall, roof, lit) => {
    g.rect(x, top, w, 50 - top, wall); g.rect(x - 1, top - 2, w + 2, 2, roof); g.rect(x - 1, top - 3, w + 2, 1, '#6B5F9A');
    if (lit) for (let y = top + 3; y < 45; y += 5) for (let xx = x + 1; xx < x + w - 1; xx += 4) { g.rect(xx, y, 2, 2, '#FFC53D'); g.put(xx, y + 2, '#B8895A'); }
  };
  shop(0, 31, 8, '#4A3F70', '#3B2F3F', true); shop(8, 34, 6, '#5A4F85', '#3B2F3F', true);
  shop(14, 37, 8, '#3F3562', '#34294F', false); shop(22, 39, 7, '#463B6B', '#34294F', false);
  shop(50, 38, 7, '#463B6B', '#34294F', false); shop(57, 36, 8, '#3F3562', '#34294F', false); shop(65, 39, 6, '#463B6B', '#34294F', false);
  shop(71, 32, 8, '#4A3F70', '#3B2F3F', true);
  // のれん
  g.rect(2, 40, 4, 3, '#C2410C'); g.rect(73, 40, 4, 3, '#C2410C');
  g.ox = -3;
  // アーチ
  for (const px of [31, 45]) {
    g.rect(px, 21, 3, 28, '#C2410C'); g.rect(px, 21, 1, 28, '#E8732C'); g.rect(px - 1, 47, 5, 2, '#6C5040');
  }
  g.rect(29, 19, 19, 3, '#3B2F3F'); g.rect(28, 18, 2, 1, '#3B2F3F'); g.rect(47, 18, 2, 1, '#3B2F3F'); g.rect(30, 19, 17, 1, '#5C4A60');
  g.rect(31, 22, 16, 2, '#C2410C'); g.rect(31, 22, 16, 1, '#E8732C');
  g.rect(34, 24, 11, 8, '#4A3F70'); g.rect(34, 24, 11, 1, '#FFC53D'); g.rect(34, 31, 11, 1, '#FFC53D');
  for (let x = 36; x < 44; x += 3) { g.rect(x, 26, 2, 4, '#FFC53D'); g.put(x, 28, '#4A3F70'); }
  for (const lx of [35, 43]) { g.rect(lx, 32, 1, 1, '#3B2F3F'); g.rect(lx - 1, 33, 3, 4, '#C2410C'); g.rect(lx, 34, 1, 2, '#FFC53D'); g.rect(lx - 1, 37, 3, 1, '#3B2F3F'); }
  g.ox = 0;
  // ちょうちんの 列
  for (let x = 0; x < W; x++) { const m = x % 13; g.put(x, 2 + Math.round(3 * (1 - ((m - 6) / 6.5) ** 2)), '#3B2F3F'); }
  for (let k = 0, x = 6; x < W; x += 13, k++) {
    const col = k % 2 ? '#E8732C' : '#C2410C';
    g.rect(x - 1, 6, 3, 1, '#3B2F3F'); g.rect(x - 1, 7, 3, 4, col); g.rect(x, 8, 1, 2, '#FFC53D'); g.rect(x - 1, 11, 3, 1, '#3B2F3F');
  }
}];
FAR.area3 = [(g) => {
  const r = rng(303);
  let x = 0;
  const cols = ['#4A3F70', '#3B2F3F', '#5A4F85', '#463B6B'];
  const widths = [9, 7, 10, 8, 9, 8, 11, 9, 9]; // 合計 80
  widths.forEach((w, k) => {
    const top = 8 + (k * 5) % 7;
    g.rect(x, top, w, 22 - top, cols[k % 4]); g.rect(x - 1, top - 2, w + 2, 2, '#34294F'); g.rect(x, top - 3, w, 1, '#6B5F9A');
    for (let y = top + 2; y < 20; y += 4) for (let xx = x + 1; xx < x + w - 1; xx += 4) { if (r() < 0.55) { g.rect(xx, y, 2, 2, '#FFC53D'); } }
    g.put(x + 1, top + 1, '#E8732C'); g.put(x + w - 2, top + 1, '#C2410C');
    x += w;
  });
}];

/* ---------- 4 灯台と海 ---------- */
STAGES.area4 = ['エリア4 うみかぜの浜（盛夏）：灯台と海', (g) => {
  const r = rng(44);
  base(g, {
    seed: 4, sky: [[8, '#6FBDEB'], [18, '#8FD0F2'], [31, '#B5E0F7']],
    ground: '#EFE4C3', groundTop: 45, groundDots: '#E0D2A8',
    road: { edge: '#D9C998', top: '#EFE4C3', mid: '#EBDFBC', low: '#E0D2A8', line: '#D6C79A', dot: '#D6C79A' },
    fg: '#EBDFBC', fgDots: ['#E0D2A8', '#EFE4C3', '#D6C79A', '#F2C9C0'],
  });
  // 入道雲
  for (const [x, y, rx, ry] of [[14, 4, 11, 3.5], [24, 6, 8, 3], [62, 5, 12, 4], [72, 8, 7, 3], [64, 22, 9, 3]]) {
    g.ell(x, y, rx, ry, '#F4F7FB'); g.ell(x, y + ry * 0.6, rx - 1, ry * 0.5, '#C8D7EA'); g.ell(x - 2, y - ry * 0.5, rx / 2, ry * 0.5, '#FFFFFF');
  }
  // 海
  g.rect(0, 31, W, 5, '#3D7FCC'); g.rect(0, 36, W, 5, '#5C93CC'); g.rect(0, 41, W, 4, '#7EAEDC'); g.rect(0, 31, W, 1, '#2F6DB4');
  for (let y = 33; y < 45; y += 3) for (let x = Math.floor(r() * 6); x < W; x += 7 + Math.floor(r() * 5)) { const w = 2 + Math.floor(r() * 3); g.rect(x, y, w, 1, '#FFFFFF'); g.put(x + w, y, '#E3EEF8'); }
  for (let x = 0; x < W; x++) g.put(x, 45 + ((x >> 1) % 2), '#FFFFFF');
  // 島と ヨット雲の かわりの 遠い 島
  g.ell(10, 31, 6, 2, '#6B8FB8'); g.ell(70, 31, 7, 2, '#6B8FB8');
  // いわ
  g.ell(39, 48, 10, 6, '#9A968C'); g.ell(36, 46, 6, 3, '#B8B4A8'); g.rect(30, 49, 20, 1, '#7A766C'); g.ell(45, 49, 4, 2, '#7A766C');
  // 灯台
  for (let y = 25; y <= 44; y++) {
    const half = 2 + Math.round(((y - 25) * 1.2) / 19 * 1.5);
    const x0 = 39 - half, w = half * 2;
    const band = Math.floor((y - 25) / 4) % 2 === 0;
    g.rect(x0, y, w, 1, band ? '#F4F7FB' : '#C2410C');
    g.put(x0 + w - 1, y, band ? '#C8D7EA' : '#8E2C07');
    g.put(x0, y, band ? '#FFFFFF' : '#E8732C');
  }
  g.rect(34, 24, 11, 1, '#3B4A6B'); g.rect(35, 23, 9, 1, '#5C6B8B');
  g.rect(36, 19, 7, 4, '#3B4A6B'); g.rect(37, 19, 5, 4, '#FFE9A8'); g.rect(39, 19, 1, 4, '#3B4A6B'); g.rect(37, 19, 2, 1, '#FFFFFF');
  g.rect(35, 18, 9, 1, '#C2410C'); g.rect(37, 17, 5, 1, '#C2410C'); g.rect(38, 16, 3, 1, '#C2410C'); g.rect(39, 15, 1, 1, '#3B4A6B');
  g.rect(38, 40, 2, 4, '#3B4A6B'); g.rect(38, 41, 2, 2, '#FFE9A8');
  // ひまわり
  for (const x of [3, 8, 73, 76]) {
    const top = 41 + (x % 3);
    g.rect(x, top + 3, 1, 50 - top - 3, '#3E9A63'); g.rect(x + 1, top + 7, 2, 1, '#3E9A63');
    g.ell(x + 0.5, top + 1, 3, 2.6, '#FFD161'); g.ell(x + 0.5, top + 1, 1.4, 1.2, '#7A4E2A');
  }
  g.put(14, 52, '#F2C9C0'); g.put(15, 52, '#E7A9A0');
}];
FAR.area4 = [(g) => {
  const r = rng(404);
  g.rect(0, 8, 80, 6, '#3D7FCC'); g.rect(0, 14, 80, 5, '#5C93CC'); g.rect(0, 19, 80, 3, '#7EAEDC');
  for (let y = 10; y < 22; y += 3) for (let x = Math.floor(r() * 5); x < 80; x += 6 + Math.floor(r() * 4)) { g.rect(x, y, 3, 1, '#FFFFFF'); g.put(x + 3, y, '#E3EEF8'); }
  for (let x = 20; x < 36; x++) { const t = 5 + Math.round(((x - 28) / 8) ** 2 * 3); for (let y = t; y < 8; y++) g.put(x, y, '#6B8FB8'); }
  for (let x = 60; x < 70; x++) { const t = 6 + Math.round(((x - 65) / 5) ** 2 * 2); for (let y = t; y < 8; y++) g.put(x, y, '#6B8FB8'); }
  g.ell(8, 3, 6, 2, '#F4F7FB'); g.ell(8, 4.5, 5, 1, '#C8D7EA'); g.ell(46, 2, 8, 2, '#F4F7FB'); g.ell(46, 3.5, 7, 1, '#C8D7EA');
}];

/* ---------- 5 わらぶき屋根と 柿の木 ---------- */
STAGES.area5 = ['エリア5 みのりの里山（秋）：わらぶきの家と 柿の木', (g) => {
  const r = rng(55);
  base(g, {
    seed: 5, sky: [[9, '#7FB6E0'], [20, '#A9CFE3'], [31, '#F3D9A0'], [43, '#F6C98A']],
    far: { base: 33, amp: 2, col: '#E6B86A', edge: '#F0CB88' }, mid: { base: 39, amp: 2, col: '#C98F4A', edge: '#D9A460' },
    ground: '#E2B04A', groundTop: 43, groundDots: '#C98F4A',
    road: { edge: '#9A7440', top: '#C79A5E', mid: '#BC8F55', low: '#A87E48', line: '#94693A', dot: '#A87E48' },
    fg: '#B58B4F', fgDots: ['#A87E48', '#C79A5E', '#94693A', '#D9822B'],
  });
  // 夕やけ雲
  for (const [x, y, w] of [[12, 8, 14], [34, 12, 12], [58, 7, 16], [70, 14, 8]]) { g.rect(x, y, w, 1, '#F6B89A'); g.rect(x + 2, y + 1, w - 4, 1, '#F3D9A0'); }
  // 田んぼの 刈りあと
  for (let y = 44; y < 50; y += 2) for (let x = 0; x < W; x++) if ((x + y) % 3 === 0) g.put(x, y, '#EFC866');
  // わらぶきの家
  for (let k = 0; k < 10; k++) {
    const w = 3 + 2 * k; g.rect(38 - ((w - 1) >> 1), 26 + k, w, 1, '#D9B65A');
    for (let x = 38 - ((w - 1) >> 1); x < 38 - ((w - 1) >> 1) + w; x++) if ((x + k * 2) % 4 === 0) g.put(x, 26 + k, '#B58B3A');
    g.put(38 - ((w - 1) >> 1), 26 + k, '#EBCB7A'); g.put(38 + ((w - 1) >> 1), 26 + k, '#A07A2E');
  }
  g.rect(28, 36, 21, 1, '#8A6A2A'); g.put(37, 25, '#7A4E2A'); g.put(39, 25, '#7A4E2A'); g.put(38, 24, '#7A4E2A');
  g.rect(31, 37, 15, 10, '#F4E8C8'); g.rect(31, 37, 15, 1, '#7A4E2A');
  for (const x of [31, 38, 45]) g.rect(x, 37, 1, 10, '#7A4E2A');
  g.rect(36, 41, 4, 6, '#5C3A20'); g.rect(33, 40, 3, 3, '#FFE9A8'); g.rect(33, 41, 3, 1, '#B58B3A'); g.rect(41, 40, 3, 3, '#FFE9A8'); g.rect(42, 40, 1, 3, '#B58B3A');
  g.rect(31, 47, 15, 1, '#7A5A38');
  // 柿の木
  g.rect(4, 33, 2, 16, '#5C3A20'); g.rect(5, 33, 1, 16, '#3F2A18'); g.line(4, 36, 1, 32, '#5C3A20'); g.line(5, 35, 9, 31, '#5C3A20');
  const inC = (x, y) => ((x - 5) / 7) ** 2 + ((y - 29) / 5.2) ** 2 <= 1 || ((x - 1) / 3.5) ** 2 + ((y - 31) / 3) ** 2 <= 1;
  for (let y = 22; y < 37; y++) for (let x = 0; x < 14; x++) if (inC(x, y)) g.put(x, y, !inC(x, y + 1) ? '#8A6A2A' : (x * 3 + y * 5) % 7 === 0 ? '#D9A460' : '#B9893A');
  for (const [x, y] of [[2, 28], [6, 26], [9, 30], [4, 32], [11, 28], [7, 33]]) { g.rect(x, y, 2, 2, '#E8732C'); g.put(x, y, '#F29A52'); g.put(x + 1, y + 1, '#B84E12'); }
  // すすき
  for (const x of [70, 74, 2, 8]) for (let h = 0; h < 7; h++) { g.put(x, 77 - h, '#B9A24E'); if (h > 3) g.put(x + (h % 2 ? 0 : 1), 77 - h, '#F5EBC4'); }
  for (let k = 0; k < 9; k++) { const x = Math.floor(r() * W), y = 58 + Math.floor(r() * 24); g.put(x, y, '#D9822B'); g.put(x + 1, y, '#FFC53D'); }
}];
FAR.area5 = [(g) => {
  const ph = (x, k, p = 0) => sin((2 * Math.PI * k * x) / 80 + p);
  for (let x = 0; x < 80; x++) { const t = Math.round(8 + 3 * ph(x, 2, 1) + 1.5 * ph(x, 4)); for (let y = t; y < 22; y++) g.put(x, y, '#E6B86A'); }
  for (let x = 0; x < 80; x++) { const t = Math.round(13 + 2 * ph(x, 3, 0.5) + ph(x, 6)); for (let y = t; y < 22; y++) g.put(x, y, '#C98F4A'); }
  for (const x of [5, 27, 44, 68]) { g.rect(x, 12, 1, 4, '#5C3A20'); g.ell(x, 10, 3, 2.2, x % 2 ? '#D9822B' : '#A63D2F'); g.put(x - 1, 9, '#FFC53D'); }
  for (const x of [14, 56]) { for (let k = 0; k < 4; k++) g.rect(x + 3 - k - 0, 9 + k, 2 * k + 3 - 0 > 0 ? 2 * k + 1 : 1, 1, null); for (let k = 0; k < 4; k++) g.rect(x + 3 - k, 9 + k, 2 * k + 1, 1, '#D9B65A'); g.rect(x + 1, 13, 5, 3, '#F4E8C8'); g.rect(x + 3, 14, 1, 2, '#5C3A20'); }
}];

/* ---------- 6 雪の縁側の家 ---------- */
STAGES.area6 = ['エリア6 ゆきあかりの縁側（冬）：雪の縁側の家', (g) => {
  const r = rng(66);
  base(g, {
    seed: 6, sky: [[8, '#1B2240'], [18, '#26305A'], [28, '#33407A'], [43, '#5A6AA0']],
    far: { base: 30, amp: 3, col: '#DDE4F7', edge: '#FFFFFF' }, mid: { base: 38, amp: 2, col: '#F4F7FC', edge: '#FFFFFF' },
    ground: '#F4F7FC', groundTop: 42, groundDots: '#D5DEF1',
    road: { edge: '#F4F7FC', top: '#E6ECF8', mid: '#E6ECF8', low: '#D5DEF1', line: '#B7C5E4', dot: '#C9D4EE' },
    fg: '#E6ECF8', fgDots: ['#D5DEF1', '#F4F7FC', '#C9D4EE', '#FFFFFF'],
  });
  for (let k = 0; k < 30; k++) g.put(Math.floor(r() * W), Math.floor(r() * 26), k % 3 ? '#FFFFFF' : '#AEBFE3');
  g.ell(8, 5, 3, 3, '#FFF3D0'); g.ell(9, 5, 2, 2.2, '#26305A'); // 三日月
  // 遠い 山の かげ
  for (let x = 0; x < W; x++) { const t = Math.round(30 + 3 * wave(x, 2, 1) + 1.5 * wave(x, 5, 2)); if (x % 7 < 3) g.put(x, t + 2, '#B7C5E4'); }
  // 雪の まつ
  for (const [x, b, h] of [[3, 49, 14], [9, 49, 11], [72, 49, 13], [77, 49, 10]]) pine(g, x, b, h, '#2F5D4F', '#FFFFFF', '#3F7A66');
  // 家：屋根の 雪
  const roof = [[30, 33, 45], [31, 31, 47], [32, 30, 48], [33, 29, 49], [34, 29, 49]];
  for (const [y, a, b] of roof) g.rect(a, y, b - a + 1, 1, '#FFFFFF');
  g.rect(31, 33, 16, 1, '#EEF3FC'); g.rect(29, 35, 21, 1, '#DDE4F7'); g.rect(29, 36, 21, 1, '#6B4A3A');
  g.rect(36, 27, 3, 4, '#8A5A3A'); g.rect(35, 26, 5, 1, '#FFFFFF'); // えんとつ
  // 壁
  g.rect(31, 37, 17, 9, '#8A5A3A'); for (let x = 33; x < 47; x += 4) g.rect(x, 37, 1, 9, '#6B4A3A');
  for (const [x, w] of [[32, 6], [41, 5]]) {
    g.rect(x, 38, w, 6, '#FFE9A8'); g.rect(x, 38, w, 1, '#B58B4F'); g.rect(x, 43, w, 1, '#B58B4F'); g.rect(x + (w >> 1), 38, 1, 6, '#B58B4F'); g.rect(x, 40, w, 1, '#F7D890');
    g.rect(x - 1, 44, w + 2, 1, '#FFC53D44'); g.rect(x - 1, 37, 1, 7, '#6B4A3A'); g.rect(x + w, 37, 1, 7, '#6B4A3A');
  }
  g.rect(37, 38, 3, 8, '#6B4A3A'); // とびら
  // 縁側
  g.rect(29, 46, 21, 1, '#B58B4F'); g.rect(29, 47, 21, 1, '#8A6A3A'); g.rect(29, 45, 21, 1, '#FFFFFF');
  for (const x of [31, 38, 47]) g.rect(x, 48, 1, 2, '#6B4A3A');
  for (const [cx, cy, rx] of [[28, 49, 4], [49, 49, 5], [38, 50, 6]]) { g.ell(cx, cy, rx, 1.6, '#FFFFFF'); g.rect(cx - rx, cy + 1, rx * 2, 1, '#D5DEF1'); }
  g.ell(10, 48, 5, 2, '#FFFFFF');
}];
FAR.area6 = [(g) => {
  const peaks = [[6, 14], [28, 11], [50, 15], [70, 10]];
  for (let x = 0; x < 80; x++) {
    let t = 22;
    for (const [px, h] of peaks) for (const sh of [-80, 0, 80]) { const d = Math.abs(x - (px + sh)); t = Math.min(t, 22 - h + Math.round(d * 0.9)); }
    for (let y = Math.max(0, t); y < 22; y++) g.put(x, y, y < t + 3 ? '#FFFFFF' : (x + y) % 9 < 4 ? '#B7C5E4' : '#DDE4F7');
  }
  for (const x of [2, 18, 36, 47, 62, 76]) for (let i = 0; i < 6; i++) { const h = 1 + (i >> 1); g.rect(x - h, 16 + i, h * 2 + 1, 1, i % 2 ? '#2F5D4F' : '#FFFFFF'); }
}];

/* ---------- 7 丘の上の てまり ---------- */
STAGES.area7 = ['エリア7 めぐりの丘（四季の終章）：丘の上の 大きな てまり', (g) => {
  base(g, {
    seed: 7, sky: [[8, '#D9CDEE'], [18, '#E8DFF5'], [30, '#F3ECF6'], [43, '#FBF6EA']],
    ground: '#4CA06A', groundTop: 45,
    road: { edge: '#1F6E43', top: '#DACD9F', mid: '#D2C493', low: '#C3B482', line: '#B3A472', dot: '#C3B482' },
    fg: '#4CA06A', fgDots: ['#1F6E43', '#7CC48A', '#1F6E43', '#F2A7B8', '#FFC53D', '#7A8FD0', '#A63D2F'],
  });
  const r = rng(77);
  // 四季の かすみの 丘
  for (let x = 0; x < W; x++) {
    const sec = x < 20 ? ['#F2C0CC', '#E4A9BA'] : x < 40 ? ['#8CCB8C', '#6BB07A'] : x < 60 ? ['#E3B25A', '#C98F4A'] : ['#E4ECF6', '#C9D6EA'];
    const t = Math.round(33 + 2 * wave(x, 3, 1) + wave(x, 7)), t2 = Math.round(38 + 2 * wave(x, 4, 2));
    for (let y = t; y < 50; y++) g.put(x, y, sec[0]);
    for (let y = t2; y < 50; y++) g.put(x, y, sec[1]);
  }
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(r() * W), y = 34 + Math.floor(r() * 8);
    g.put(x, y, x < 20 ? '#F2A7B8' : x < 40 ? '#3E9A63' : x < 60 ? (k % 2 ? '#A63D2F' : '#FFC53D') : '#FFFFFF');
  }
  // 中央の 丘
  for (let x = 20; x < 58; x++) {
    const t = Math.min(45, Math.round(32 + ((x - 35) ** 2) / 22));
    for (let y = t; y < 50; y++) g.put(x, y, y === t ? '#7CC48A' : y < t + 3 ? '#4CA06A' : '#3E8E5A');
  }
  // てまり
  const cx = 35, cy = 24.5, R = 8.5;
  const inB = (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= R * R;
  const bandCols = ['#FFC53D', '#FBF6EA', '#F2A7B8', '#FBF6EA', '#FFC53D'];
  for (let y = 14; y <= 35; y++) for (let x = 25; x <= 45; x++) if (inB(x, y)) {
    const dx = x - cx, dy = y - cy;
    let c = '#8B6BB8';
    if (dx + dy * 0.9 < -R * 0.55) c = '#A88CD0';
    if (dx * 0.7 + dy > R * 0.6) c = '#6E5399';
    const sx = Math.sqrt(Math.max(0, R * R - dy * dy));
    [-72, -36, 0, 36, 72].forEach((a, i) => { if (Math.abs(dx - sx * sin((a * Math.PI) / 180)) < 0.62) c = bandCols[i]; });
    if (Math.abs(dy - 0.28 * dx) < 0.62) c = '#A63D2F';
    if (!inB(x - 1, y) || !inB(x + 1, y) || !inB(x, y - 1) || !inB(x, y + 1)) c = '#4B3A78';
    g.put(x, y, c);
  }
  g.rect(34, 14, 2, 1, '#FFC53D'); g.put(35, 13, '#FFC53D'); g.put(34, 12, '#FFC53D'); g.put(36, 12, '#FFC53D');
}];
FAR.area7 = [(g) => {
  const secs = [[10, '#F2C0CC', '#F2A7B8'], [30, '#8CCB8C', '#3E9A63'], [50, '#E3B25A', '#A63D2F'], [70, '#E4ECF6', '#FFFFFF']];
  for (const [c, col, dot] of secs) {
    for (let x = c - 14; x <= c + 14; x++) { const t = Math.round(12 + ((x - c) ** 2) / 14); for (let y = t; y < 22; y++) { if (g.get(((x % 80) + 80) % 80, y) && y > t + 5) continue; g.put(x, y, col); } }
    for (let k = -2; k <= 2; k++) { g.put(c + k * 4, 14 + Math.abs(k), dot); g.put(c + k * 4 + 1, 15 + Math.abs(k), dot); }
  }
}];

/* ---------- 年こしの峠 ---------- */
STAGES.end = ['年こしの峠（クリアの あと）：夜あけまえの 鐘つき堂', (g) => {
  const r = rng(99);
  base(g, {
    seed: 9, sky: [[7, '#2F3F7A'], [15, '#4A5C96'], [23, '#7C8FB8'], [30, '#B7B3C9'], [36, '#F0D59A'], [43, '#E8C98A']],
    far: { base: 30, amp: 3, col: '#5E6F9E', edge: '#9CAAD0' }, mid: { base: 37, amp: 2, col: '#4F6C96', edge: '#6C85AD' },
    ground: '#4F7C86', groundTop: 43, groundDots: '#5C9488',
    road: { edge: '#C9D0E0', top: '#B7C0D6', mid: '#A8B2CC', low: '#9AA6C4', line: '#8794B6', dot: '#8794B6' },
    fg: '#3F6E78', fgDots: ['#5C9488', '#2F5D5A', '#5C9488', '#C9D0E0'],
  });
  for (let k = 0; k < 40; k++) g.put(Math.floor(r() * W), Math.floor(r() * 22), k % 3 ? '#FFFFFF' : '#FFE9A8');
  g.ell(62, 7, 3.5, 3.5, '#FFF3D0'); g.ell(63.5, 6, 3, 3, '#4A5C96'); // 三日月
  for (const x of [0, 6, 12, 67, 73, 78]) pine(g, x, 49, 9 + (x % 4), '#2F5D5A', null, '#3F7D72');
  // 鐘つき堂
  g.rect(30, 43, 17, 2, '#6E7FA0'); g.rect(29, 45, 19, 1, '#8FA0B8'); g.rect(28, 46, 21, 2, '#9AA6C4'); g.rect(27, 48, 23, 2, '#8794B6');
  g.rect(31, 32, 2, 11, '#8A5A3A'); g.rect(44, 32, 2, 11, '#8A5A3A'); g.rect(31, 32, 1, 11, '#B07A4F');
  g.rect(31, 32, 15, 1, '#5C3A20'); g.rect(31, 40, 15, 1, '#5C3A20');
  const rows = [[36, 40], [34, 42], [32, 44], [30, 46], [28, 48]];
  rows.forEach(([a, b], i) => { g.rect(a, 26 + i, b - a + 1, 1, '#3E5A6A'); g.put(a, 26 + i, '#6E8FA0'); g.put(b, 26 + i, '#2A4150'); });
  g.rect(27, 31, 23, 1, '#243845'); g.put(26, 30, '#3E5A6A'); g.put(50, 30, '#3E5A6A'); g.put(38, 25, '#3E5A6A'); g.put(38, 24, '#FFC53D');
  g.rect(38, 33, 1, 2, '#3B2F3F');
  g.rect(37, 34, 3, 1, '#5FA8A0'); g.rect(36, 35, 5, 3, '#5FA8A0'); g.rect(35, 38, 7, 2, '#5FA8A0'); g.rect(35, 40, 7, 1, '#3F7D72');
  g.rect(36, 35, 1, 5, '#8CCBC3'); g.rect(40, 35, 1, 5, '#3F7D72'); g.rect(34, 40, 9, 1, '#3F7D72');
  g.rect(41, 37, 7, 1, '#8A5A3A'); g.line(42, 33, 42, 36, '#3B2F3F');
  g.rect(34, 42, 1, 1, '#FFC53D'); g.rect(43, 42, 1, 1, '#FFC53D');
}];
FAR.end = [(g) => {
  const ph = (x, k, p = 0) => sin((2 * Math.PI * k * x) / 80 + p);
  for (let x = 0; x < 80; x++) { const t = Math.round(6 + 4 * ph(x, 2, 1) + 2 * ph(x, 5)); for (let y = t; y < 22; y++) g.put(x, y, y < t + 2 && t < 7 ? '#E6ECF8' : '#4A5A8A'); }
  for (let x = 0; x < 80; x++) { const t = Math.round(13 + 2.5 * ph(x, 3, 0.7) + ph(x, 6)); for (let y = t; y < 22; y++) g.put(x, y, '#5E6F9E'); }
  for (const x of [3, 17, 33, 49, 58, 75]) for (let i = 0; i < 6; i++) { const h = 1 + (i >> 1); g.rect(x - h, 15 + i, h * 2 + 1, 1, '#2F5D5A'); }
  for (let x = 0; x < 80; x += 11) g.put(x, 4 + (x % 3), '#F0D59A');
}];

function fade(g) { // 遠景の 下の ほうを すきとおらせる（20〜21行目を うすく）
  for (let y = 20; y < 22; y++) for (let x = 0; x < g.w; x++) {
    const c = g.c[y][x]; if (c && c.length === 7) g.c[y][x] = c + (y === 20 ? 'B3' : '59');
  }
}

export function build() {
  mkdirSync(OUT, { recursive: true });
  for (const [id, [title, fn]] of Object.entries(STAGES)) {
    const g = new Grid(W, H, CELL); fn(g);
    writeFileSync(join(OUT, `${id}-bg.svg`), toSvg(g, `背景：${title}`), 'utf8');
    const [ff] = FAR[id]; const f = new Grid(80, 28, CELL, true); ff(f); fade(f);
    writeFileSync(join(OUT, `${id}-far.svg`), toSvg(f, `流れる遠景：${title}`), 'utf8');
    console.log(`作りました： ${id}-bg.svg ${id}-far.svg`);
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) build();
