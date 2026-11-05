import type { CSSProperties } from 'react';
import homeBg from '../../assets/scene/home-bg.svg';
import homeBgXlarge from '../../assets/scene/home-bg-xlarge.svg';
import enemyAmagumo from '../../assets/sprite/enemy-amagumo.svg';
import enemyHappappa from '../../assets/sprite/enemy-happappa.svg';
import enemyIshikoron from '../../assets/sprite/enemy-ishikoron-small.svg';
import hero from '../../assets/sprite/hero.svg';
import pointIcon from '../../assets/icon/point.svg';
import starIcon from '../../assets/icon/star.svg';
import { ExpBar } from '../../components/ExpBar';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { useUser } from '../../flow/AppState';
import { dayKey, formatReceived, now } from '../../lib/dates';
import { levelProgress, stepsToNextLevel, upcomingEnemy } from '../../lib/game';
import { formatSteps } from '../../lib/health';
import type { EnemyId } from '../../lib/types';
import s from './app.module.css';

/** 次に会う敵の絵と、場面の中の位置（足もとを 道の上 y=254 にそろえる） */
const ENEMY_SPRITES: Record<EnemyId, { src: string; x: number; width: number; height: number; scale: number }> = {
  amagumo: { src: enemyAmagumo, x: 258, width: 80, height: 70, scale: 1 },
  happappa: { src: enemyHappappa, x: 268, width: 60, height: 70, scale: 1 },
  // いしころんは 小さい絵しかないので、同じ割合で大きくして出す
  ishikoron: { src: enemyIshikoron, x: 264, width: 42, height: 36, scale: 1.6 },
};

/**
 * H-01 ホーム（冒険）／ H-01b（文字：とても大きい）
 * いちばん大きく「今日の目標まで あと何歩」（M-10）。経験値は「次のレベルまで あと○歩」と歩数で表す。
 */
export function HomeScreen() {
  const user = useUser();
  const xl = user.textSize === 'xlarge';
  const today = now();
  const todaySteps = user.days[dayKey(today)] ?? 0;
  const goal = user.dailyGoalSteps;
  const left = Math.max(0, goal - todaySteps);
  const reached = todaySteps >= goal;
  const lastSync = user.lastSyncAt ? new Date(user.lastSyncAt) : null;
  const enemy = upcomingEnemy(user.game);
  const sprite = ENEMY_SPRITES[enemy];
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
          <Place x={67} y={170 + shift}>
            <img src={hero} alt="" />
          </Place>
          <Place x={sprite.x} y={254 + shift - sprite.height * sprite.scale}>
            <img
              src={sprite.src}
              alt=""
              style={{ transform: `scale(${sprite.scale})`, transformOrigin: '0 0' } as CSSProperties}
            />
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
