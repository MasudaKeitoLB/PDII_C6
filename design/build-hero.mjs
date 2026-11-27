// 主人公の コマ（歩く4・攻撃・勝ち）を 作る。もとは 今の hero.svg（17×22マス、1マス 5px）。
// 使い方： node design/build-hero.mjs   → user-app/src/assets/sprite/hero-*.svg
// 今の hero.svg は 読むだけで 書かない。足もとは 22行目の 下（y=110）で そろえる。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'user-app', 'src', 'assets', 'sprite');
const W = 17, H = 22, CELL = 5;

// 色の文字（今の hero.svg と 同じ色）
const COLORS = {
  a: '#1E1B18', b: '#2F8F55', c: '#1F6E43', d: '#FFC53D', e: '#7A4A26', f: '#F7CDA4', g: '#F2998A',
  h: '#FFFFFF', i: '#E8732C', j: '#B9531A', k: '#34477A', l: '#B87736', m: '#7F4F22',
};

/** 今の hero.svg を 文字の マス目に 読む */
export function readBase() {
  const s = readFileSync(join(OUT, 'hero.svg'), 'utf8');
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const rev = Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [v.toUpperCase(), k]));
  rev.WHITE = 'h';
  for (const m of s.matchAll(/<path id="[^"]*" d="([^"]+)" fill="([^"]+)"/g)) {
    const ch = rev[m[2].toUpperCase()];
    if (!ch) throw new Error(`知らない色 ${m[2]}`);
    for (const r of m[1].split('Z')) {
      const n = [...r.matchAll(/-?\d+/g)].map(Number);
      if (n.length < 4) continue;
      for (let y = n[1] / CELL; y < n[3] / CELL; y++) for (let x = n[0] / CELL; x < n[2] / CELL; x++) g[y][x] = ch;
    }
  }
  return g;
}

const base = readBase();
const blank = () => Array.from({ length: H }, () => Array(W).fill('.'));
const put = (g, x, y, ch) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = ch; };
const putStr = (g, x, y, str) => [...str].forEach((ch, k) => { if (ch !== ' ') put(g, x + k, y, ch); });

/** 頭〜胴（0〜17行）を dy だけ 下げた 体。杖は 地面に 立てたまま（withStaff） */
function body(dy, withStaff = true) {
  const g = blank();
  for (let y = 0; y <= 17; y++) for (let x = 0; x <= 13; x++) put(g, x, y + dy, base[y][x]);
  if (withStaff) {
    for (let y = 12; y < H; y++) for (const x of [14, 15]) if (!(x === 14 && (y === 15 || y === 16))) put(g, x, y, base[y][x]);
    put(g, 14, 15 + dy, 'a');
    put(g, 14, 16 + dy, 'a');
    if (dy === 1) put(g, 14, 15, 'l');
  }
  return g;
}

/** 足 左（c=2）と 右（c=9）。lift=true なら 1マス 上げる */
function leg(g, side, c, lift) {
  const trX = side === 'L' ? c + 1 : c;
  if (lift) {
    putStr(g, c, 19, 'aeeeea'); putStr(g, c, 20, 'aaaaaa');
  } else {
    putStr(g, trX, 19, 'akkka');
    putStr(g, c, 20, 'aeeeea'); putStr(g, c, 21, 'aaaaaa');
  }
}

function standLegs(g, dy, cl = 2, cr = 9, liftL = false, liftR = false) {
  if (dy === 0) putStr(g, 3, 18, 'akkkkkkkkka');
  leg(g, 'L', cl, liftL);
  leg(g, 'R', cr, liftR);
}

function walk(n) {
  const down = n === 1 || n === 3;
  const g = body(down ? 1 : 0);
  if (n === 1) {
    standLegs(g, 1, 1, 9);
    for (const [x, y] of [[0, 17], [1, 17], [0, 18], [1, 18]]) put(g, x, y, 'f');
    put(g, 0, 16, 'a'); put(g, 1, 16, 'a'); put(g, 2, 17, 'a'); put(g, 2, 18, 'a'); put(g, 0, 19, 'a'); put(g, 1, 19, 'a');
  } else if (n === 2) {
    standLegs(g, 0, 2, 9, true, false);
  } else if (n === 3) {
    standLegs(g, 1, 2, 9);
    put(g, 12, 18, 'f'); put(g, 13, 18, 'f'); put(g, 12, 19, 'a'); put(g, 13, 19, 'a');
  } else {
    standLegs(g, 0, 2, 9, false, true);
  }
  return g;
}

function attack() {
  const g = body(1, false);
  for (let y = 12; y < H; y++) for (let x = 12; x < W; x++) g[y][x] = '.';
  putStr(g, 12, 14, 'aaaaa');
  putStr(g, 12, 15, 'agdga');
  putStr(g, 12, 16, 'adgda');
  putStr(g, 12, 17, 'agdga');
  putStr(g, 13, 18, 'aaa');
  put(g, 11, 17, 'f'); put(g, 12, 17, 'f'); put(g, 11, 18, 'f'); put(g, 12, 18, 'f');
  put(g, 10, 17, 'a'); put(g, 10, 18, 'a'); put(g, 11, 19, 'a'); put(g, 12, 19, 'a');
  put(g, 16, 13, 'd'); put(g, 16, 12, 'd');
  putStr(g, 1, 19, 'akkka'); putStr(g, 0, 20, 'aeeeea'); putStr(g, 0, 21, 'aaaaaa');
  putStr(g, 10, 19, 'akkka'); putStr(g, 10, 20, 'aeeeea'); putStr(g, 10, 21, 'aaaaaa');
  return g;
}

function cheer() {
  const g = body(0, false);
  for (let y = 12; y < H; y++) for (let x = 12; x < W; x++) g[y][x] = '.';
  put(g, 12, 13, 'a');
  // 顔： 目は そのまま、口を にっこり（1行の 線）
  putStr(g, 7, 10, 'aaa');
  const arm = (side) => {
    const xo = side === 'L' ? 0 : 16;
    const xi = side === 'L' ? 1 : 15;
    for (let y = 10; y <= 13; y++) { put(g, xo, y, 'a'); put(g, xi, y, 'i'); }
    put(g, xi, 9, 'f'); put(g, xi, 8, 'f'); put(g, xo, 9, 'a'); put(g, xo, 8, 'a');
    put(g, xi, 7, 'a');
    const xc = side === 'L' ? 2 : 14;
    put(g, xc, 13, 'i'); put(g, xc, 12, 'i');
    put(g, side === 'L' ? 3 : 13, 13, 'j');
  };
  arm('L'); arm('R');
  standLegs(g, 0, 2, 9);
  return g;
}

export function toSvg(g, title) {
  const paths = [];
  for (const ch of Object.keys(COLORS)) {
    let d = '';
    for (let y = 0; y < H; y++) {
      let x = 0;
      while (x < W) {
        if (g[y][x] !== ch) { x++; continue; }
        let e = x;
        while (e < W && g[y][e] === ch) e++;
        d += `M${x * CELL} ${y * CELL}h${(e - x) * CELL}v${CELL}h-${(e - x) * CELL}z`;
        x = e;
      }
    }
    if (d) paths.push(`<path d="${d}" fill="${COLORS[ch]}"/>`);
  }
  return (
    `<svg width="${W * CELL}" height="${H * CELL}" viewBox="0 0 ${W * CELL} ${H * CELL}" fill="none" ` +
    `xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n<title>${title}</title>\n${paths.join('\n')}\n</svg>\n`
  );
}

export const FRAMES = {
  'hero-walk-1': ['主人公：歩く1', () => walk(1)],
  'hero-walk-2': ['主人公：歩く2', () => walk(2)],
  'hero-walk-3': ['主人公：歩く3', () => walk(3)],
  'hero-walk-4': ['主人公：歩く4', () => walk(4)],
  'hero-attack': ['主人公：てまりを ぽんと 出す', attack],
  'hero-cheer': ['主人公：よろこぶ', cheer],
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const [name, [title, fn]] of Object.entries(FRAMES)) {
    writeFileSync(join(OUT, `${name}.svg`), toSvg(fn(), title), 'utf8');
    console.log(`作りました： ${name}.svg`);
  }
}
