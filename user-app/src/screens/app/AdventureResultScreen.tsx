import { useEffect } from 'react';
import resultBg from '../../assets/scene/result-bg.svg';
import pointIcon from '../../assets/icon/point-small.svg';
import stepsIcon from '../../assets/icon/steps-28.svg';
import swordIcon from '../../assets/icon/sword.svg';
import hero from '../../assets/sprite/hero.svg';
import { Button } from '../../components/Button';
import { EnemySprite } from '../../components/EnemySprite';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { Screen } from '../../components/Screen';
import { useAppState, useUser } from '../../flow/AppState';
import { useCountUp, useReducedMotion, useSkipOnTouch } from '../../flow/usePreferences';
import { ENEMY_NAMES, enemyDef, resultNotes } from '../../lib/game';
import { formatSteps } from '../../lib/health';
import { playSounds, resultSounds } from '../../lib/sound';
import { finishAdventure } from '../../lib/store';
import s from './result.module.css';

/** 絵で出すのは 6体まで（それより多いときは 数で伝える） */
const MAX_SPRITES = 6;
/** 敵の絵が 1体ずつ 出る 間（秒） */
const SPRITE_GAP_SEC = 0.2;
/** できごとの行が 1行ずつ 出る 間（秒） */
const NOTE_GAP_SEC = 0.35;

const delay = (sec: number) => ({ animationDelay: `${sec.toFixed(2)}s` });

/**
 * H-03 冒険の成果（M-07・M-08）
 * 歩いた分の冒険を、立ち止まって開いたときに 成果だけまとめて見せる（16章で決定）。
 * 歩数→経験値、敵→ポイントの関係が分かる並び。戦い方が決まっていなくても使える形。
 */
export function AdventureResultScreen() {
  const { navigate } = useAppState();
  const user = useUser();
  const pending = user.game.pending;
  // ボス・レア・こえたエリアが あるときだけ 足す行（ないときは 何も出さない）
  const notes = pending ? resultNotes(pending) : [];

  // 演出：敵の絵が 1体ずつ 出る → できごとの行 → ポイントが 上がっていく。
  // 文字と絵は はじめから 置いておき、見た目だけを 動かす。画面を さわれば すぐ おわる
  const reduced = useReducedMotion();
  const skip = useSkipOnTouch();
  const shownSprites = pending ? Math.min(pending.enemies.length, MAX_SPRITES + 1) : 0;
  const notesDelay = 0.25 + shownSprites * SPRITE_GAP_SEC + 0.15;
  const pointsDelay = notesDelay + notes.length * NOTE_GAP_SEC + 0.1;
  const points = useCountUp(pending?.points ?? 0, { delayMs: pointsDelay * 1000, durationMs: 900, instant: reduced || skip });

  // 開いたときに 中身に 合わせた 音を 鳴らす（音が 切なら 鳴らさない）
  const soundKey = pending ? `${pending.steps}|${pending.enemies.length}` : '';
  useEffect(() => {
    if (!pending) return;
    const kinds = pending.enemies.map((e) => enemyDef(e).kind);
    return playSounds(
      resultSounds({
        defeated: pending.enemies.length,
        bossDefeated: kinds.includes('boss') || kinds.includes('ura'),
        areaCleared: pending.clearedAreas.length > 0,
        rare: pending.rares.length > 0,
        bossAhead: pending.boss !== null,
      }),
    );
    // 同じ 成果では 1回だけ 鳴らす（中身が かわったときだけ 鳴らしなおす）
  }, [soundKey]);

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
        <FitScene width={393} height={235}>
          <Place x={0} y={0}>
            <img src={resultBg} alt="" />
          </Place>
          <Place x={156.5} y={120}>
            <img src={hero} alt="" />
          </Place>
        </FitScene>
      }
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
                  <li key={i} className={s.enemyIn} style={delay(0.25 + i * SPRITE_GAP_SEC)}>
                    <EnemySprite id={e} small />
                  </li>
                ))}
                {pending.enemies.length > MAX_SPRITES && (
                  <li className={`${s.more} ${s.enemyIn}`} style={delay(0.25 + MAX_SPRITES * SPRITE_GAP_SEC)}>
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
