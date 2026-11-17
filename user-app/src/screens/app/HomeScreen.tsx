import { useEffect, useState } from 'react';
import homeBg from '../../assets/scene/home-bg.svg';
import homeBgXlarge from '../../assets/scene/home-bg-xlarge.svg';
import hero from '../../assets/sprite/hero.svg';
import pointIcon from '../../assets/icon/point.svg';
import starIcon from '../../assets/icon/star.svg';
import { Button } from '../../components/Button';
import { EnemySprite } from '../../components/EnemySprite';
import { ExpBar } from '../../components/ExpBar';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { useAppState, useUser } from '../../flow/AppState';
import { motionNoticeKind } from '../../lib/motionNotice';
import { detectOs } from '../../lib/platform';
import { dayKey, formatReceived, now } from '../../lib/dates';
import { enemySprite } from '../../data/enemySprites';
import { ENEMY_NAMES, bossAt, enemyDef, levelProgress, placeName, stepsToNextLevel, upcomingEnemy } from '../../lib/game';
import { formatSteps } from '../../lib/health';
import type { EnemyId } from '../../lib/types';
import s from './app.module.css';

/** 次に会う敵の 場面の中の位置（左はし）。足もとは 道の上 y=254 にそろえる */
const ENEMY_X = 258;
/** 今ある3体（Figma の絵）は 今の位置を そのまま残す */
const OLD_ENEMY_X: Partial<Record<EnemyId, number>> = { amagumo: 258, happappa: 268, ishikoron: 264 };
const ENEMY_FOOT_Y = 254;

/**
 * H-01 ホーム（冒険）／ H-01b（文字：とても大きい）
 * いちばん大きく「今日の目標まで あと何歩」（M-10）。経験値は「次のレベルまで あと○歩」と歩数で表す。
 */
export function HomeScreen() {
  const user = useUser();
  const { motionAccess, allowMotion, motionSignal, recheckMotion } = useAppState();
  // 「値が届かない」は スマホ・タブレット（iPhone・iPad・Android）で開いたときだけ出す（PC のデモには センサーが無い）。
  // 画面の広さでは 決めない（広い Android タブレットでも 出すため）
  const phoneLike = detectOs() !== 'other';
  const [rechecking, setRechecking] = useState(false);
  useEffect(() => {
    if (motionSignal !== 'unknown') setRechecking(false);
  }, [motionSignal]);
  const kind = motionNoticeKind(motionAccess, motionSignal, phoneLike);
  // たしかめている間も 案内を消さない（消えて 3秒後に また出る ちらつきを ふせぐ）
  const notice = rechecking && kind === null && motionAccess === 'granted' ? 'silent' : kind;
  const recheck = () => {
    // iPhone では ボタン操作の中で 最初に 許可を求める
    const pending = recheckMotion();
    setRechecking(true);
    // 許可されなかったときは 値を見なおさないので、ここで「たしかめています…」を もどす
    void pending.then((access) => {
      if (access !== 'granted') setRechecking(false);
    });
  };
  const xl = user.textSize === 'xlarge';
  const today = now();
  const todaySteps = user.days[dayKey(today)] ?? 0;
  const goal = user.dailyGoalSteps;
  const left = Math.max(0, goal - todaySteps);
  const reached = todaySteps >= goal;
  const lastSync = user.lastSyncAt ? new Date(user.lastSyncAt) : null;
  const enemy = upcomingEnemy(user.game);
  // ボス（160×160）は ポイントの枠に 重ならないよう 小さくして出す（とても大きいときは さらに小さく）
  const big = enemyDef(enemy).kind === 'boss' || enemyDef(enemy).kind === 'ura';
  const enemyScale = big ? (xl ? 0.6 : 0.75) : 1;
  const enemyHeight = enemySprite(enemy).height * enemyScale;
  // いまいるエリアの名前と、ボスと戦っている間の のこりの歩数
  const place = placeName(user.game.pos);
  const boss = bossAt(user.game.pos);
  const shift = xl ? -30 : 0; // とても大きいときは 絵を小さくして 数字と文字を優先する（H-01b 注記）
  const windowTop = xl ? 269 : 311;
  const sceneHeight = xl ? 404 : user.textSize === 'large' ? 441 : 436;

  return (
    <Screen
      title="ホーム（冒険）"
      tab="adventure"
      scene={
        <FitScene width={393} height={sceneHeight}>
          <Place x={0} y={0}>
            <img src={xl ? homeBgXlarge : homeBg} alt="" />
          </Place>
          <Place x={228} y={61}>
            <GameWindow className={s.pointWindow}>
              <img className={s.pointIcon} src={pointIcon} alt="" />
              <p className={s.pointLabel}>ポイント</p>
              <p className={s.pointValue}>{formatSteps(user.game.points)}</p>
            </GameWindow>
          </Place>
          <Place x={11} y={61}>
            <p className={s.placeName} aria-label={`いまいる所：${place}`}>
              {place}
            </p>
            {/* ボスと戦っている間だけ、のこりの歩数を 小さく1行（名前は 読み上げで伝える。絵は 右に出ている） */}
            {boss && (
              <p className={s.bossLeft} aria-label={`ボス ${ENEMY_NAMES[boss.id]} あと ${formatSteps(boss.left)}歩`}>
                ボス あと <strong>{formatSteps(boss.left)}歩</strong>
              </p>
            )}
          </Place>
          <Place x={67} y={170 + shift}>
            <img src={hero} alt="" />
          </Place>
          {/* 次の敵は ごく小さく 上下に ゆれる（画面は ゆらさない。動きを へらすときは 止まる） */}
          <Place x={OLD_ENEMY_X[enemy] ?? ENEMY_X} y={ENEMY_FOOT_Y + shift - enemyHeight} className={s.enemyIdle}>
            <EnemySprite id={enemy} scale={enemyScale} />
          </Place>
          <Place x={11} y={windowTop}>
            <GameWindow className={s.statusWindow}>
              <p className={s.heroName}>{user.nickname}</p>
              <p className={s.level}>
                <span className={s.levelLabel}>レベル</span>
                <span className={s.levelValue}>{user.game.level}</span>
              </p>
              <div className={s.expBar}>
                <ExpBar value={levelProgress(user.game)} label={`経験値 次のレベルまで あと${formatSteps(stepsToNextLevel(user.game))}歩`} />
              </div>
              <p className={s.expText}>
                次のレベルまで あと <strong>{formatSteps(stepsToNextLevel(user.game))}歩</strong>
              </p>
            </GameWindow>
          </Place>
        </FitScene>
      }
    >
      {/* 数えられない人にだけ、今日の歩数の上に出す（ほかの人には 何も出さない：N-06） */}
      {notice === 'needs-button' && (
        <section className={s.motionNotice} aria-label="歩数を数える準備">
          <p>
            歩数を 数えるには、下のボタンを 押してください。
            <br />
            スマホに出る画面で「許可」を 押します
          </p>
          <Button onClick={() => void allowMotion()}>歩数を 数えはじめる</Button>
        </section>
      )}
      {(notice === 'blocked' || notice === 'silent') && (
        <section className={s.motionNotice} aria-label="歩数を数える準備">
          <p>
            いまは 歩数を 数えられません。
            <br />
            スタッフに 声をかけてください
          </p>
          {notice === 'silent' && (
            <Button variant="secondary" onClick={recheck} disabled={rechecking}>
              {rechecking ? 'たしかめています…' : 'もう一度 たしかめる'}
            </Button>
          )}
        </section>
      )}
      <section className={s.todayCard} aria-label="今日の歩数">
        <div className={s.todayHead}>
          <p className={s.todayTitle}>{reached ? '今日の目標を 達成しました' : '今日の目標まで あと'}</p>
          {!xl && lastSync && <p className={s.updated}>{formatReceived(lastSync, today)} 更新</p>}
        </div>
        <p className={s.leftSteps}>
          {reached ? (
            <>
              <img className={s.reachedStar} src={starIcon} alt="" />
              {formatSteps(todaySteps)}
            </>
          ) : (
            formatSteps(left)
          )}
          <span className={s.leftUnit}> 歩</span>
        </p>
        <ProgressBar value={goal > 0 ? todaySteps / goal : 0} label={`目標 ${formatSteps(goal)}歩 のうち ${formatSteps(todaySteps)}歩`} className={s.todayBar} />
        <div className={s.todayRows}>
          <p>
            今日 <strong>{formatSteps(todaySteps)}歩</strong>
          </p>
          <p>
            目標 <strong>{formatSteps(goal)}歩</strong>
            {xl && lastSync && <span className={s.updatedInline}> {formatReceived(lastSync, today)} 更新</span>}
          </p>
        </div>
      </section>
    </Screen>
  );
}
