// 絵のもと（design/sprites/enemy-<id>.txt）から SVG を作る。
// 使い方： node design/build-sprites.mjs        （すべて作る）
//          node design/build-sprites.mjs --check （確かめるだけ。ファイルは書かない）
// 出力： user-app/src/assets/sprite/enemy-<id>.svg
// 今ある3体（amagumo・ishikoron・happappa）は 上書きしない。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, 'sprites');
const OUT = join(here, '..', 'user-app', 'src', 'assets', 'sprite');
const CELL = 5; // 1マス 5px
const MAX_COLORS = 6;
const SIZES = [16, 32]; // ふつう・レアは 16、ボス・裏ボスは 32
const KEEP = new Set(['amagumo', 'ishikoron', 'happappa']); // 上書きしない

/** 絵のもとを 読む。{ id, name, palette:[{ch,color,label}], rows:[string] } */
export function readSprite(file) {
  const id = file.replace(/^.*enemy-/, '').replace(/\.txt$/, '');
  const lines = readFileSync(file, 'utf8').replace(/\r/g, '').split('\n');
  let name = id;
  const palette = [];
  const rows = [];
  let part = '';
  for (const line of lines) {
    if (part !== 'grid' && (line.trim() === '' || line.startsWith('#'))) continue;
    if (line.startsWith('name:')) name = line.slice(5).trim();
    else if (line.startsWith('palette:')) part = 'palette';
    else if (line.startsWith('grid:')) part = 'grid';
    else if (part === 'palette') {
      const m = line.trim().match(/^(\S)\s+(#[0-9A-Fa-f]{6})\s*(.*)$/);
      if (!m) throw new Error(`${id}: 色の行が 読めません「${line}」`);
      palette.push({ ch: m[1], color: m[2].toUpperCase(), label: m[3] });
    } else if (part === 'grid' && line.trim() !== '') rows.push(line);
  }
  return { id, name, palette, rows };
}

/** 決まりに 合っているか。合わない所を 文の 配列で 返す */
export function checkSprite(sp) {
  const errors = [];
  const n = sp.rows.length;
  if (!SIZES.includes(n)) errors.push(`行の数が ${n}（16 か 32 に する）`);
  sp.rows.forEach((r, i) => {
    if (r.length !== n) errors.push(`${i + 1}行目の はばが ${r.length}（${n} に する）`);
  });
  if (sp.palette.length > MAX_COLORS) errors.push(`色が ${sp.palette.length}色（${MAX_COLORS}色まで）`);
  const known = new Set(sp.palette.map((p) => p.ch));
  if (known.has('.')) errors.push('「.」は すきとおる所。色に 使えない');
  const used = new Set();
  sp.rows.forEach((r, i) => {
    for (const ch of r) {
      if (ch === '.') continue;
      if (!known.has(ch)) errors.push(`${i + 1}行目に 色の表に ない 文字「${ch}」`);
      used.add(ch);
    }
  });
  for (const p of sp.palette) if (!used.has(p.ch)) errors.push(`色「${p.ch}」が 使われていない`);
  return errors;
}

/** SVG の 文字列を 作る。同じ色は 1つの path に まとめ、横に つながる マスは 1つの 四角に する */
export function toSvg(sp) {
  const n = sp.rows.length;
  const size = n * CELL;
  const paths = sp.palette.map((p) => {
    let d = '';
    sp.rows.forEach((row, y) => {
      let x = 0;
      while (x < n) {
        if (row[x] !== p.ch) {
          x += 1;
          continue;
        }
        let end = x;
        while (end < n && row[end] === p.ch) end += 1;
        const w = (end - x) * CELL;
        d += `M${x * CELL} ${y * CELL}h${w}v${CELL}h-${w}z`;
        x = end;
      }
    });
    return `<path d="${d}" fill="${p.color}"/>`;
  });
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" ` +
    `xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n` +
    `<title>敵：${sp.name}</title>\n${paths.join('\n')}\n</svg>\n`
  );
}

export function listSprites() {
  return readdirSync(SRC)
    .filter((f) => /^enemy-[a-z0-9]+\.txt$/.test(f))
    .sort()
    .map((f) => readSprite(join(SRC, f)));
}

function main() {
  const checkOnly = process.argv.includes('--check');
  let bad = 0;
  for (const sp of listSprites()) {
    const errors = checkSprite(sp);
    const n = sp.rows.length;
    if (errors.length > 0) {
      bad += 1;
      console.log(`NG ${sp.id}（${sp.name}）\n   - ${errors.join('\n   - ')}`);
      continue;
    }
    if (KEEP.has(sp.id)) {
      console.log(`-- ${sp.id}（${sp.name}）今ある絵なので 書かない`);
      continue;
    }
    if (!checkOnly) writeFileSync(join(OUT, `enemy-${sp.id}.svg`), toSvg(sp), 'utf8');
    console.log(`OK ${sp.id}（${sp.name}）${n}×${n}マス・${sp.palette.length}色`);
  }
  if (bad > 0) {
    console.log(`\n合わない 絵が ${bad}体 あります。`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
