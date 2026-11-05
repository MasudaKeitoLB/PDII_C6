import sparkles from '../../assets/scene/levelup-sparkles.svg';
import heroLarge from '../../assets/sprite/hero-large.svg';
import { Button } from '../../components/Button';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { Screen } from '../../components/Screen';
import { useAppState, useUser } from '../../flow/AppState';
import { finishAdventure } from '../../lib/store';
import s from './levelup.module.css';

/**
 * H-04 レベルアップ（M-09）：レベルが上がったことが分かる演出。
 * メッセージは ふだんの散歩を ほめる言葉にする。
 */
export function LevelUpScreen() {
  const { navigate } = useAppState();
  const user = useUser();
  const pending = user.game.pending;
  const from = pending?.fromLevel ?? Math.max(1, user.game.level - 1);
  const to = pending?.toLevel ?? user.game.level;

  const next = () => {
    finishAdventure(user.id);
    navigate('home');
  };

  return (
    <Screen
      title="レベルアップ"
      background="navy"
      scene={
        <FitScene width={393} height={518}>
          <Place x={30} y={92}>
            <img src={sparkles} alt="" />
          </Place>
          <Place x={0} y={130} className={s.titleWrap}>
            <h1 className={s.title}>レベルアップ！</h1>
          </Place>
          <Place x={92.5} y={214}>
            <span className={s.glow} />
          </Place>
          <Place x={112.5} y={234}>
            <span className={s.glowInner} />
          </Place>
          <Place x={140.5} y={241}>
            <img src={heroLarge} alt="" />
          </Place>
          <Place x={0} y={442} className={s.changeWrap}>
            <p className={s.change} aria-label={`レベル${from}から${to}に上がりました`}>
              <span className={s.changeLabel}>レベル</span>
              <span className={s.changeFrom}>{from}</span>
              <span className={s.changeArrow}>→</span>
              <span className={s.changeTo}>{to}</span>
            </p>
          </Place>
        </FitScene>
      }
      footer={
        <Button withArrow onClick={next}>
          つづける
        </Button>
      }
    >
      <GameWindow className={s.message}>
        <p className={s.messageMain}>
          {user.nickname}は レベル{to}に なった！
        </p>
        <p className={s.messageSub}>
          ふだんの散歩が、
          <br />
          冒険の力に なっています
        </p>
      </GameWindow>
    </Screen>
  );
}
