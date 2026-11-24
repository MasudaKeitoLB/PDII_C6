// ギミック（動かす 小さな 絵）を 作る。1マス 5px か 3px。
// 使い方： node design/build-fx.mjs   → user-app/src/assets/scene/fx/<名前>.svg
// 文字の マス目と 色の 表で 書く。'.' は すきとおり。色は #RRGGBB か #RRGGBBAA（うす色）。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grid, toSvg } from './pix.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'user-app', 'src', 'assets', 'scene', 'fx');

/** 文字の 絵 → Grid */
function fromRows(rows, pal, cell) {
  const g = new Grid(Math.max(...rows.map((r) => r.length)), rows.length, cell);
  g.stamp(0, 0, rows, pal);
  return g;
}

/** 花火：ひらく 3段（まぶしくない やわらかい 色。ふちを うす色に して ちかちかさせない） */
function firework(stage) {
  const S = [13, 21, 29][stage - 1], g = new Grid(S, S, 3), c = (S - 1) / 2;
  const gold = '#FFD97A', pink = '#F4A9BC', soft = '#FFD97A80', softP = '#F4A9BC80', pale = '#FFF1C4';
  const rays = 12;
  const R = [3.2, 6.5, 10.5][stage - 1];
  for (let k = 0; k < rays; k++) {
    const a = (k * 2 * Math.PI) / rays, col = k % 2 ? pink : gold, colS = k % 2 ? softP : soft;
    const n = stage === 1 ? 1 : stage === 2 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const rr = R - i * 1.6;
      g.put(c + rr * Math.cos(a), c + rr * Math.sin(a), i === 0 ? col : colS);
      if (stage === 3 && i === 0) g.put(c + (rr + 1) * Math.cos(a), c + (rr + 1) * Math.sin(a), colS);
    }
  }
  if (stage === 1) { g.put(c, c, pale); g.put(c - 1, c, soft); g.put(c + 1, c, soft); g.put(c, c - 1, soft); g.put(c, c + 1, soft); }
  if (stage === 2) { g.rect(c - 1, c - 1, 3, 3, soft); g.put(c, c, pale); }
  if (stage === 3) for (let k = 0; k < 6; k++) { const a = (k * 2 * Math.PI) / 6 + 0.26; g.put(c + 4 * Math.cos(a), c + 4 * Math.sin(a), '#FFF1C480'); }
  return g;
}

const P = (m) => m;
const FX = {
  petal: [['petal 桜の花びら', fromRows(
    ['.aab.', 'aabbb', '.aab.'], P({ a: '#F9DDE3', b: '#F2A7B8' }), 3)]],
  'butterfly-1': [['butterfly 羽を ひらく', fromRows([
    'ww.....ww', 'wWw...wWw', 'wwwwkwwww', '.wwwkwww.', '..ww.ww..'], P({ w: '#FFC53D', W: '#E8732C', k: '#5C3A20' }), 3)]],
  'butterfly-2': [['butterfly 羽を とじる', fromRows([
    '...k...', '..wkw..', '.wWkWw.', '..wkw..', '..w.w..'], P({ w: '#FFC53D', W: '#E8732C', k: '#5C3A20' }), 3)]],
  cloud: [['cloud くも', fromRows([
    '.....wwww.......', '...wwwwwwwww....', '..wwwwwwwwwwww..', '.wwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'sssssssssssssss.'.slice(0, 16)],
    P({ w: '#FFFFFF', s: '#C8D7EA' }), 5)]],
  raindrop: [['raindrop あめ', fromRows(['.b.', '.b.', 'bBb', 'bBb', '.b.'], P({ b: '#7EAEDC', B: '#B9D6F0' }), 3)]],
  ripple: [['ripple 水の輪', fromRows([
    '..wwwwww..', '.w......w.', '..wwwwww..'], P({ w: '#F4F7FB' }), 3)]],
  frog: [['frog かえる', fromRows([
    '.ke..ek.', 'kGGGGGGk', 'GGGGGGGG', 'GGgggGGG', 'GGGGGGGG', 'GgGGGGgG', '.GG..GG.', 'GG....GG'].map((r) => r),
    P({ G: '#3E9A63', g: '#A8D672', k: '#1E1B18', e: '#FFFFFF' }), 3)]],
  firefly: [['firefly ほたる', fromRows([
    '..h..', '.hhh.', 'hhYhh', '.hhh.', '..h..'], P({ h: '#FFE9A855', Y: '#FFF3B0' }), 3)]],
  lantern: [['lantern ちょうちん', fromRows([
    '..k..', '.kkk.', 'rrrrr', 'rRyRr', 'rRyRr', 'rRyRr', 'rrrrr', '.kkk.', '..k..'], P({ k: '#3B2F3F', r: '#C2410C', R: '#E8732C', y: '#FFC53D' }), 3)]],
  windchime: [['windchime 風鈴', fromRows([
    '...k...', '..bbb..', '.bwbbb.', 'bbbbbbb', 'bbbbbbb', '...k...', '...k...', '..ppp..', '..ppp..', '..ppp..', '..ppp..'],
    P({ k: '#5C6B8B', b: '#8FD0F2', w: '#F4F7FB', p: '#F2A7B8' }), 3)]],
  'firework-1': [['firework 小', firework(1)]],
  'firework-2': [['firework 中', firework(2)]],
  'firework-3': [['firework 大', firework(3)]],
  wave: [['wave 波の先', fromRows([
    '....wwww....', '..wwWWWWww..', '.wWbbbbbbWw.', 'wWbbbbbbbbWw'], P({ w: '#FFFFFF', W: '#E3EEF8', b: '#7EAEDC' }), 5)]],
  'gull-1': [['gull 羽を あげる', fromRows([
    'w.........w', 'ww.......ww', '.wwW.k.Www.', '..wwwwwww..', '....yww....'.replace('yww', 'wyw'), ], P({ w: '#FFFFFF', W: '#C8D7EA', k: '#1E1B18', y: '#FFC53D' }), 3)]],
  'gull-2': [['gull 羽を さげる', fromRows([
    '...wwwww...', '.wwwWWWwww.', 'ww..wkw..ww', 'w...wyw...w'], P({ w: '#FFFFFF', W: '#C8D7EA', k: '#1E1B18', y: '#FFC53D' }), 3)]],
  boat: [['boat 小舟', fromRows([
    '.....k.....', '....kwW....', '...kwwwW...', '..kwwwwwW..', '.kwwwwwwwW.', '...k.......', 'hhhhhhhhhhh', '.hrrrrrrrh.', '..hhhhhhh..'],
    P({ k: '#5C3A20', w: '#FBF6EA', W: '#C8D7EA', h: '#7A4E2A', r: '#C2410C' }), 3)]],
  ginkgo: [['ginkgo いちょう', fromRows([
    'yyyyyyy', 'yyYyYyy', '.yyYyy.', '..yyy..', '...s...'.replace('s', 'b'), ], P({ y: '#FFC53D', Y: '#F0A91E', b: '#9A5B00' }), 3)]],
  maple: [['maple もみじ', fromRows([
    '..r.r..', 'r.rrr.r', 'rrrRrrr', '.rrRrr.', '..rRr..', '...b...'], P({ r: '#C2412F', R: '#A63D2F', b: '#7A4E2A' }), 3)]],
  'dragonfly-1': [['dragonfly 羽を あげる', fromRows([
    '...ww.ww...', '..wWw.wWw..', 'kkrrrrrrrr.'], P({ w: '#DCEAF7', W: '#B9D2EC', r: '#C2410C', k: '#1E1B18' }), 3)]],
  'dragonfly-2': [['dragonfly 羽を ひろげる', fromRows([
    '.wwwW.WwwW.', 'kkrrrrrrrr.', '.wwwW.WwwW.'], P({ w: '#DCEAF7', W: '#B9D2EC', r: '#C2410C', k: '#1E1B18' }), 3)]],
  snowflake: [['snowflake 雪', fromRows([
    'w..w..w', '.w.w.w.', '..www..', 'wwwcwww', '..www..', '.w.w.w.', 'w..w..w'].map((r) => r), P({ w: '#BFD0EE', c: '#FFFFFF' }), 3)]],
  smoke: [['smoke けむり', fromRows([
    '..ss....', '.ssss...', '..ssss..', '...sSss.', '..ssss..', '.sSsss..', '..ssS...', '.ssss...'].map((r) => r.padEnd(8, '.')),
    P({ s: '#E6ECF8CC', S: '#C9D4EECC' }), 3)]],
  star: [['star 星', fromRows([
    '...y...', '...y...', '..yYy..', 'yyYWYyy', '..yYy..', '...y...', '...y...'], P({ y: '#FFE9A8', Y: '#FFC53D', W: '#FFFFFF' }), 3)]],
  sunrise: [['sunrise 初日の出', (() => {
    const g = new Grid(31, 16, 5), c = 15;
    for (let k = 0; k < 7; k++) { const a = Math.PI + (k * Math.PI) / 6; const rr = 13; g.line(c + 8 * Math.cos(a), 15 + 8 * Math.sin(a), c + rr * Math.cos(a), 15 + rr * Math.sin(a), '#FFD97A99'); }
    g.ell(c, 15, 9, 9, '#FFE9A8AA'); g.ell(c, 15, 7, 7, '#F6A55A'); g.ell(c - 1, 15, 5, 5, '#FFC53D'); g.ell(c - 2, 14, 2.4, 2.4, '#FFE9A8');
    for (let y = 15; y < 16; y++) for (let x = 0; x < 31; x++) g.c[y][x] = null;
    return g;
  })()]],
  'bell-ring': [['bell-ring 鐘の音の輪', (() => {
    const g = new Grid(21, 21, 3), c = 10;
    for (const [R, col] of [[9.2, '#FFE9A866'], [6.2, '#FFE9A8AA'], [3.2, '#FFD97A']]) {
      for (let a = 0; a < 360; a += 2) { const t = (a * Math.PI) / 180; if (a > 25 && a < 65) continue; if (a > 205 && a < 245) continue; g.put(c + R * Math.cos(t), c + R * Math.sin(t), col); }
    }
    return g;
  })()]],
  'flower-spring': [['flower 菜の花', fromRows([
    '..y.y..', '.yyYyy.', '..yyy..', '...g...', 'g..g...', '.g.g.g.', '..ggg..', '...g...'], P({ y: '#FFD161', Y: '#F0A91E', g: '#3E9A63' }), 3)]],
  'flower-summer': [['flower ひまわり', fromRows([
    '..y.y.y..', '.yyyyyyy.', 'yyybbbyyy', 'yybbBbbyy', 'yyybbbyyy', '.yyyyyyy.', '..y.g.y..', '....g....', '..g.g....', '...ggg...', '....g....', '....g....'],
    P({ y: '#FFD161', b: '#7A4E2A', B: '#5C3A20', g: '#3E9A63' }), 3)]],
  'flower-autumn': [['flower コスモス', fromRows([
    '.p.p.p.', 'ppPyPpp', '.pPyPp.', 'ppPyPpp', '.p.p.p.', '...g...', '..gg...', '...g.g.', '...ggg.', '...g...'].map((r) => r.padEnd(7, '.')),
    P({ p: '#E58AA3', P: '#F5B9C8', y: '#FFC53D', g: '#3E9A63' }), 3)]],
  'flower-winter': [['flower つばき', fromRows([
    '.rrrrr.', 'rrRRRrr', 'rRyyyRr', 'rRyyyRr', 'rrRRRrr', '.rrrrr.', 'gg.g.gg', '.ggggg.', '..ggg..'], P({ r: '#C2412F', R: '#A63D2F', y: '#FFC53D', g: '#2F7A4A' }), 3)]],
};

export function build() {
  mkdirSync(OUT, { recursive: true });
  for (const [name, [[title, g]]] of Object.entries(FX)) {
    writeFileSync(join(OUT, `${name}.svg`), toSvg(g, `ギミック：${title}`), 'utf8');
    console.log(`作りました： fx/${name}.svg (${g.w * g.cell}x${g.h * g.cell})`);
  }
}
export const FX_NAMES = Object.keys(FX);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) build();
