import type { CSSProperties } from 'react';
import { EnemyMotion } from '../../components/EnemyMotion';
import { EnemySprite } from '../../components/EnemySprite';
import { Place } from '../../components/FitScene';
import { Hero } from '../../components/Hero';
import { HpBar } from '../../components/HpBar';
import { AREAS } from '../../data/areas';
import { enemySprite } from '../../data/enemySprites';
import { eventAt, heroPoseAt, hpAt, roundPhase, type BattlePlan, type BattleRound } from '../../lib/battle';
import s from './battle.module.css';

/** 場面（393×235）の中の 位置。主人公は 左、敵は 右に 出る。足もとは 道の上 */
const HERO_X = 70;
const HERO_ALONE_X = 156.5;
const HERO_Y = 120;
const ENEMY_CENTER_X = 292;
const ENEMY_FOOT_Y = 228;
/** てまりが 主人公の 手から 出る 位置 */
const PON_X = 146;
const PON_Y = 176;
/** てまりは 敵の まん中の この ぶん 手前で 消える（飛ぶ きょりを 短く） */
const PON_SHORT = 60;
/** ボス（160×160）は 場面に おさまるよう 小さく */
const BOSS_SCALE = 0.7;
/** ボスの 長い HPバーは 右はしを ここに そろえる（場面から はみ出さない） */
const BAR_RIGHT = 385;
const TEMARI_SIZE = 44;

/** 光の粒（敵の まん中から 上へ ちる）：横・上へ うごく きょり と 出る おくれ */
const SPARKS: readonly { x: number; y: number; dx: number; dy: number; d: number }[] = [
  { x: -14, y: -6, dx: -10, dy: -26, d: 0 },
  { x: 10, y: -12, dx: 8, dy: -30, d: 0.05 },
  { x: -4, y: 6, dx: -4, dy: -34, d: 0.1 },
  { x: 16, y: 8, dx: 14, dy: -22, d: 0.08 },
  { x: -18, y: 12, dx: -16, dy: -18, d: 0.12 },
  { x: 2, y: -18, dx: 2, dy: -28, d: 0.03 },
];

interface BattleSceneProps {
  plan: BattlePlan;
  /** 時計（秒） */
  t: number;
  /** 動きを へらす・画面を さわった：おわりの 形を すぐ出す */
  instant: boolean;
}

/**
 * 成果の画面の 戦闘（FitScene の中に 置く）。1体ずつ「出る → 主人公が 前に出て てまりを ぽん →
 * HPバーが へる → 光の粒で おとなしく 消える → ポイントが 飛ぶ」。おわったら 主人公は 勝ちのポーズ。
 * 敵・バー・数字は はじめから 置いておき、時計の t から 決めた data-phase で 見た目だけを 動かす。
 * 文字（たおした数・ポイント）は まどの中に あるので、場面は 読み上げない
 */
export function BattleScene({ plan, t, instant }: BattleSceneProps) {
  const done = t >= plan.total;
  const pose = heroPoseAt(plan, t);
  const area = eventAt(plan, t, 'area');
  // 消えていく 間も 同じ色を 使うため、さいごに はじまった エリアの 色を 使う
  const lastArea = [...plan.events].reverse().find((e) => e.kind === 'area' && e.at <= t);
  const areaColor = lastArea?.area ? AREAS[lastArea.area - 1].color : 'transparent';
  return (
    <div className={s.battle} data-battle={done ? 'done' : 'playing'} data-skip={instant || undefined} aria-hidden="true">
      {/* ボスに 会う：背景が すこし 暗くなる */}
      <span className={s.dim} data-on={eventAt(plan, t, 'boss') !== null} />
      {/* エリアを こえる：その季節の色が 場面の まん中から うすく 広がる（文字の まどには かけない） */}
      <span className={s.spread} data-on={area !== null} style={{ '--area-color': areaColor } as CSSProperties} />
      {plan.rounds.map((round, i) => (
        <Round key={i} round={round} t={t} />
      ))}
      <Place x={plan.rounds.length > 0 ? HERO_X : HERO_ALONE_X} y={HERO_Y}>
        <Hero pose={pose} forward={pose === 'attack'} />
      </Place>
      {/* エリアを こえる：てまりに その道の 糸の色が 1つ もどる */}
      {plan.events
        .filter((e) => e.kind === 'area')
        .map((e) => (
          <Place key={e.area} x={393 / 2 - TEMARI_SIZE / 2} y={14}>
            <Temari area={e.area ?? 1} on={area === e} />
          </Place>
        ))}
    </div>
  );
}

function Round({ round, t }: { round: BattleRound; t: number }) {
  const phase = roundPhase(round, t);
  const sprite = enemySprite(round.id);
  const big = round.kind === 'boss' || round.kind === 'ura';
  const scale = big ? BOSS_SCALE : 1;
  const width = sprite.width * scale;
  const height = sprite.height * scale;
  const moving = phase === 'enter' || phase === 'attack' || phase === 'drain' || phase === 'stay';
  return (
    <>
      {/* てまり：主人公の 手から 敵へ ぽんと 飛ぶ */}
      <Place x={PON_X} y={PON_Y}>
        <span
          className={s.pon}
          data-on={phase === 'attack' || phase === 'drain' || undefined}
          style={{ '--pon-dx': `${ENEMY_CENTER_X - PON_X - PON_SHORT}px` } as CSSProperties}
        />
      </Place>
      <div
        className={s.round}
        data-phase={phase}
        data-round={round.index ?? 'boss'}
        style={{ left: ENEMY_CENTER_X - width / 2, top: ENEMY_FOOT_Y - height, width, height }}
      >
        <div className={s.body}>
          <EnemyMotion id={round.id} active={moving}>
            <EnemySprite id={round.id} scale={scale} />
          </EnemyMotion>
        </div>
        <div className={[s.bar, big && s.barRight].filter(Boolean).join(' ')} style={big ? { right: ENEMY_CENTER_X + width / 2 - BAR_RIGHT } : undefined}>
          <HpBar left={hpAt(round, t)} total={round.hpMax} tone={big ? 'boss' : round.kind === 'rare' ? 'rare' : 'normal'} />
        </div>
        {round.defeated && (
          <>
            {SPARKS.map((p, i) => (
              <span
                key={i}
                className={s.spark}
                style={{ left: width / 2 + p.x, top: height / 2 + p.y, '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--d': `${p.d}s` } as CSSProperties}
              />
            ))}
            <span className={s.gain}>+{round.points}</span>
          </>
        )}
      </div>
    </>
  );
}

/** てまり（7つの 区切り）。こえた 道の 糸の色が もどる。area の 区切りが いま もどる 色 */
function Temari({ area, on }: { area: number; on: boolean }) {
  const r = TEMARI_SIZE / 2;
  const seg = (i: number) => {
    const a0 = (i / AREAS.length) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / AREAS.length) * Math.PI * 2 - Math.PI / 2;
    const p = (a: number) => `${(r + (r - 3) * Math.cos(a)).toFixed(2)} ${(r + (r - 3) * Math.sin(a)).toFixed(2)}`;
    return `M${r} ${r}L${p(a0)}A${r - 3} ${r - 3} 0 0 1 ${p(a1)}Z`;
  };
  return (
    <svg className={s.temari} data-on={on} width={TEMARI_SIZE} height={TEMARI_SIZE} viewBox={`0 0 ${TEMARI_SIZE} ${TEMARI_SIZE}`}>
      <circle cx={r} cy={r} r={r - 1} fill="#1E1B18" />
      {AREAS.map((a, i) => (
        <path
          key={a.no}
          d={seg(i)}
          className={s.seg}
          data-new={a.no === area || undefined}
          style={{ '--c': a.color, fill: a.no < area ? a.color : undefined } as CSSProperties}
        />
      ))}
      <circle cx={r} cy={r} r={4} fill="#FBF6EA" />
    </svg>
  );
}

/**
 * 画面ぜんたいに 重ねる 演出（Screen の overlay）。押せる ものの じゃまを しない。
 * レアに 会えた：やわらかい 金の光（点滅は しない）
 */
export function BattleOverlay({ plan, t, instant }: BattleSceneProps) {
  const rare = eventAt(plan, t, 'rare');
  return (
    <div className={s.overlay} data-battle-overlay data-skip={instant || undefined} aria-hidden="true">
      <span className={s.glow} data-on={rare !== null} />
    </div>
  );
}
