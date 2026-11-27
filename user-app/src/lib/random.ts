// 決まった乱数（同じ入力なら いつも同じ数が出る）。
// 出会う敵を「種（seed）＋巡り＋エリア＋出会いの番号」から 計算で決めるために使う。
// 保存するのは 種だけで よい。まとめて歩いても 分けて歩いても 同じ敵に会う。

/** 文字から 種を作る（FNV-1a・32ビット）。同じ文字なら 同じ数 */
export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 の まぜ方。state から 0以上1未満の数を 1つ出す */
function mix(state: number): number {
  let t = state | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000;
}

const STEP = 0x6d2b79f5;

/** 種から 乱数の列を作る（mulberry32）。呼ぶたびに 0以上1未満の 次の数が出る */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + STEP) | 0;
    return mix(s);
  };
}

/** mulberry32(seed) の n番目（0から数える）の数を、列を たどらずに 出す */
export function randAt(seed: number, n: number): number {
  return mix(((seed | 0) + Math.imul(STEP, (n | 0) + 1)) | 0);
}

/** 種と いくつかの しるし（巡り・エリア・用途 など）から、べつの種を作る */
export function subSeed(seed: number, ...parts: (number | string)[]): number {
  let h = fnv1a([seed >>> 0, ...parts].join('/'));
  // さいごに よく まぜる（にた入力から にた種が 出ないように）
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
