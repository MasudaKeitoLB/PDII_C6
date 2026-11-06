import resultBg from '../../assets/scene/result-bg.svg';
import pointIcon from '../../assets/icon/point-small.svg';
import stepsIcon from '../../assets/icon/steps-28.svg';
import swordIcon from '../../assets/icon/sword.svg';
import amagumo from '../../assets/sprite/enemy-amagumo-small.svg';
import happappa from '../../assets/sprite/enemy-happappa-small.svg';
import ishikoron from '../../assets/sprite/enemy-ishikoron-small.svg';
import hero from '../../assets/sprite/hero.svg';
import { Button } from '../../components/Button';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { Screen } from '../../components/Screen';
import { useAppState, useUser } from '../../flow/AppState';
import { ENEMY_NAMES } from '../../lib/game';
import { formatSteps } from '../../lib/health';
import { finishAdventure } from '../../lib/store';
import type { EnemyId } from '../../lib/types';
import s from './result.module.css';

const SPRITES: Record<EnemyId, string> = { amagumo, ishikoron, happappa };
/** 絵で出すのは 6体まで（それより多いときは 数で伝える） */
const MAX_SPRITES = 6;

/**
 * H-03 冒険の成果（M-07・M-08）
 * 歩いた分の冒険を、立ち止まって開いたときに 成果だけまとめて見せる（16章で決定）。
 * 歩数→経験値、敵→ポイントの関係が分かる並び。戦い方が決まっていなくても使える形。
 */
export function AdventureResultScreen() {
  const { navigate } = useAppState();
  const user = useUser();
  const pending = user.game.pending;

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
      <GameWindow className={s.window}>
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
                  <li key={i}>
                    <img src={SPRITES[e]} alt="" />
                  </li>
                ))}
                {pending.enemies.length > MAX_SPRITES && <li className={s.more}>ほか {pending.enemies.length - MAX_SPRITES}体</li>}
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
                <p className={s.rewardValue}>+{formatSteps(pending.points)}</p>
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
