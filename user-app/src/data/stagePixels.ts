// 場面の 小さな ドット絵（文字の マス目と 色の 表）。
// - FX_FALLBACK：ギミックの 絵（src/assets/scene/fx/）が まだ無いときの 代わりの 絵
// - LANDMARK_ART：ホームで さわれる 目じるし（桜の木・田んぼ など）の 絵
// 文字 1つが 1マス。' ' と '.' は すきとおる。絵は StageGimmicks.tsx の PixelSprite が SVG に する。
// このファイルは React・絵の ファイルを 入れない（データだけ）。

import type { FxName } from './stageArt';

export interface PixelArt {
  /** 1マスの 大きさ（px） */
  cell: number;
  rows: readonly string[];
  palette: Readonly<Record<string, string>>;
}

/** 絵の 大きさ（px） */
export function pixelSize(art: PixelArt): { width: number; height: number } {
  return { width: Math.max(...art.rows.map((r) => r.length)) * art.cell, height: art.rows.length * art.cell };
}

const SUMI = '#1E1B18';

/** まるく ちる 点（花火・鐘の音の 輪）。r：半径（マス）、gap：点の 間の 角度の 数 */
function ring(r: number, dots: number, ch: string): string[] {
  const size = r * 2 + 1;
  const grid = Array.from({ length: size }, () => Array<string>(size).fill('.'));
  for (let i = 0; i < dots; i += 1) {
    const a = (i / dots) * Math.PI * 2;
    grid[Math.round(r + r * Math.sin(a))][Math.round(r + r * Math.cos(a))] = ch;
  }
  return grid.map((row) => row.join(''));
}

/** 花火：外の 輪と 内の 輪 */
function burst(r: number, outer: string, inner: string): string[] {
  const a = ring(r, 16, outer);
  const b = ring(Math.max(1, Math.round(r / 2)), 8, inner);
  const off = r - Math.max(1, Math.round(r / 2));
  return a.map((row, y) =>
    [...row]
      .map((ch, x) => {
        const iy = y - off;
        const ix = x - off;
        const c = b[iy]?.[ix];
        return c && c !== '.' ? c : ch;
      })
      .join(''),
  );
}

/** 初日の出：半分の お日さまと 光の 線 */
function sunrise(): string[] {
  const w = 21;
  const h = 11;
  const rows = Array.from({ length: h }, () => Array<string>(w).fill('.'));
  const cx = 10;
  const cy = 10;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= 5.2) rows[y][x] = d <= 3.6 ? 'S' : 's';
    }
  }
  // 光の 線（5本）
  for (const [dx, dy] of [
    [0, -1],
    [-0.7, -0.7],
    [0.7, -0.7],
    [-1, -0.25],
    [1, -0.25],
  ]) {
    for (let k = 6.5; k <= 9.5; k += 1) {
      const x = Math.round(cx + dx * k);
      const y = Math.round(cy + dy * k);
      if (rows[y]?.[x] !== undefined) rows[y][x] = 'g';
    }
  }
  return rows.map((r) => r.join(''));
}

/** 四季の 花（くきと 葉は 同じ。花の 色だけ かえる） */
function flower(petal: string, light: string): PixelArt {
  return {
    cell: 3,
    rows: ['.p.p.', 'pPcPp', '.ppp.', '..g..', '.gg..', '..g.g', '..gg.'],
    palette: { p: petal, P: light, c: '#FFC53D', g: '#3E9A63' },
  };
}

export const FX_FALLBACK: Readonly<Record<FxName, PixelArt>> = {
  petal: { cell: 2, rows: ['.pp..', 'pPPp.', '.pPpp', '..pp.'], palette: { p: '#F2A7B8', P: '#F9DDE3' } },
  'butterfly-1': {
    cell: 2,
    rows: ['yy.k.yy', 'yYykyYy', '.yykyy.', '.y.k.y.'],
    palette: { y: '#FFD161', Y: '#FFF3C4', k: SUMI },
  },
  'butterfly-2': {
    cell: 2,
    rows: ['..yky..', '.yYkYy.', '..yky..', '...k...'],
    palette: { y: '#FFD161', Y: '#FFF3C4', k: SUMI },
  },
  cloud: {
    cell: 3,
    rows: ['.....wwww.......', '...wwwwwwww.ww..', '.wwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', '.ssssssssssssss.'],
    palette: { w: '#F4F7FB', s: '#DDE4F7' },
  },
  raindrop: { cell: 2, rows: ['d', 'd', 'D', 'D'], palette: { d: '#E6F0FA', D: '#A9C4E8' } },
  ripple: { cell: 2, rows: ['..wwwww..', 'ww.....ww', '..wwwww..'], palette: { w: '#E6F2FB' } },
  frog: {
    cell: 2,
    rows: ['.gg..gg.', 'gkggggkg', 'gggggggg', '.gGGGGg.', 'g.g..g.g'],
    palette: { g: '#6CC04A', G: '#A8D672', k: SUMI },
  },
  firefly: { cell: 2, rows: ['.y.', 'yYy', '.y.'], palette: { y: '#D6F28A', Y: '#F7FFD0' } },
  lantern: {
    cell: 2,
    rows: ['...k...', '..kkk..', '.rrrrr.', 'rrRrrrr', 'rrRrrrr', 'kkkkkkk', 'rrRrrrr', 'rrRrrrr', '.rrrrr.', '..kkk..', '...k...'],
    palette: { r: '#C2410C', R: '#E8732C', k: SUMI },
  },
  windchime: {
    cell: 2,
    rows: ['...k...', '..ggg..', '.gGggg.', '.ggrgg.', 'ggggggg', '...k...', '...k...', '..ppp..', '..pPp..', '..ppp..', '..ppp..'],
    palette: { g: '#BFE6F7', G: '#FFFFFF', r: '#C2410C', k: SUMI, p: '#F2A7B8', P: '#F9DDE3' },
  },
  'firework-1': { cell: 3, rows: burst(6, 'a', 'b'), palette: { a: '#FFC53D', b: '#FFF3C4' } },
  'firework-2': { cell: 3, rows: burst(6, 'a', 'b'), palette: { a: '#F2A7B8', b: '#F9DDE3' } },
  'firework-3': { cell: 3, rows: burst(6, 'a', 'b'), palette: { a: '#8FD0F2', b: '#E6F2FB' } },
  wave: {
    cell: 3,
    rows: ['..wwww......', '.wwbbwww..ww', 'wwbbbbbwwwww'],
    palette: { w: '#F4F7FB', b: '#8FD0F2' },
  },
  'gull-1': { cell: 2, rows: ['w.......w', '.ww...ww.', '...www...', '....k....'], palette: { w: '#F4F7FB', k: SUMI } },
  'gull-2': { cell: 2, rows: ['.........', 'www...www', '...www...', '....k....'], palette: { w: '#F4F7FB', k: SUMI } },
  boat: {
    cell: 2,
    rows: ['.....k......', '.....kw.....', '.....kww....', '.....kwww...', 'bbbbbbbbbbbb', '.bBBBBBBBBb.', '..bbbbbbbb..'],
    palette: { b: '#9A5B00', B: '#C98B3A', w: '#F4F7FB', k: SUMI },
  },
  ginkgo: { cell: 2, rows: ['yyyyy', 'yYyyy', '.yyy.', '..y..', '..k..'], palette: { y: '#FFC53D', Y: '#FFE08A', k: '#9A5B00' } },
  maple: { cell: 2, rows: ['..r..', 'rrRrr', '.rrr.', 'r.r.r', '..k..'], palette: { r: '#A63D2F', R: '#D9822B', k: '#7A4A2A' } },
  'dragonfly-1': {
    cell: 2,
    rows: ['.ww.ww...', '..www....', 'rrrrrrrRk', '..www....', '.ww.ww...'],
    palette: { w: '#E6F2FB', r: '#C2410C', R: '#E8732C', k: SUMI },
  },
  'dragonfly-2': {
    cell: 2,
    rows: ['.........', '.wwwww...', 'rrrrrrrRk', '.wwwww...', '.........'],
    palette: { w: '#E6F2FB', r: '#C2410C', R: '#E8732C', k: SUMI },
  },
  snowflake: { cell: 2, rows: ['.w.', 'wWw', '.w.'], palette: { w: '#FFFFFF', W: '#DDE4F7' } },
  smoke: { cell: 3, rows: ['.ss..', 'sssss', 'sSsss', '.sss.'], palette: { s: '#DDE4F7', S: '#F4F7FB' } },
  star: { cell: 2, rows: ['.y.', 'yYy', '.y.'], palette: { y: '#FFC53D', Y: '#FFF3C4' } },
  sunrise: { cell: 3, rows: sunrise(), palette: { s: '#C2410C', S: '#E8732C', g: '#FFC53D' } },
  'bell-ring': { cell: 2, rows: ring(8, 24, 'w'), palette: { w: '#FFE08A' } },
  'flower-spring': flower('#F2A7B8', '#F9DDE3'),
  'flower-summer': flower('#7A8FD0', '#C3D0F2'),
  'flower-autumn': flower('#D9822B', '#FFC53D'),
  'flower-winter': flower('#C2410C', '#F4F7FB'),
};

// ---------- ホームの 目じるし（背景の 絵が 無いときの 代わり。1マス 4px。主人公と 敵の あいだに おさまる） ----------

export type LandmarkPart = 'sakura' | 'tanbo' | 'pole' | 'toudai' | 'kaki' | 'house' | 'flowerBed' | 'kane';

const TREE_ROWS = [
  '....aaAaa....',
  '..aaAaaaaAa..',
  '.aaaaaAaaaaaa',
  'aaAaaaaaaaAaa',
  'aaaaaAaaAaaaa',
  '.aaAaaaaaaaa.',
  '..aaaaaAaaa..',
  '....aatAa....',
  '......t......',
  '.....tt......',
  '.....tT......',
  '.....tT......',
  '....ttTt.....',
  '..ggggggggg..',
];

export const LANDMARK_ART: Readonly<Record<LandmarkPart, PixelArt>> = {
  // 桜の木
  sakura: { cell: 4, rows: TREE_ROWS, palette: { a: '#F2A7B8', A: '#F9DDE3', t: '#7A4A2A', T: '#9A5B00', g: '#6CC04A' } },
  // 柿の木（だいだいの 実）
  kaki: { cell: 4, rows: TREE_ROWS, palette: { a: '#C98B3A', A: '#E8732C', t: '#7A4A2A', T: '#9A5B00', g: '#C9A23A' } },
  // 田んぼ（あぜと 水と 苗）
  tanbo: {
    cell: 4,
    rows: ['.g...g....g...g.', '.gg.gg...gg..gg.', '..g..g....g...g.', 'eeeeeeeeeeeeeeee', 'ewwWwwwwwwwWwwwe', 'ewwwwwWwwwwwwwwe', 'eeeeeeeeeeeeeeee'],
    palette: { g: '#6CC04A', e: '#7A5A3A', w: '#7FB8D8', W: '#C8EAF9' },
  },
  // 風鈴を つるす 竿（風鈴は べつに 重ねる）
  pole: {
    cell: 4,
    rows: [
      'bbbbbbbbbbbbbb..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '.............b..',
      '............bBb.',
      '..........gggggg',
    ],
    palette: { b: '#7A4A2A', B: '#9A5B00', g: '#4F7F3A' },
  },
  // 灯台
  toudai: {
    cell: 4,
    rows: [
      '...rrr...',
      '..rrrrr..',
      '..kyyyk..',
      '..kyyyk..',
      '.kkkkkkk.',
      '...www...',
      '...www...',
      '...rrr...',
      '...rrr...',
      '...www...',
      '...www...',
      '..rrrrr..',
      '..rrrrr..',
      '..wwwww..',
      '.ggggggg.',
      'ggggggggg',
    ],
    palette: { r: '#C2410C', y: '#FFE08A', k: '#2D3A6B', w: '#F4F7FB', g: '#9AA3B5' },
  },
  // 縁側の家（雪の 屋根・えんとつ・窓・縁側）
  house: {
    cell: 4,
    rows: [
      '..........cc....',
      '..........cc....',
      '...ssssssssss...',
      '..ssSsssssssSss.',
      '.ssssssssssssss.',
      'ssssssssssssssss',
      '.rrrrrrrrrrrrrr.',
      '.wwwwwwwwwwwwww.',
      '.wwkkkkwwwkkkkw.',
      '.wwkddkwwwkddkw.',
      '.wwkddkwwwkddkw.',
      '.wwkkkkwwwkkkkw.',
      'bbbbbbbbbbbbbbbb',
      '.b..b......b..b.',
    ],
    palette: { c: '#7A4A2A', s: '#FFFFFF', S: '#DDE4F7', r: '#2D3A6B', w: '#FBF6EA', k: '#5A3A20', d: '#3A4578', b: '#9A5B00' },
  },
  // 四季の 花だん（花は べつに 重ねる）
  flowerBed: {
    cell: 4,
    rows: ['bbbbbbbbbbbbbbbb', 'bddddddddddddddb', 'bbbbbbbbbbbbbbbb'],
    palette: { b: '#9A5B00', d: '#6B4A2A' },
  },
  // 峠の 鐘（屋根の 下に つるした 鐘）
  kane: {
    cell: 4,
    rows: [
      '.rrrrrrrrrr.',
      'rrrrrrrrrrrr',
      '..b......b..',
      '..b..kk..b..',
      '..b.gggg.b..',
      '..b.gGgg.b..',
      '..b.gggg.b..',
      '..bggggggb..',
      '..bggggggb..',
      '..b......b..',
      '..b......b..',
      '..b......b..',
      '.ssssssssss.',
      'ssssssssssss',
    ],
    palette: { r: '#2D4A5A', b: '#7A4A2A', k: '#1E1B18', g: '#5FA89A', G: '#9AD4C8', s: '#9AA3B5' },
  },
};

/** 縁側の家の 窓（あかりを ともす 所。マス） */
export const HOUSE_WINDOWS: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 4, y: 9, w: 2, h: 2 },
  { x: 11, y: 9, w: 2, h: 2 },
];
/** 縁側の家の えんとつの 上（マス） */
export const HOUSE_CHIMNEY = { x: 10, y: 0 };
