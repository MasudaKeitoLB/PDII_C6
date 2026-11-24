import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { stageBgArt } from '../data/stageArt';
import {
  GIMMICKS,
  LANDMARK_HEIGHT,
  activeGimmicks,
  drawCount,
  fallbackTintOf,
  timeOfDay,
  timeTint,
  weatherFor,
  weatherTint,
  type EndPhase,
  type GimmickId,
  type StageDef,
  type StageLayout,
  type Tint,
} from '../data/stages';
import { useSceneClock } from '../flow/useSceneClock';
import { useReducedMotion } from '../flow/usePreferences';
import { dayKey } from '../lib/dates';
import { playSound } from '../lib/sound';
import { Gimmick, LandmarkArt } from './StageGimmicks';
import s from './StageScene.module.css';

/** さわった あと 反応を 見せる 長さ（ミリ秒） */
const REACT_MS = 1800;
/** 出さなくなった ギミックを ふわっと 消す 長さ（ミリ秒）。CSS の stage-out と そろえる */
const FADE_MS = 2500;

/**
 * 出さなくなった ギミック（時間帯や 天気が かわった）を FADE_MS の あいだ のこして、ふわっと 消す。
 * もどって きたら 消すのを やめる。動きを へらす ときは すぐ 外す
 */
function useLeaving(ids: readonly GimmickId[], still: boolean): { id: GimmickId; leaving: boolean }[] {
  const [leaving, setLeaving] = useState<readonly GimmickId[]>([]);
  const prev = useRef<readonly GimmickId[]>(ids);
  const timers = useRef(new Map<GimmickId, number>());
  const key = ids.join(' ');
  useEffect(() => {
    const before = prev.current;
    prev.current = ids;
    const stop = (id: GimmickId) => {
      const t = timers.current.get(id);
      if (t !== undefined) window.clearTimeout(t);
      timers.current.delete(id);
    };
    if (still) {
      for (const id of [...timers.current.keys()]) stop(id);
      setLeaving((list) => (list.length === 0 ? list : []));
      return;
    }
    for (const id of ids) stop(id);
    const gone = before.filter((id) => !ids.includes(id));
    setLeaving((list) => {
      const next = [...list.filter((id) => !ids.includes(id) && !gone.includes(id)), ...gone];
      // かわらない ときは 作りなおさない
      return next.length === list.length && next.every((id, i) => id === list[i]) ? list : next;
    });
    for (const id of gone) {
      stop(id);
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id);
          setLeaving((list) => list.filter((x) => x !== id));
        }, FADE_MS),
      );
    }
    // ids は key（中身）で 見る
  }, [key, still]);
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) window.clearTimeout(t);
    };
  }, []);
  return [...ids.map((id) => ({ id, leaving: false })), ...leaving.filter((id) => !ids.includes(id)).map((id) => ({ id, leaving: true }))];
}

export interface StageBackground {
  src: string;
  /** 絵の 上はしの 位置（px） */
  y: number;
  /** デザイン担当の エリアの 背景（false：今の home-bg・result-bg を 代わりに 使っている） */
  art: boolean;
}

/**
 * その ステージの 背景。エリアの 絵が あれば それを offsetY だけ ずらして 置き（地面の 高さを そろえる）、
 * 無ければ 今の 絵（fallback）を そのまま 置く
 */
export function stageBackground(stage: StageDef, fallback: string, offsetY: number): StageBackground {
  const art = stageBgArt(stage.id);
  return art ? { src: art, y: offsetY, art: true } : { src: fallback, y: 0, art: false };
}

interface StageSceneProps {
  layout: StageLayout;
  stage: StageDef;
  /** 年こしの峠の ようす（7つの道では null） */
  phase: EndPhase | null;
  /** 利用者の 種（天気を 決める） */
  seed: number;
  width: number | string;
  height: number;
  /** 地面（主人公の 足もと）の 高さ（px） */
  groundY: number;
  /** 空の 上（粒は ここから 出る。ホームは エリア名・ポイントの枠の 高さ） */
  skyY?: number;
  /** 地面の 上の あいた 帯（水の輪・波を 出す 高さ） */
  floorY?: number;
  /** 背景の 絵（歩行中は 空と 遠景を WalkScene が 描くので 無し） */
  bg?: StageBackground | null;
  /** 目じるしを さわれる（ホームで 止まっている ときだけ） */
  interactive?: boolean;
  /** 止める（ホームが 歩きスマホ防止の 下に ある とき） */
  paused?: boolean;
}

const tintStyle = (t: Tint): CSSProperties => ({ background: t.color, opacity: t.alpha });

/**
 * ステージの 場面：エリアの 背景＋時間帯と 天気の 色＋季節の ギミック（＋ホームでは さわれる 目じるし）。
 * ホーム・歩行中・戦闘で 共通に 使う。主人公や 敵・文字の まどより 下に 置く（この 部品の あとに 置く）。
 * 動きを へらす ときは 動きを すべて 止め、落ちる 粒は 出さない。画面が 隠れている 間は 止める。
 * かざりなので 読み上げない（さわれる 目じるしだけ 名前の ある ボタン）
 */
export function StageScene({ layout, stage, phase, seed, width, height, groundY, skyY = 0, floorY, bg = null, interactive = false, paused = false }: StageSceneProps) {
  const reduced = useReducedMotion();
  const { date, hidden } = useSceneClock(paused);
  const time = timeOfDay(date);
  const weather = weatherFor(stage, seed, dayKey(date));
  const active = activeGimmicks(stage, { layout, time, weather, phase });
  const tint = timeTint(stage, date);
  const wTint = weatherTint(weather);
  const fbTint = bg && !bg.art ? fallbackTintOf(stage, phase) : null;
  const decor = useLeaving(
    active.filter((id) => !GIMMICKS[id].landmark && (!reduced || GIMMICKS[id].still)),
    reduced,
  );
  const landmarkOn = new Set(active.filter((id) => GIMMICKS[id].landmark));

  const vars = {
    width,
    height,
    '--sky': `${skyY}px`,
    '--ground': `${groundY}px`,
    '--floor': `${floorY ?? groundY + 10}px`,
  } as CSSProperties;

  return (
    <div
      className={s.stage}
      style={vars}
      data-stage={stage.id}
      data-layout={layout}
      data-time={time}
      data-weather={weather}
      data-phase={phase ?? undefined}
      data-motion={reduced ? 'still' : 'moving'}
      data-paused={paused || hidden || undefined}
    >
      <div className={s.decor} aria-hidden="true">
        {bg && <img className={s.bg} src={bg.src} alt="" style={{ top: bg.y }} data-stage-bg={bg.art ? 'art' : 'fallback'} />}
        {fbTint && <span className={s.tint} style={tintStyle(fbTint)} data-tint="season" />}
        <span className={s.tint} style={tintStyle(tint)} data-tint="time" />
        {wTint && <span className={s.tint} style={tintStyle(wTint)} data-tint="weather" />}
        {decor.map(({ id, leaving }) => (
          <Gimmick key={id} id={id} layout={layout} count={drawCount(id, layout)} leaving={leaving} />
        ))}
      </div>
      {/* ステージが かわったら 作りなおす（さわった 回数も 0 から） */}
      {layout === 'home' && <StageLandmark key={stage.id} stage={stage} art={Boolean(bg?.art)} interactive={interactive} still={reduced} on={landmarkOn} />}
    </div>
  );
}

/**
 * ホームの 目じるし（背景の まん中の 物）。さわると 小さく 反応する（音は 音の 設定を 守る）。歩いている 間は 押せない。
 * 押せる 箱は 主人公と 敵の あいだ（柿の木は 主人公の 左）で、地面から LANDMARK_HEIGHT（60px）の 高さまで
 */
function StageLandmark({ stage, art, interactive, still, on }: { stage: StageDef; art: boolean; interactive: boolean; still: boolean; on: ReadonlySet<GimmickId> }) {
  const { landmark } = stage;
  const [taps, setTaps] = useState(0);
  const [reacting, setReacting] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  const tap = () => {
    if (!interactive) return;
    playSound(landmark.sound);
    setTaps((t) => t + 1);
    setReacting(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setReacting(false);
    }, REACT_MS);
  };

  return (
    <button
      type="button"
      className={s.landmark}
      style={{ left: landmark.x, top: `calc(var(--ground) - ${LANDMARK_HEIGHT}px)`, width: landmark.width, height: LANDMARK_HEIGHT + 2 }}
      aria-label={landmark.name}
      disabled={!interactive}
      onClick={tap}
      data-stage-tap={landmark.id}
      data-tapped={taps}
      data-reacting={reacting}
    >
      <span className={s.landmarkArt} aria-hidden="true">
        <LandmarkArt landmark={landmark} art={art} taps={taps} reacting={reacting} still={still} on={on} />
      </span>
    </button>
  );
}
