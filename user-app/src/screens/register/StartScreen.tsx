import bgStart from '../../assets/scene/adventure-bg-start.svg';
import enemyHappappa from '../../assets/sprite/enemy-happappa.svg';
import hero from '../../assets/sprite/hero.svg';
import { Button } from '../../components/Button';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { Heading, Lead, Screen } from '../../components/Screen';
import { useAppState } from '../../flow/AppState';
import s from '../screens.module.css';

/** U-00 はじめの画面：入口は「はじめて使う」「前に使ったことがある」の2つだけ（N-06） */
export function StartScreen() {
  const { navigate, resetLogin } = useAppState();

  return (
    <Screen
      title="はじめの画面"
      background="paper"
      scene={
        <FitScene width={393} height={470}>
          <Place x={0} y={0}>
            <img src={bgStart} alt="" />
          </Place>
          <Place x={55} y={111}>
            <GameWindow className={s.logoWindow}>
              <p className={s.logoMain}>歩歩</p>
              <p className={s.logoSub}>〜 HoHo 〜</p>
            </GameWindow>
          </Place>
          <Place x={83} y={300}>
            <img src={hero} alt="" />
          </Place>
          <Place x={267} y={330}>
            <img src={enemyHappappa} alt="" />
          </Place>
        </FitScene>
      }
      footer={
        <>
          <Button withArrow onClick={() => navigate('register-name')}>
            はじめて使う
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              resetLogin();
              navigate('login-name');
            }}
          >
            前に使ったことがある
          </Button>
        </>
      }
      footerGap={24}
      footerBottom={10}
    >
      <Heading className={`${s.center} ${s.startCatch}`}>歩くほど、冒険がすすむ。</Heading>
      <Lead className={`${s.center} ${s.startLead}`}>
        歩いた歩数が 経験値になり、
        <br />
        主人公が 育っていきます
      </Lead>
    </Screen>
  );
}
