import bgReady from '../../assets/scene/adventure-bg-ready.svg';
import pauseIcon from '../../assets/icon/pause.svg';
import stepsOnDarkIcon from '../../assets/icon/steps-on-dark.svg';
import hero from '../../assets/sprite/hero.svg';
import starLarge from '../../assets/sprite/star-large.svg';
import starMedium from '../../assets/sprite/star-medium.svg';
import starSmall from '../../assets/sprite/star-small.svg';
import { Button } from '../../components/Button';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { Heading, Screen } from '../../components/Screen';
import { useAppState } from '../../flow/AppState';
import s from '../screens.module.css';

/**
 * U-10 準備ができました（M-07, M-11）
 * スタッフと一緒に確かめる2つのこと（7章-3）。くわしい使い方は サブMVPのチュートリアル（S-01）で。
 */
export function ReadyScreen() {
  const { navigate } = useAppState();

  return (
    <Screen
      title="準備ができました"
      background="kinari"
      scene={
        <FitScene width={393} height={330}>
          <Place x={0} y={0}>
            <img src={bgReady} alt="" />
          </Place>
          <Place x={92} y={140}>
            <img src={starLarge} alt="" />
          </Place>
          <Place x={280} y={120}>
            <img src={starMedium} alt="" />
          </Place>
          <Place x={300} y={196}>
            <img src={starSmall} alt="" />
          </Place>
          <Place x={70} y={214}>
            <img src={starSmall} alt="" />
          </Place>
          <Place x={156.5} y={160}>
            <img src={hero} alt="" />
          </Place>
        </FitScene>
      }
      footer={
        <Button withArrow onClick={() => navigate('home')}>
          冒険をはじめる
        </Button>
      }
    >
      <Heading className={s.readyTitle}>じゅんびが できました！</Heading>
      <div className={s.readyWindows}>
        <GameWindow className={s.readyWindow}>
          <img className={s.readyIcon} src={stepsOnDarkIcon} alt="" />
          <p className={s.readyMain}>
            スマホを持って 歩くと、
            <br />
            主人公が 進みます
          </p>
          <p className={s.readySub}>アプリを閉じていても 大丈夫</p>
        </GameWindow>
        <GameWindow className={s.readyWindow}>
          <img className={s.readyIconPause} src={pauseIcon} alt="" />
          <p className={s.readyMain}>
            歩いている間は、
            <br />
            操作できません
          </p>
          <p className={s.readySub}>止まってから 開いてください</p>
        </GameWindow>
      </div>
    </Screen>
  );
}
