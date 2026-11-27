import { useEffect, useMemo, useRef, useState } from 'react';
import resultBg from '../../assets/scene/result-bg.svg';
import pointIcon from '../../assets/icon/point-small.svg';
import stepsIcon from '../../assets/icon/steps-28.svg';
import swordIcon from '../../assets/icon/sword.svg';
import heroStand from '../../assets/sprite/hero.svg';
import { Button } from '../../components/Button';
import { EnemySprite } from '../../components/EnemySprite';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { Screen } from '../../components/Screen';
import { StageScene, stageBackground } from '../../components/StageScene';
import { stagePlaceAt } from '../../data/stages';
import { useAppState, useUser } from '../../flow/AppState';
import { useBattleClock } from '../../flow/useBattleClock';
import { useReducedMotion, useSkipOnTouch } from '../../flow/usePreferences';
import { battlePlan, listDelay, pointsAt } from '../../lib/battle';
import { ENEMY_NAMES, resultNotes } from '../../lib/game';
import { formatSteps } from '../../lib/health';
import { playSound, playSounds } from '../../lib/sound';
import { finishAdventure } from '../../lib/store';
import { BattleOverlay, BattleScene } from './BattleScene';
import s from './result.module.css';

/** 絵で出すのは 6体まで（それより多いときは 数で伝える） */
const MAX_SPRITES = 6;
/** できごとの行が 1行ずつ 出る 間（秒） */
const NOTE_GAP_SEC = 0.35;
/** 戦闘の 場面（393×235）と 地面の 高さ。エリアの 背景（395×420）は 26px 上に ずらして 地面を そろえる */
const SCENE_W = 393;
const SCENE_H = 235;
const GROUND_Y = 224;
const BG_OFFSET_Y = -26;
/** 水の輪・波を 出す 高さ（足もとの すぐ下） */
const FLOOR_Y = 227;

const delay = (sec: number) => ({ animationDelay: `${sec.toFixed(2)}s` });

/**
 * H-03 冒険の成果（M-07・M-08）
 * 歩いた分の冒険を、立ち止まって開いたときに 成果だけまとめて見せる（16章で決定）。
 * 歩数→経験値、敵→ポイントの関係が分かる並び。戦い方が決まっていなくても使える形。
 */
export function AdventureResultScreen() {
  const { navigate, walk } = useAppState();
  const user = useUser();
  const pending = user.game.pending;
  // ボス・レア・こえたエリアが あるときだけ 足す行（ないときは 何も出さない）
  const notes = pending ? resultNotes(pending) : [];

  // 演出：開いたら 自動で 戦闘を 見せる（1体ずつ 出て、てまりで HPが へり、光の粒で 消えて ポイントが 飛ぶ）。
  // たおした敵の 絵は たおした時に 列に 出て、ポイントは 1体ごとに ふえる。できごとの行は 戦闘の あと。
  // 文字と絵は はじめから 置いておき、見た目だけを 動かす。画面を さわれば すぐ おわる。
  // 動きを へらす ときは 結果（たおした・ポイント）を すぐ出す
  const reduced = useReducedMotion();
  const skip = useSkipOnTouch();
  // この画面を 開いたまま 歩きはじめると、ロックの下でも 画面が のこり、歩数の 記録の たびに 成果が かわる。
  // 一度 歩いたら、この画面では 演出も 音も やめて おわりの 形にする（歩いている間に 音を 鳴らさない）
  const walking = walk !== 'idle';
  const [interrupted, setInterrupted] = useState(walking);
  if (walking && !interrupted) setInterrupted(true);
  const quiet = walking || interrupted;
  const instant = reduced || skip || quiet;
  const soundKey = pending ? `${pending.steps}|${pending.enemies.length}` : '';
  const plan = useMemo(() => (pending ? battlePlan(pending) : null), [soundKey]);
  const t = useBattleClock(plan?.total ?? 0, instant);
  const points = plan ? pointsAt(plan, t) : 0;
  const notesDelay = plan ? plan.total : 0;
  // 場面は 歩きはじめた 所の エリア（エリアを こえたときは、こえる 前の 道で 戦って、次の 道の 色が 広がる）。
  // 次の巡りを はじめても 位置が 0 に もどるだけなので、成果を 作りはじめた 位置（fromPos）を 使う
  const { stage, phase } = stagePlaceAt(pending?.fromPos ?? Math.max(0, user.game.pos - (pending?.steps ?? 0)));

  // 音：戦闘に 合わせて 鳴らす（レア → 鈴、ボス → 太鼓、エリアを こえる → 笛）。音が 切なら 鳴らさない。
  // 動きを へらす ときは 開いたときに 順に 鳴らす。画面を さわって とばしたら のこりの 音は 鳴らさない。
  // 歩いている間・歩いた あとは 予約しない
  const stopSounds = useRef<() => void>(() => {});
  useEffect(() => {
    if (!plan || plan.sounds.length === 0 || quiet) return;
    let stop: () => void;
    if (reduced) {
      stop = playSounds(plan.sounds.map((c) => c.name));
    } else {
      const mine = plan.sounds.map((c) => window.setTimeout(() => playSound(c.name), c.at * 1000));
      stop = () => mine.forEach((id) => window.clearTimeout(id));
    }
    stopSounds.current = stop;
    return stop;
    // 同じ 成果では 1回だけ 鳴らす（中身が かわったときだけ 鳴らしなおす）
  }, [soundKey, quiet]);
  useEffect(() => {
    if (skip) stopSounds.current();
  }, [skip]);

  const next = () => {
    if (pending && pending.toLevel > pending.fromLevel) {
      // レベルが上がったときは 先にレベルアップを見せる（成果は そこで しまう）
      navigate('level-up');
      return;
    }
    finishAdventure(user.id);
    navigate('home');
  };

  return (
    <Screen
      title="冒険の成果"
      scene={
        <FitScene width={SCENE_W} height={SCENE_H}>
          <StageScene
            layout="battle"
            stage={stage}
            phase={phase}
            seed={user.game.seed}
            width={SCENE_W}
            height={SCENE_H}
            groundY={GROUND_Y}
            floorY={FLOOR_Y}
            bg={stageBackground(stage, resultBg, BG_OFFSET_Y)}
            paused={walking}
          />
          {plan && <BattleScene plan={plan} t={t} instant={instant} />}
          {!plan && (
            <Place x={156.5} y={120}>
              <img src={heroStand} alt="" />
            </Place>
          )}
        </FitScene>
      }
      overlay={plan && <BattleOverlay plan={plan} t={t} instant={instant} />}
      footer={
        <Button withArrow onClick={next}>
          つづける
        </Button>
      }
    >
      <GameWindow className={[s.window, skip && s.skip].filter(Boolean).join(' ')}>
        <h1 className={s.title}>おかえりなさい！</h1>
        {pending ? (
          <>
            <p className={s.subtitle}>歩いた分の 冒険の結果です</p>
            <hr className={s.divider} />
            <div className={s.row}>
              <img className={s.rowIcon} src={stepsIcon} alt="" />
              <p className={s.rowLabel}>歩いた歩数</p>
              <p className={s.rowValue}>
                {formatSteps(pending.steps)}
                <small> 歩</small>
              </p>
            </div>
            <div className={`${s.row} ${s.rowEnemies}`}>
              <img className={s.rowIcon} src={swordIcon} alt="" />
              <p className={s.rowLabel}>たおした敵</p>
              <p className={s.rowValue}>
                {pending.enemies.length}
                <small> 体</small>
              </p>
            </div>
            {pending.enemies.length > 0 && (
              <ul className={s.enemies} aria-label={`たおした敵：${pending.enemies.map((e) => ENEMY_NAMES[e]).join('、')}`}>
                {pending.enemies.slice(0, MAX_SPRITES).map((e, i) => (
                  <li key={i} className={s.enemyIn} style={delay(plan ? listDelay(plan, i) : 0)}>
                    <EnemySprite id={e} small />
                  </li>
                ))}
                {pending.enemies.length > MAX_SPRITES && (
                  <li className={`${s.more} ${s.enemyIn}`} style={delay(plan ? listDelay(plan, MAX_SPRITES) : 0)}>
                    ほか {pending.enemies.length - MAX_SPRITES}体
                  </li>
                )}
              </ul>
            )}
            {notes.length > 0 && (
              <ul className={s.notes} aria-label="冒険の できごと">
                {notes.map((note, i) => (
                  <li key={note} className={s.noteIn} style={delay(notesDelay + i * NOTE_GAP_SEC)}>
                    {note}
                  </li>
                ))}
              </ul>
            )}
            <hr className={`${s.divider} ${s.divider2}`} />
            <p className={s.gotLabel}>手に入れたもの</p>
            <div className={s.rewards}>
              <div className={s.reward}>
                <p className={s.rewardLabel}>経験値</p>
                <p className={s.rewardValue}>+{formatSteps(pending.exp)}</p>
              </div>
              <div className={`${s.reward} ${s.rewardPoint}`}>
                <img className={s.rewardIcon} src={pointIcon} alt="" />
                <p className={s.rewardLabel}>ポイント</p>
                {/* 読み上げには はじめから おわりの 数を 伝える。目に 見える 数だけ 上げていく */}
                <p className={s.rewardValue}>
                  <span className="visually-hidden">+{formatSteps(pending.points)}</span>
                  <span aria-hidden="true">+{formatSteps(points)}</span>
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className={s.empty}>
            まだ 新しい冒険の結果は ありません。
            <br />
            スマホを持って 歩いてみましょう
          </p>
        )}
      </GameWindow>
    </Screen>
  );
}
