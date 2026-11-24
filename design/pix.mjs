// ドット絵を 描く 小さな 道具（build-stages.mjs・build-fx.mjs で 使う）。マス目の 絵 → SVG。
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Grid {
  /** wrap: true なら 左右が つながる（x は ぐるっと まわる） */
  constructor(w, h, cell, wrap = false) {
    this.w = w; this.h = h; this.cell = cell; this.wrap = wrap; this.ox = 0;
    this.c = Array.from({ length: h }, () => Array(w).fill(null));
  }
  put(x, y, col) {
    x = Math.round(x) + this.ox; y = Math.round(y);
    if (!col || y < 0 || y >= this.h) return;
    if (this.wrap) x = ((x % this.w) + this.w) % this.w;
    else if (x < 0 || x >= this.w) return;
    this.c[y][x] = col;
  }
  get(x, y) { return this.c[y]?.[x] ?? null; }
  rect(x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, col); }
  ell(cx, cy, rx, ry, col) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.put(x, y, col);
      }
  }
  line(x0, y0, x1, y1, col) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) this.put(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, col);
  }
  /** rows: 文字の 配列。map: 文字 → 色。' ' と '.' は 何も 置かない */
  stamp(x, y, rows, map) {
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== ' ' && ch !== '.' && map[ch]) this.put(x + i, y + j, map[ch]); }));
  }
}

function colorAttr(col) {
  if (col.length === 9) return `fill="${col.slice(0, 7)}" fill-opacity="${(parseInt(col.slice(7), 16) / 255).toFixed(2)}"`;
  return `fill="${col}"`;
}

export function toSvg(g, title) {
  const by = new Map();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const col = g.c[y][x];
    if (!col) continue;
    if (!by.has(col)) by.set(col, new Map());
    const rows = by.get(col);
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push(x);
  }
  const K = g.cell;
  const paths = [];
  for (const [col, rows] of by) {
    let d = '';
    for (const [y, xs] of rows) {
      let s = xs[0], p = xs[0];
      const flush = (a, b) => { d += `M${a * K} ${y * K}h${(b - a + 1) * K}v${K}h-${(b - a + 1) * K}z`; };
      for (let k = 1; k < xs.length; k++) {
        if (xs[k] === p + 1) { p = xs[k]; continue; }
        flush(s, p); s = p = xs[k];
      }
      flush(s, p);
    }
    paths.push(`<path d="${d}" ${colorAttr(col)}/>`);
  }
  return (
    `<svg width="${g.w * K}" height="${g.h * K}" viewBox="0 0 ${g.w * K} ${g.h * K}" fill="none" ` +
    `xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n<title>${title}</title>\n${paths.join('\n')}\n</svg>\n`
  );
}
