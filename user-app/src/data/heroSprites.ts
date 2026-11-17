// 主人公の コマの表。src/assets/sprite/hero-walk-1〜4.svg（歩く4コマ）・hero-attack.svg（てまりを ぽんと出す）・
// hero-cheer.svg（両手を上げる）を まとめて読みこむ（import.meta.glob は Vite の機能）。
// 単体テスト（node --test）では 読めないので、game.ts や ほかの data/*.ts からは 読みこまない。
// 絵が まだ無いときは null（歩く コマは 4枚 そろったときだけ）。そのときは 今の hero.svg を使う（ファイルを 読みに行かない）。

const FILES = import.meta.glob<string>(['../assets/sprite/hero-walk-*.svg', '../assets/sprite/hero-attack*.svg', '../assets/sprite/hero-cheer*.svg'], {
  eager: true,
  import: 'default',
});

const BY_NAME: Partial<Record<string, string>> = {};
for (const [path, src] of Object.entries(FILES)) {
  BY_NAME[path.slice(path.lastIndexOf('/') + 1).replace(/\.svg$/, '')] = src;
}

const walkFrames = [1, 2, 3, 4].map((n) => BY_NAME[`hero-walk-${n}`]);

/** 歩く4コマ（4枚 そろわないときは null） */
export const HERO_WALK: readonly string[] | null = walkFrames.every((src): src is string => typeof src === 'string') ? walkFrames : null;
/** てまりを ぽんと出す コマ（無いときは null） */
export const HERO_ATTACK: string | null = BY_NAME['hero-attack'] ?? null;
/** 両手を上げる コマ（勝ちのポーズ。無いときは null） */
export const HERO_CHEER: string | null = BY_NAME['hero-cheer'] ?? null;
