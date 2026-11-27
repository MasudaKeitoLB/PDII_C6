// 歩く道の 帯（7エリア）を 作る。幅 160px × 高さ 60px（1マス 5px、32×12マス）。
// 使い方： node design/build-strips.mjs   → user-app/src/assets/scene/walk-strip-area1.svg 〜 area7.svg
// 左はしと 右はしが つながる（すべての 絵を 横に 32マスで ぐるっと 回して 置く）。
// 上（0〜6行目）は 近くの 景色、下（7〜11行目）は 主人公が 歩く 道。道の 上の はしは 7行目。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'user-app', 'src', 'assets', 'scene');
export const W = 32, H = 12, CELL = 5;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Canvas {
  constructor() { this.c = Array.from({ length: H }, () => Array(W).fill(null)); }
  put(x, y, col) { if (y >= 0 && y < H && col) this.c[y][((x % W) + W) % W] = col; }
  rect(x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, col); }
  /** rows: 文字列の 配列。map: 文字 → 色。' ' は 何も 置かない */
  stamp(x, y, rows, map) {
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== ' ') this.put(x + i, y + j, map[ch]); }));
  }
}

function toSvg(cv, title) {
  const by = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const col = cv.c[y][x];
    if (!col) continue;
    if (!by.has(col)) by.set(col, []);
    by.get(col).push([x, y]);
  }
  const paths = [];
  for (const [col, cells] of by) {
    let d = '';
    const rows = new Map();
    for (const [x, y] of cells) { if (!rows.has(y)) rows.set(y, []); rows.get(y).push(x); }
    for (const [y, xs] of rows) {
      xs.sort((a, b) => a - b);
      let s = xs[0], p = xs[0];
      const flush = (a, b) => { d += `M${a * CELL} ${y * CELL}h${(b - a + 1) * CELL}v${CELL}h-${(b - a + 1) * CELL}z`; };
      for (let k = 1; k < xs.length; k++) {
        if (xs[k] === p + 1) { p = xs[k]; continue; }
        flush(s, p); s = p = xs[k];
      }
      flush(s, p);
    }
    paths.push(`<path d="${d}" fill="${col}"/>`);
  }
  return (
    `<svg width="${W * CELL}" height="${H * CELL}" viewBox="0 0 ${W * CELL} ${H * CELL}" fill="none" ` +
    `xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n<title>${title}</title>\n${paths.join('\n')}\n</svg>\n`
  );
}

/** 道の 土台： 7行目が 上のへり、8〜11行目が 地面 */
function road(cv, { edge, edge2, top, mid, low, dots, dotCol, seed }) {
  const r = rng(seed);
  for (let x = 0; x < W; x++) {
    cv.put(x, 7, x % 3 === 0 ? edge2 : edge);
    cv.put(x, 8, top);
    cv.put(x, 9, mid); cv.put(x, 10, mid);
    cv.put(x, 11, low);
  }
  for (let k = 0; k < dots; k++) cv.put(Math.floor(r() * W), 8 + Math.floor(r() * 3), dotCol);
}

const AREAS = {
  1: ['エリア1 はなあかりの小道（春）', (cv) => {
    road(cv, { edge: '#7DB65A', edge2: '#9CCB7A', top: '#DCCDA6', mid: '#D3C39A', low: '#C2B088', dots: 14, dotCol: '#C2B088', seed: 11 });
    const r = rng(101);
    // 草と 菜の花
    for (const x of [1, 5, 9, 13, 18, 22, 26, 30]) {
      cv.stamp(x, 5, ['g', 'G', 'G'], { g: '#9CCB7A', G: '#7DB65A' });
      if (x % 2 === 1) cv.put(x, 4, '#E9D36A');
    }
    for (const x of [3, 11, 20, 28]) cv.stamp(x, 6, ['G G'], { G: '#7DB65A' });
    // さくらの 花びら（ひらひら おちる）
    for (let k = 0; k < 11; k++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * 10);
      cv.put(x, y, '#F2A7B8'); if (k % 2 === 0) cv.put(x + 1, y, '#F9DDE3');
    }
  }],
  2: ['エリア2 わかばの田んぼ道（初夏）', (cv) => {
    road(cv, { edge: '#3E9A63', edge2: '#6BB07A', top: '#BDB28A', mid: '#B4A981', low: '#A59A73', dots: 10, dotCol: '#A59A73', seed: 22 });
    // 水たまり（雨）
    cv.stamp(6, 9, ['ppp', ' p '], { p: '#C3D0E0' });
    cv.stamp(22, 10, ['pppp'], { p: '#C3D0E0' });
    cv.put(7, 9, '#9FB4D4'); cv.put(23, 10, '#9FB4D4');
    // 田んぼの 水と 苗
    for (let x = 0; x < W; x++) cv.put(x, 6, x % 4 < 2 ? '#C3D0E0' : '#9FB4D4');
    for (let x = 0; x < W; x += 4) {
      cv.stamp(x, 3 + (x % 8 === 0 ? 0 : 1), x % 8 === 0 ? [' s ', 'sSs', 'SSS', ' S '] : ['s s', 'SSS', ' S '], { s: '#A8D672', S: '#3E9A63' });
    }
  }],
  3: ['エリア3 ゆうすずみ商店街（夏）', (cv) => {
    // 石だたみ
    for (let x = 0; x < W; x++) {
      cv.put(x, 7, x % 4 === 0 ? '#A98A72' : '#9A7B64');
      for (const y of [8, 9, 10, 11]) cv.put(x, y, '#80614E');
    }
    for (let x = 0; x < W; x += 8) { // れんがの 目地（8マスで くり返す）
      for (const y of [8, 10]) cv.put(x, y, '#6C5040');
      for (const y of [9, 11]) cv.put(x + 4, y, '#6C5040');
    }
    for (let x = 0; x < W; x++) cv.put(x, 8, '#8B6B55');
    // 灯りが 地面に うつる
    cv.stamp(2, 8, ['yyyyy', ' yyy '], { y: '#B8895A' }); cv.stamp(18, 8, ['yyyyy', ' yyy '], { y: '#B8895A' });
    // 屋根の すみの 影 + ちょうちん + のれん の かげ
    for (let x = 0; x < W; x++) cv.put(x, 0, '#3B2F3F');
    const L = { r: '#C2410C', R: '#E8732C', k: '#3B2F3F', y: '#FFC53D' };
    for (const x of [3, 19]) cv.stamp(x, 1, [' k ', 'rRr', 'rRr', 'rRr', ' k '], L);
    cv.put(4, 2, '#FFC53D'); cv.put(20, 2, '#FFC53D');
    cv.stamp(10, 1, ['nnnnnn', 'nn  nn', 'nn  nn', 'nn  nn'], { n: '#4A3F70' });
    cv.stamp(26, 1, ['nnnnn', 'n n n', 'n n n'], { n: '#4A3F70' });
    cv.put(11, 2, '#8F82B8'); cv.put(27, 2, '#8F82B8');
  }],
  4: ['エリア4 うみかぜの浜（盛夏）', (cv) => {
    road(cv, { edge: '#D9C998', edge2: '#CDBC8A', top: '#EFE4C3', mid: '#EBDFBC', low: '#E0D2A8', dots: 16, dotCol: '#D6C79A', seed: 44 });
    // 貝がら
    cv.stamp(5, 9, ['pk'], { p: '#F2C9C0', k: '#E7A9A0' }); cv.stamp(24, 10, ['pk'], { p: '#F2C9C0', k: '#E7A9A0' });
    // 波（8マスで くり返す）
    const crest = [0, 0, -1, -1, -1, 0, 0, 1];
    for (let x = 0; x < W; x++) {
      const y0 = 4 + crest[x % 8];
      for (let y = y0; y <= 6; y++) cv.put(x, y, y === y0 ? '#FFFFFF' : '#7EAEDC');
      cv.put(x, 6, x % 4 < 2 ? '#5C93CC' : '#7EAEDC');
    }
    for (let x = 0; x < W; x += 8) cv.put(x + 2, 2, '#FFFFFF');
    for (let x = 0; x < W; x += 8) { cv.put(x + 5, 1, '#FFFFFF'); cv.put(x + 6, 1, '#E3EEF8'); }
  }],
  5: ['エリア5 みのりの里山（秋）', (cv) => {
    road(cv, { edge: '#9A7440', edge2: '#B58B4F', top: '#C79A5E', mid: '#BC8F55', low: '#A87E48', dots: 14, dotCol: '#A87E48', seed: 55 });
    const r = rng(505);
    const Y = { y: '#FFC53D', o: '#D9822B', r: '#A63D2F' };
    // すすき
    for (const x of [2, 10, 17, 25]) {
      cv.stamp(x, 3, ['t', 'T', 't', 'S', 'S'], { t: '#EAD9A0', T: '#F5EBC4', S: '#B9A24E' });
    }
    // いちょうの 葉と もみじ
    for (let k = 0; k < 9; k++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * 10);
      if (k % 3 === 2) cv.stamp(x, y, [' r ', 'rrr', ' r '], Y);
      else cv.stamp(x, y, ['y y', 'yoy', ' y '].slice(0, k % 2 ? 3 : 2), Y);
    }
  }],
  6: ['エリア6 ゆきあかりの縁側（冬）', (cv) => {
    for (let x = 0; x < W; x++) {
      cv.put(x, 7, '#F4F7FC'); cv.put(x, 8, '#E6ECF8');
      cv.put(x, 9, '#E6ECF8'); cv.put(x, 10, '#D5DEF1'); cv.put(x, 11, '#B7C5E4');
    }
    for (const [x, y] of [[3, 9], [9, 10], [15, 9], [21, 10], [27, 9], [12, 8], [30, 8]]) cv.put(x, y, '#C9D4EE');
    // 雪の もりあがり
    cv.stamp(2, 5, [' ss ', 'ssss', 'SSSS'], { s: '#F4F7FC', S: '#D5DEF1' });
    cv.stamp(14, 6, ['sss', 'SSS'], { s: '#F4F7FC', S: '#D5DEF1' });
    cv.stamp(23, 5, [' sss ', 'ssss ', 'SSSSS'], { s: '#F4F7FC', S: '#D5DEF1' });
    // 雪（うす青と 白）
    const r = rng(606);
    for (let k = 0; k < 18; k++) cv.put(Math.floor(r() * W), Math.floor(r() * 5), k % 2 ? '#FFFFFF' : '#AEBFE3');
    cv.put(6, 2, '#AEBFE3'); cv.put(6, 3, '#FFFFFF'); cv.put(7, 3, '#AEBFE3');
  }],
  7: ['エリア7 めぐりの丘（四季の終章）', (cv) => {
    road(cv, { edge: '#1F6E43', edge2: '#4CA06A', top: '#DACD9F', mid: '#D2C493', low: '#C3B482', dots: 12, dotCol: '#C3B482', seed: 77 });
    const seasons = ['#F2A7B8', '#7A8FD0', '#FFC53D', '#A63D2F', '#FBF6EA', '#8B6BB8', '#FFC53D'];
    [2, 7, 12, 17, 21, 25, 29].forEach((x, k) => {
      const c = seasons[k];
      const center = k === 2 || k === 6 ? '#9A5B00' : '#FFE9A8';
      cv.stamp(x, 3, [' f ', 'fCf', ' f ', ' s ', ' s '], { f: c, C: center, s: '#1F6E43' });
    });
    for (const x of [4, 9, 14, 19, 23, 27, 31]) cv.stamp(x, 6, ['G'], { G: '#4CA06A' });
  }],
};

export function build() {
  mkdirSync(OUT, { recursive: true });
  for (const [n, [title, fn]] of Object.entries(AREAS)) {
    const cv = new Canvas();
    fn(cv);
    writeFileSync(join(OUT, `walk-strip-area${n}.svg`), toSvg(cv, `歩く道の帯：${title}`), 'utf8');
    console.log(`作りました： walk-strip-area${n}.svg`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) build();
