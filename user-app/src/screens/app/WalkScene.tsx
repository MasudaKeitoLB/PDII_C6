import { useEffect, useRef, useState, type CSSProperties } from 'react';
import homeBg from '../../assets/scene/home-bg.svg';
import hero from '../../assets/sprite/hero.svg';
import { StageScene } from '../../components/StageScene';
import { HERO_WALK } from '../../data/heroSprites';
import { FAR_HEIGHT, FAR_WIDTH, stageFarArt } from '../../data/stageArt';
import { stagePlaceAt, stageSky } from '../../data/stages';
import { STRIP_HEIGHT, STRIP_WIDTH, walkSceneLook } from '../../data/walkStrips';
import { useAppState } from '../../flow/AppState';
import { useReducedMotion } from '../../flow/usePreferences';
import { segmentAt } from '../../lib/game';
import s from './walkScene.module.css';

/** 止まりはじめてから 流れが 止まるまで（ミリ秒）。ロックが 外れる（2.5秒）より 早く 止める */
const SLOW_DOWN_MS = 1000;
/** 歩く 1コマの 長さ（秒）。4コマで 0.8秒（1秒に 約2.5歩）。CSS の walk-frame と そろえる */
const FRAME_SEC = 0.2;
/** 場面の 高さと、道の帯の 土の 上はし（主人公の 足もと） */
const SCENE_HEIGHT = 190;
const GROUND_Y = 165;
/** 水の輪を 出す 高さ（道の 上） */
const FLOOR_Y = 177;
/** 遠景の 絵が 無い 年こしの峠は、今の 遠景を 夜らしく 暗くする */
const END_FAR_BRIGHTNESS = 0.6;

/**
 * moving：流れている／stopping：ゆっくり 止まっている／stopped：止まった／still：動きを へらす（はじめから 止まった 絵）
 */
type SceneState = 'moving' | 'stopping' | 'stopped' | 'still';

/**
 * H-02 歩行中の 道の場面（段階B）。いまいる エリアの 空の色の 上を、遠くの景色は ゆっくり、近くの 道の帯は 少し速く 流れ、
 * まん中で 主人公が 歩く。歩いている（walking）間だけ 流れ、止まる（stopping）と ゆっくり 止まる。
 * 道の帯が まだ無い エリアは エリアの色で CSS の 道を描き、歩く コマが 無ければ hero.svg を 小さく 上下させる。
 * かざりなので 読み上げない（文は まわりに ある）
 */
export function WalkScene() {
  const { walk, user } = useAppState();
  const reduced = useReducedMotion();
  const area = user ? segmentAt(user.game.pos).area : 1;
  const look = walkSceneLook(area);
  // いまいる エリアの 空の色と 遠景（絵が 無ければ 今の home-bg を つないで 流す）
  const { stage, phase } = stagePlaceAt(user?.game.pos ?? 0);
  const sky = stageSky(stage, phase);
  const farArt = stageFarArt(stage.id);
  const farBrightness = stage.id === 'end' ? END_FAR_BRIGHTNESS : look.farBrightness;
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<Exclude<SceneState, 'still'>>(walk === 'walking' ? 'moving' : 'stopped');

  useEffect(() => {
    if (reduced) return;
    // くり返す 流れだけを あつかう。一回きりの 動き（ギミックが ふわっと 出る・初日の出が のぼる）は さわらない
    // （止めて また 流すと、おわった 一回きりの 動きが はじめから やりなおしに なり、一度 消えて 出なおす）
    const animations = () => (ref.current?.getAnimations?.({ subtree: true }) ?? []).filter((a) => a.effect?.getTiming().iterations === Infinity);
    if (walk === 'walking') {
      for (const a of animations()) {
        a.playbackRate = 1;
        a.play();
      }
      setState('moving');
      return;
    }
    // 止まった：流れる 速さを 1秒かけて 下げてから 止める（急に 止めない）。
    // 速さ 0 の まま 止めると 位置が はじめに もどって 見える ブラウザが あるので、止めてから 速さを もどす
    setState('stopping');
    const list = animations();
    const begin = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - begin) / SLOW_DOWN_MS);
      if (p < 1) {
        const rate = Math.max(0.02, (1 - p) * (1 - p));
        for (const a of list) a.playbackRate = rate;
        frame = requestAnimationFrame(tick);
        return;
      }
      for (const a of list) {
        a.pause();
        a.playbackRate = 1;
      }
      setState('stopped');
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [walk, reduced]);

  const scene: SceneState = reduced ? 'still' : state;
  const road: CSSProperties = look.strip
    ? { backgroundImage: `url("${look.strip}")`, backgroundSize: `${STRIP_WIDTH}px ${STRIP_HEIGHT}px` }
    : ({ '--grass': look.grass } as CSSProperties);

  return (
    <div
      ref={ref}
      className={s.scene}
      data-walk-scene={scene}
      data-area={area}
      aria-hidden="true"
      style={{ background: `linear-gradient(${sky.top}, ${sky.bottom})` }}
    >
      {farArt ? (
        // 遠くの景色：エリアの 遠景（400×140、横に くり返せる）を 30秒で 400px 流す。下はしを 道の 上はしに そろえる
        <div
          className={s.farTile}
          style={{ backgroundImage: `url("${farArt}")`, backgroundSize: `${FAR_WIDTH}px ${FAR_HEIGHT}px`, top: GROUND_Y - FAR_HEIGHT, height: FAR_HEIGHT }}
          data-walk-anim="far"
          data-far="art"
        />
      ) : (
        // 遠くの景色：home-bg を 左右反転で つないで、ゆっくり 流す
        <div className={s.far} style={{ filter: farBrightness < 1 ? `brightness(${farBrightness})` : undefined }}>
          <div className={s.farTrack} data-walk-anim="far" data-far="css">
            {[0, 1, 2, 3].map((i) => (
              <img key={i} className={i % 2 ? s.flip : undefined} src={homeBg} alt="" />
            ))}
          </div>
        </div>
      )}
      {/* 近くの 道の帯：160px ごとに くり返して 少し速く 流す（帯が 無ければ CSS の 道） */}
      <div className={[s.road, look.strip ? s.strip : s.cssRoad].join(' ')} style={road} data-walk-anim="road" data-strip={look.strip ? 'art' : 'css'} />
      {/* 時間帯・天気の 色と、空の 季節の ギミック（花びら・雨・雪 など）。歩いている 間は 押せる 物は 置かない。
          流れと いっしょに ゆっくり 止まる（上の getAnimations が まとめて あつかう） */}
      {user && (
        <StageScene layout="walk" stage={stage} phase={phase} seed={user.game.seed} width="100%" height={SCENE_HEIGHT} groundY={GROUND_Y} floorY={FLOOR_Y} />
      )}
      {/* 主人公：歩く 4コマ（無ければ hero.svg を 小さく 上下）。止まったら 立った 絵 */}
      <div className={s.hero}>
        {HERO_WALK ? (
          HERO_WALK.map((src, i) => (
            // i 番目の コマが 0.2×i 秒から 見えるよう、はじめを ずらす
            <img key={i} className={s.frame} src={src} alt="" data-walk-anim="hero" style={{ animationDelay: `${(-((4 - i) % 4) * FRAME_SEC).toFixed(2)}s` }} />
          ))
        ) : (
          <img className={s.bob} src={hero} alt="" data-walk-anim="hero" />
        )}
        <img className={s.stand} src={hero} alt="" />
      </div>
    </div>
  );
}
