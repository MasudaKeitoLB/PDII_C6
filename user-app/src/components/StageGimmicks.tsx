import type { CSSProperties, ReactNode } from 'react';
import { fxArt, type FxName } from '../data/stageArt';
import { FX_FALLBACK, HOUSE_CHIMNEY, HOUSE_WINDOWS, LANDMARK_ART, pixelSize, type LandmarkPart, type PixelArt } from '../data/stagePixels';
import { LANDMARK_HEIGHT, drawCount, stageDef, type GimmickId, type Landmark, type StageLayout } from '../data/stages';
import s from './StageScene.module.css';

// 場面の ギミック 1つずつの 絵と 動き。動かすのは transform と opacity だけ（StageScene.module.css）。
// 位置は 横が はばの ％、たてが「空の 上（--sky）〜 地面（--ground）」の 割合か、地面からの px（背景の 絵に 合わせる 物）。
// ホーム・歩行中・戦闘で 同じ 書き方に する。

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

/** 空の 上（0）〜 地面（1）の あいだの 高さ */
const yAt = (f: number) => `calc(var(--sky) + (var(--ground) - var(--sky)) * ${f})`;
/** 地面から dy px 上 */
const aboveGround = (dy: number) => `calc(var(--ground) - ${dy}px)`;

// ---------- 絵 ----------

const compiled = new WeakMap<PixelArt, { width: number; height: number; paths: [string, string][] }>();

/** 文字の マス目を SVG の 道（色ごとに 1本）に する（1回だけ 作って 覚えておく） */
function compile(art: PixelArt) {
  const hit = compiled.get(art);
  if (hit) return hit;
  const byColor = new Map<string, string>();
  art.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const color = art.palette[ch];
      if (!color) {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end += 1;
      const c = art.cell;
      byColor.set(color, `${byColor.get(color) ?? ''}M${x * c} ${y * c}h${(end - x) * c}v${c}h${-(end - x) * c}z`);
      x = end;
    }
  });
  const out = { ...pixelSize(art), paths: [...byColor.entries()] };
  compiled.set(art, out);
  return out;
}

/** 小さな ドット絵（代わりの 絵・目じるし） */
export function PixelSprite({ art, className, style }: { art: PixelArt; className?: string; style?: CSSProperties }) {
  const { width, height, paths } = compile(art);
  return (
    <svg className={cx(s.pixel, className)} style={style} width={width} height={height} viewBox={`0 0 ${width} ${height}`} shapeRendering="crispEdges">
      {paths.map(([color, d]) => (
        <path key={color} d={d} fill={color} />
      ))}
    </svg>
  );
}

/** ギミックの 絵（デザイン担当の 絵が 無ければ 代わりの ドット絵）。fallback：かならず 代わりの 絵に する */
export function Fx({ name, className, fallback = false }: { name: FxName; className?: string; fallback?: boolean }) {
  const src = fallback ? null : fxArt(name);
  if (src) return <img className={cx(s.fx, className)} src={src} alt="" draggable={false} data-fx={name} />;
  return <PixelSprite art={FX_FALLBACK[name]} className={cx(s.fx, className)} />;
}

/** つづきの 絵（はばたく 2コマ・花火の 3コマ）が ぜんぶ そろって いるか。そろわないときは ぜんぶ 代わりの 絵にする */
const allArt = (names: readonly FxName[]) => names.every((name) => fxArt(name));

/** はばたく 2コマ */
function Flap({ a, b, sec }: { a: FxName; b: FxName; sec: number }) {
  const fallback = !allArt([a, b]);
  return (
    <span className={s.frames} style={{ '--flap': `${sec}s` } as Vars}>
      <Fx name={a} fallback={fallback} className={s.frameA} />
      <Fx name={b} fallback={fallback} className={s.frameB} />
    </span>
  );
}

// ---------- 位置の 表（くりかえしても 同じ 場所に 出る） ----------

/** 落ちる 粒：横（％）・長さ（秒）・はじめの ずらし（秒）・横の ゆれ（px）・回る 角度 */
const FALL = [
  { x: 8, dur: 11, delay: -2, dx: 24, rot: 260 },
  { x: 30, dur: 13, delay: -7, dx: -18, rot: -220 },
  { x: 55, dur: 12, delay: -4, dx: 20, rot: 240 },
  { x: 80, dur: 14, delay: -10, dx: -22, rot: -200 },
  { x: 44, dur: 12.5, delay: -12, dx: 16, rot: 180 },
  { x: 68, dur: 15, delay: -1, dx: -14, rot: -160 },
  { x: 20, dur: 13.5, delay: -5.5, dx: 12, rot: 200 },
  { x: 92, dur: 12, delay: -8.5, dx: -10, rot: -180 },
];
const RAIN = [6, 22, 38, 54, 70, 86].map((x, i) => ({ x, dur: 1.7 + (i % 3) * 0.2, delay: -(i * 0.37) }));
const STARS = [
  { x: 8, f: 0.04, dur: 5.5 },
  { x: 52, f: 0.03, dur: 6.5 },
  { x: 30, f: 0.14, dur: 6 },
  { x: 88, f: 0.08, dur: 7 },
  { x: 70, f: 0.18, dur: 5 },
  { x: 42, f: 0.3, dur: 6.8 },
  { x: 16, f: 0.3, dur: 5.8 },
  { x: 80, f: 0.34, dur: 6.2 },
];
const SKY_COLORS = ['#F2A7B8', '#8FD0F2', '#FFC53D', '#C9B6E4'];
const SEASON_FLOWERS: readonly FxName[] = ['flower-spring', 'flower-summer', 'flower-autumn', 'flower-winter'];
const FIREWORK_FRAMES: readonly FxName[] = ['firework-1', 'firework-2', 'firework-3'];

const n = (count: number) => Array.from({ length: count }, (_, i) => i);

// ---------- ギミック ----------

interface GimmickProps {
  id: GimmickId;
  layout: StageLayout;
  /** 描く 粒の 数（stages.ts の drawCount。かならず この 数だけ 描く） */
  count: number;
}

/**
 * ギミック 1つ（目じるしの 一部の ものは ここでは 出さない：LandmarkArt）。出る ときは ふわっと 出て、
 * leaving（時間帯や 天気が かわって 出さなくなった）の 間は ふわっと 消える
 */
export function Gimmick({ id, layout, count, leaving = false }: GimmickProps & { leaving?: boolean }) {
  return (
    <span className={cx(s.gimmick, leaving && s.leaving)} data-gimmick={id} data-leaving={leaving || undefined}>
      <GimmickBody id={id} layout={layout} count={count} />
    </span>
  );
}

function GimmickBody({ id, layout, count }: GimmickProps): ReactNode {
  // 背景の 絵（エリアの bg）が ある 場面：ホームと 戦闘。歩行中は 遠景だけ
  const scenery = layout !== 'walk';
  switch (id) {
    case 'petals':
    case 'leaves':
    case 'snow':
      return n(count).map((i) => {
        const p = FALL[i % FALL.length];
        const snow = id === 'snow';
        const name: FxName = id === 'petals' ? 'petal' : snow ? 'snowflake' : i % 2 ? 'maple' : 'ginkgo';
        return (
          <span
            key={i}
            className={s.fall} data-part
            style={{ left: `${snow ? 5 + i * 16 : p.x}%`, '--dur': `${snow ? p.dur + 2 : p.dur}s`, '--delay': `${p.delay}s`, '--dx': `${snow ? p.dx / 2 : p.dx}px`, '--rot': `${snow ? p.rot / 4 : p.rot}deg` } as Vars}
          >
            <Fx name={name} />
          </span>
        );
      });
    case 'rain':
      return n(count).map((i) => {
        const p = RAIN[i % RAIN.length];
        return (
          <span key={i} className={s.rain} data-part style={{ left: `${p.x}%`, '--dur': `${p.dur}s`, '--delay': `${p.delay}s`, '--dx': '-10px' } as Vars}>
            <Fx name="raindrop" />
          </span>
        );
      });
    case 'ripples':
      return n(count).map((i) => (
        <span key={i} className={s.ripple} data-part style={{ left: `${[24, 58, 86][i % 3]}%`, top: 'var(--floor)', '--delay': `${-i * 0.9}s` } as Vars}>
          <Fx name="ripple" />
        </span>
      ));
    case 'butterflies':
      return n(count).map((i) => (
        <span key={i} className={s.hover} data-part style={{ left: `${[14, 48][i % 2]}%`, top: yAt([0.38, 0.5][i % 2]), '--dur': `${11 + i * 2}s`, '--delay': `${-i * 4}s`, '--hx': '28px', '--hy': '8px' } as Vars}>
          <Flap a="butterfly-1" b="butterfly-2" sec={0.5} />
        </span>
      ));
    case 'dragonflies':
      return n(count).map((i) => (
        <span key={i} className={s.hover} data-part style={{ left: `${[20, 58][i % 2]}%`, top: yAt([0.35, 0.28][i % 2]), '--dur': `${9 + i * 2}s`, '--delay': `${-i * 3}s`, '--hx': '34px', '--hy': '5px' } as Vars}>
          <Flap a="dragonfly-1" b="dragonfly-2" sec={0.4} />
        </span>
      ));
    case 'clouds':
      return n(count).map((i) => (
        <span key={i} className={s.drift} data-part style={{ top: yAt([0.08, 0.22][i % 2]), '--dur': `${[110, 140][i % 2]}s`, '--delay': `${[-40, -95][i % 2]}s`, '--sx': `${[18, 62][i % 2]}%` } as Vars}>
          <Fx name="cloud" />
        </span>
      ));
    case 'gulls':
      return n(count).map((i) => (
        <span key={i} className={s.drift} data-part style={{ top: yAt([0.16, 0.3][i % 2]), '--dur': `${[32, 40][i % 2]}s`, '--delay': `${[-6, -24][i % 2]}s`, '--sx': `${[28, 66][i % 2]}%` } as Vars}>
          <Flap a="gull-1" b="gull-2" sec={0.8} />
        </span>
      ));
    case 'boat':
      // 海の 上（背景の 水平線の 少し 下）を 右から 左へ
      return (
        <span className={cx(s.drift, s.back)} data-part style={{ top: aboveGround(66), '--dur': '90s', '--delay': '-30s', '--sx': '70%' } as Vars}>
          <Fx name="boat" />
        </span>
      );
    case 'waves':
      // 波うちぎわ（主人公の 左と、敵の 右）
      return n(count).map((i) => (
        <span key={i} className={s.wave} data-part style={{ left: `${[0, 84][i % 2]}%`, top: aboveGround(22), '--delay': `${-i * 3}s` } as Vars}>
          <Fx name="wave" />
        </span>
      ));
    case 'frog':
      return (
        <span className={s.hop} data-part style={{ left: '57%', top: aboveGround(14) }}>
          <Fx name="frog" />
        </span>
      );
    case 'fireflies':
      return n(count).map((i) => (
        <span key={i} className={s.float} data-part style={{ left: `${[10, 30, 62, 88][i % 4]}%`, top: yAt([0.55, 0.72, 0.6, 0.7][i % 4]), '--dur': `${7 + i}s`, '--delay': `${-i * 2}s`, '--dx': `${i % 2 ? -10 : 10}px` } as Vars}>
          <span className={s.glowBox} style={{ '--glow': `${3.6 + i * 0.4}s` } as Vars}>
            <span className={s.fireflyGlow} />
            <Fx name="firefly" />
          </span>
        </span>
      ));
    case 'lanterns':
      return layout === 'walk' ? <LanternRow count={count} /> : <LanternString count={count} />;
    case 'fireworks':
      // 1つの 花火は 3コマ（小さく → ひらく → いっぱい）を やわらかく つないで ひらき、ゆっくり 消える
      return n(count).map((i) => {
        const fallback = !allArt(FIREWORK_FRAMES);
        return (
          <span key={i} className={s.firework} data-part style={{ left: `${[50, 44, 56][i % 3]}%`, top: yAt([0.18, 0.1, 0.26][i % 3]), '--delay': `${-27 + 4 + i * 9}s` } as Vars}>
            {FIREWORK_FRAMES.map((name, k) => (
              <Fx key={name} name={name} fallback={fallback} className={[s.fw1, s.fw2, s.fw3][k]} />
            ))}
          </span>
        );
      });
    case 'stars':
    case 'starrySky':
      return n(count).map((i) => {
        const p = STARS[i % STARS.length];
        return (
          <span key={i} className={s.twinkle} data-part style={{ left: `${p.x}%`, top: yAt(p.f), '--dur': `${p.dur}s`, '--delay': `${-i * 1.3}s` } as Vars}>
            <Fx name="star" className={s.star} />
          </span>
        );
      });
    case 'skyCycle':
      return SKY_COLORS.map((color, i) => <span key={color} className={s.skyLayer} style={{ '--c': color, '--delay': `${-i * 12}s` } as Vars} />);
    case 'bellRings':
      // 鐘の音の 輪：ホーム・戦闘は 背景の 鐘から、歩行中は 空から
      return n(count).map((i) => (
        <span key={i} className={s.bellRing} data-part style={{ left: scenery ? '49%' : '50%', top: scenery ? aboveGround(64) : yAt(0.3), '--delay': `${-i * 3}s` } as Vars}>
          <Fx name="bell-ring" />
        </span>
      ));
    case 'sunrise':
      // 初日の出：ホーム・戦闘は 左の 空（鐘の 屋根に かからない）、歩行中は まん中の 空
      return (
        <span className={s.sunrise} data-part style={{ left: scenery ? '19%' : '50%', top: scenery ? aboveGround(146) : '8px' }}>
          <Fx name="sunrise" className={s.sunriseArt} />
        </span>
      );
    default:
      // 目じるしの 一部（風鈴・煙・窓の あかり・四季の 花）は LandmarkArt が 出す
      return null;
  }
}

/** ちょうちん（ホーム・戦闘）：ひもに 3つ つるし、ゆれて ほのかに ともる */
function LanternString({ count }: { count: number }) {
  return (
    <span className={s.lanternString} style={{ top: yAt(0.38) }}>
      {n(count).map((i) => (
        <span key={i} className={s.sway} data-part style={{ left: `${[8, 44, 80][i % 3]}%`, '--dur': `${4.4 + i * 0.6}s`, '--delay': `${-i * 1.5}s` } as Vars}>
          <span className={s.lanternLight} style={{ '--delay': `${-i * 1.7}s` } as Vars} />
          <Fx name="lantern" />
        </span>
      ))}
    </span>
  );
}

/** ちょうちん（歩行中）：上の ひもに 100px ごとに ならび（7つで はば 600px の 画面まで うまる）、遠景と 同じ 速さで 流れる */
function LanternRow({ count }: { count: number }) {
  return (
    <span className={s.lanternRow}>
      {n(count).map((i) => (
        <span key={i} className={s.lanternCell} data-part>
          <Fx name="lantern" />
        </span>
      ))}
    </span>
  );
}

// ---------- ホームの 目じるし（さわれる 物） ----------

/** 目じるしの 箱の 大きさ（地面の 2px 下まで） */
const BOX_HEIGHT = LANDMARK_HEIGHT + 2;
/** 縁側の家：背景の 窓の まん中と、代わりの 家（箱の 下の まん中に 置く）の 窓・えんとつ（箱の 左上から） */
const ART_WINDOWS = [
  { x: 18, y: 21 },
  { x: 63, y: 21 },
];
const HOUSE = LANDMARK_ART.house;
const HOUSE_SIZE = pixelSize(HOUSE);
const HOUSE_LEFT = (stageDef('area6').landmark.width - HOUSE_SIZE.width) / 2;
const HOUSE_TOP = BOX_HEIGHT - HOUSE_SIZE.height;
const FALLBACK_WINDOWS = HOUSE_WINDOWS.map((w) => ({ x: HOUSE_LEFT + (w.x + w.w / 2) * HOUSE.cell, y: HOUSE_TOP + (w.y + w.h / 2) * HOUSE.cell }));
const FALLBACK_CHIMNEY = { x: HOUSE_LEFT + (HOUSE_CHIMNEY.x + 1) * HOUSE.cell, y: HOUSE_TOP + HOUSE_CHIMNEY.y * HOUSE.cell };

/** 背景の 絵が 無いときに 目じるしの 代わりに 描く ドット絵 */
const FALLBACK_PART: Readonly<Record<string, LandmarkPart>> = {
  sakura: 'sakura',
  suisha: 'tanbo',
  furin: 'pole',
  toudai: 'toudai',
  kaki: 'kaki',
  ie: 'house',
  hana: 'flowerBed',
  kane: 'kane',
};

interface LandmarkProps {
  landmark: Landmark;
  /** 背景の 絵（エリアの bg）が ある。無ければ 目じるしの 代わりの ドット絵を 描く */
  art: boolean;
  /** さわった 回数（ふえるたびに 反応を 出しなおす） */
  taps: number;
  reacting: boolean;
  still: boolean;
  /** 目じるしの 一部の ギミック（風鈴・煙・窓の あかり・四季の 花）で、いま 出す もの */
  on: ReadonlySet<GimmickId>;
}

/** 目じるしの 絵（背景に 無い ときだけ）と、ゆれる 物・さわった ときの 反応。位置は 箱の 左上から */
export function LandmarkArt({ landmark, art, taps, reacting, still, on }: LandmarkProps) {
  const { id, at } = landmark;
  const burst = taps > 0 && !still;
  const part = FALLBACK_PART[id];
  const anchor = (extra?: Vars): Vars => ({ left: at.x, top: at.y, ...extra });
  return (
    <>
      {!art && part && <PixelSprite art={LANDMARK_ART[part]} className={s.lmBottom} />}
      {id === 'sakura' && burst && <Burst key={taps} name="petal" count={landmark.burst} from={at} spread={34} fall={44} />}
      {id === 'kaki' && burst && <Burst key={taps} name="maple" alt="ginkgo" count={landmark.burst} from={at} spread={26} fall={56} />}
      {id === 'suisha' &&
        burst &&
        n(landmark.burst).map((i) => (
          <span key={`${taps}-${i}`} className={s.tapRipple} data-part style={anchor({ left: at.x - 16 + i * 24, '--delay': `${i * 0.25}s` })}>
            <Fx name="ripple" />
          </span>
        ))}
      {id === 'furin' && (
        <>
          {/* 門の 下の はりから つるした 風鈴。いつも 小さく ゆれ、さわると 少し 大きく ゆれる */}
          <span className={s.chimeString} style={anchor({ height: 5 })} />
          <span
            key={taps}
            className={cx(s.chime, on.has('windchime') && s.chimeSway, reacting && !still && s.chimeSwing)}
            data-part
            style={anchor({ top: at.y + 4 })}
            data-gimmick={on.has('windchime') ? 'windchime' : undefined}
          >
            <Fx name="windchime" />
          </span>
        </>
      )}
      {id === 'toudai' && <span className={s.lamp} data-on={reacting || undefined} style={anchor()} />}
      {id === 'ie' && (
        <>
          {/* 窓の あかり（夕〜夜・さわったとき）。背景の 窓の 上に やわらかい 光を 重ねる */}
          {(art ? ART_WINDOWS : FALLBACK_WINDOWS).slice(0, drawCount('windowLight', 'home')).map((w, i) => (
            <span
              key={i}
              className={s.windowGlow}
              data-part
              data-on={on.has('windowLight') || reacting || undefined}
              data-gimmick={on.has('windowLight') ? 'windowLight' : undefined}
              style={{ left: w.x, top: w.y }}
            />
          ))}
          {/* えんとつの 煙（背景が 無いときは 代わりの 家の えんとつ） */}
          {on.has('smoke') &&
            !still &&
            n(drawCount('smoke', 'home')).map((i) => (
              <span
                key={i}
                className={s.smoke} data-part
                data-gimmick="smoke"
                style={{ left: (art ? at.x : FALLBACK_CHIMNEY.x) - 12, top: (art ? at.y : FALLBACK_CHIMNEY.y) - 18, '--delay': `${-i * 3.5}s` } as Vars}
              >
                <Fx name="smoke" />
              </span>
            ))}
          {burst && <Burst key={taps} name="snowflake" count={landmark.burst} from={{ x: at.x, y: at.y + 44 }} spread={22} fall={24} />}
        </>
      )}
      {id === 'hana' &&
        SEASON_FLOWERS.slice(0, drawCount('seasonFlowers', 'home')).map((name, i) => (
          // 丘の ふもとの 四季の 花。春 → 夏 → 秋 → 冬 の 順に 咲く。さわると ぽんと 咲く
          <span key={`${taps}-${name}`} className={cx(s.flowerSlot, reacting && !still && s.pop)} data-part style={{ left: at.x - 6 + i * 15, top: at.y - [0, 5, 2, 6][i] }}>
            <span
              className={cx(s.flower, on.has('seasonFlowers') && s.blooming)}
              style={{ '--delay': `${-((4 - i) % 4) * 4}s` } as Vars}
              data-gimmick={on.has('seasonFlowers') ? 'seasonFlowers' : undefined}
            >
              <Fx name={name} />
            </span>
          </span>
        ))}
      {id === 'kane' &&
        burst &&
        n(landmark.burst).map((i) => (
          <span key={`${taps}-${i}`} className={s.tapRing} data-part style={anchor({ '--delay': `${i * 0.4}s` })}>
            <Fx name="bell-ring" />
          </span>
        ))}
    </>
  );
}

/** さわった ときに ふわっと ちる 粒（1回だけ）。alt：1つおきに まぜる 絵 */
function Burst({ name, alt, count, from, spread, fall }: { name: FxName; alt?: FxName; count: number; from: { x: number; y: number }; spread: number; fall: number }) {
  return (
    <>
      {n(count).map((i) => {
        const side = i % 2 ? 1 : -1;
        const dx = side * (spread * (0.5 + (i % 3) * 0.25));
        return (
          <span key={i} className={s.burst} data-part style={{ left: from.x, top: from.y, '--dx': `${dx}px`, '--dy': `${fall - (i % 2) * 12}px`, '--rot': `${side * 160}deg`, '--delay': `${i * 0.08}s` } as Vars}>
            <Fx name={alt && i % 2 ? alt : name} />
          </span>
        );
      })}
    </>
  );
}
