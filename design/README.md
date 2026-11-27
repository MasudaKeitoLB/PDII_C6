# design（絵のもと）

敵の ドット絵の もとと、SVG・一覧の 画像を 作る 道具を 置く 場所。名前・姿・色の きまりは `docs/世界観.md`（5章・7章）。

## 中身

| 場所 | 中身 |
| --- | --- |
| `sprites/enemy-<id>.txt` | 絵のもと（1体 1ファイル）。文字の マス目と 色の 表 |
| `build-sprites.mjs` | 絵のもと → `user-app/src/assets/sprite/enemy-<id>.svg` |
| `contact.mjs` | 一覧の 画像（コンタクトシート）→ `contact/<エリア>.png` |
| `contact/area1.png` | エリア1の 14体の 一覧（白い 背景と 場面の 色、実際の 大きさと 3倍） |

## 絵のもとの 書き方

```
name: つくしんぼ
palette:
k #1E1B18 りんかく・目
h #B07A45 頭
grid:
......kkkk......
（16行、または 32行）
```

- `name:` ひらがなの 名前。id は ファイル名（`enemy-<id>.txt`）から とる。
- `palette:` 1行に「1文字　色（#RRGGBB）　何の色か」。**6色まで**（りんかくの 墨を ふくむ）。
- `grid:` マス目。`.` は すきとおる所。ふつう・レアは 16×16、ボス・裏ボスは 32×32。行の 数と はばを 同じに する。
- 1マスは 5px。16×16 は 80×80、32×32 は 160×160 の SVG に なる。
- りんかくと 目は `k`（墨 `#1E1B18`）。目は 2×2マスか 1×2マス（ボスは 2×3マス）。

## 使い方

作業場所の いちばん上（`pdii_c6-game`）で 動かす。入れる ものは ない（node だけ）。

```
node design/build-sprites.mjs --check   # きまりに 合うか 確かめるだけ
node design/build-sprites.mjs           # SVG を 作る
node design/contact.mjs                 # 一覧の 画像を 作る
```

- 今ある3体（amagumo・ishikoron・happappa）は 絵のもとが なく、SVG も 上書きしない。
- 一覧の 画像は、もとの リポジトリの `playwright-core` と PC の Chrome を 使って 撮る。場所が ちがう ときは 環境変数 `HOHO_PLAYWRIGHT` に `file:///…/playwright-core/index.mjs` を 入れる。
- いしころんは 小さい絵（`enemy-ishikoron-small.svg`、1マス 3px）しか ないので、一覧では 5/3倍に して 同じ ドットの 大きさで ならべている。
- 絵を 直したら、一覧の 画像を 作りなおして 目で 確かめる（80px で 形が 分かるか、にた絵が ないか）。

## エリアの背景・遠景・ギミック

| 場所 | 中身 |
| --- | --- |
| `build-stages.mjs` | 背景 395×420（`stage/area1-bg.svg`〜`area7-bg.svg`・`end-bg.svg`）と 流れる遠景 400×140（`*-far.svg`）を 作る |
| `build-fx.mjs` | ギミックの 小さな 絵（`scene/fx/*.svg`、1マス 3px か 5px）を 作る |
| `pix.mjs` | マス目の 絵 → SVG の 道具 |
| `contact-stages.mjs` | 一覧 `contact/stages.png`（主人公・あまぐも・文字の枠を 重ねた 見本、遠景は 2回ならべ、ギミックは 4倍） |

`node design/build-stages.mjs` / `node design/build-fx.mjs` / `node design/contact-stages.mjs`
