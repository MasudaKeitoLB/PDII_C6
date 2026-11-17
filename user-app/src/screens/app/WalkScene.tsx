import { useEffect, useRef, useState, type CSSProperties } from 'react';
import homeBg from '../../assets/scene/home-bg.svg';
import hero from '../../assets/sprite/hero.svg';
import { HERO_WALK } from '../../data/heroSprites';
import { STRIP_HEIGHT, STRIP_WIDTH, walkSceneLook } from '../../data/walkStrips';
import { useAppState } from '../../flow/AppState';
import { useReducedMotion } from '../../flow/usePreferences';
import { segmentAt } from '../../lib/game';
import s from './walkScene.module.css';

/** 止まりはじめてから 流れが 止まるまで（ミリ秒）。ロックが 外れる（2.5秒）より 早く 止める */
const SLOW_DOWN_MS = 1000;
/** 歩く 1コマの 長さ（秒）。4コマで 0.8秒（1秒に 約2.5歩）。CSS の walk-frame と そろえる */
const FRAME_SEC = 0.2;

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
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<Exclude<SceneState, 'still'>>(walk === 'walking' ? 'moving' : 'stopped');

  useEffect(() => {
    if (reduced) return;
    const animations = () => ref.current?.getAnimations?.({ subtree: true }) ?? [];
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
      style={{ background: `linear-gradient(${look.skyTop}, ${look.skyBottom})` }}
    >
      {/* 遠くの景色：home-bg を 左右反転で つないで、ゆっくり 流す */}
      <div className={s.far} style={{ filter: look.farBrightness < 1 ? `brightness(${look.farBrightness})` : undefined }}>
        <div className={s.farTrack} data-walk-anim="far">
          {[0, 1, 2, 3].map((i) => (
            <img key={i} className={i % 2 ? s.flip : undefined} src={homeBg} alt="" />
          ))}
        </div>
      </div>
      {/* 近くの 道の帯：160px ごとに くり返して 少し速く 流す（帯が 無ければ CSS の 道） */}
      <div className={[s.road, look.strip ? s.strip : s.cssRoad].join(' ')} style={road} data-walk-anim="road" data-strip={look.strip ? 'art' : 'css'} />
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
