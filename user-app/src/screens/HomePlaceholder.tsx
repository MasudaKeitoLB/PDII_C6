import bgReady from '../assets/scene/adventure-bg-ready.svg';
import hero from '../assets/sprite/hero.svg';
import { Button } from '../components/Button';
import { FitScene, Place } from '../components/FitScene';
import { InfoCard } from '../components/InfoCard';
import { Heading, Lead, Screen } from '../components/Screen';
import { useAppState } from '../flow/AppState';
import { logout } from '../lib/auth';
import type { Gender, RegisteredUser } from '../lib/types';
import { eraOfDate } from '../lib/wareki';
import s from './screens.module.css';

const GENDER_LABEL: Record<Gender, string> = { female: '女性', male: '男性', unanswered: '答えない' };

function summary(user: RegisteredUser): [string, string][] {
  const { year, month, day } = user.birthday;
  return [
    ['お名前', user.name],
    ['誕生日', `${eraOfDate(year, month, day)} ${month}月${day}日`],
    ...(user.letter ? ([['合言葉の文字', user.letter]] as [string, string][]) : []),
    ['呼び名', user.nickname],
    ['性別', GENDER_LABEL[user.gender]],
    ['身長・体重', `${user.heightCm}cm・${user.weightKg}kg`],
    ['1日の目標', `${user.dailyGoalSteps.toLocaleString('ja-JP')}歩`],
    ['記録を見せる', user.shareConsent.agreed ? '見せる' : '今は見せない'],
  ];
}

/**
 * ホーム（H-01）は 次の段階で作る。いまは 登録・ログインの結果を確かめるための 仮の画面。
 */
export function HomePlaceholder({ user }: { user: RegisteredUser }) {
  const { navigate, setUser } = useAppState();

  return (
    <Screen
      title="ホーム（仮）"
      background="kinari"
      scene={
        <FitScene width={393} height={330}>
          <Place x={0} y={0}>
            <img src={bgReady} alt="" />
          </Place>
          <Place x={156.5} y={160}>
            <img src={hero} alt="" />
          </Place>
        </FitScene>
      }
      footer={
        <Button
          variant="secondary"
          onClick={() => {
            logout();
            setUser(null);
            navigate('start');
          }}
        >
          最初の画面にもどる
        </Button>
      }
    >
      <Heading className={s.homeTitle}>
        {user.nickname}さんの
        <br />
        冒険が はじまります
      </Heading>
      <Lead className={s.homeLead}>
        ホームの画面は 次の段階で 作ります。
        <br />
        いまは 登録した内容を 表示しています
      </Lead>
      <InfoCard className={s.homeSummary}>
        <dl>
          {summary(user).map(([label, value]) => (
            <div key={label} className={s.homeRow}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </InfoCard>
    </Screen>
  );
}
