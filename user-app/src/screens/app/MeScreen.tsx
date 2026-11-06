import facilityIcon from '../../assets/icon/facility.svg';
import flagIcon from '../../assets/icon/tab-adventure.svg';
import meIcon from '../../assets/icon/tab-me.svg';
import heroSmall from '../../assets/sprite/hero-small.svg';
import { RowButton } from '../../components/RowButton';
import { Heading, Screen } from '../../components/Screen';
import { useAppState, useUser } from '../../flow/AppState';
import { formatSteps } from '../../lib/health';
import type { TextSize } from '../../lib/types';
import s from './me.module.css';

export const TEXT_SIZE_LABEL: Record<TextSize, string> = { normal: 'ふつう', large: '大きい', xlarge: 'とても大きい' };

/** M-01 わたし（マイページ・M-13）：プロフィール・目標歩数・文字の大きさ・記録を見せる相手を確認・変更する */
export function MeScreen() {
  const { navigate } = useAppState();
  const user = useUser();
  const sharedCount = (['facility', 'careManager'] as const).filter((t) => user.shares[t].agreed).length;

  return (
    <Screen title="わたし" onBack={() => navigate('home')} tab="me">
      <Heading className={s.heading}>わたし</Heading>
      <section className={s.profile} aria-label="プロフィール">
        <span className={s.avatar} aria-hidden="true">
          <img src={heroSmall} alt="" />
        </span>
        <div className={s.profileText}>
          <p className={s.nickname}>{user.nickname}</p>
          <p className={s.fullName}>{user.name} さん</p>
          <p className={s.levelBadge}>レベル {user.game.level}</p>
        </div>
      </section>
      <div className={s.rows}>
        <RowButton icon={<img src={flagIcon} alt="" />} label="1日の目標歩数" value={`${formatSteps(user.dailyGoalSteps)}歩`} onClick={() => navigate('me-goal')} />
        <RowButton
          icon={
            <span className={s.textSizeIcon} aria-hidden="true">
              あ
            </span>
          }
          label="文字の大きさ"
          value={TEXT_SIZE_LABEL[user.textSize]}
          onClick={() => navigate('me-text-size')}
        />
        <RowButton
          icon={<img className={s.facilityIcon} src={facilityIcon} alt="" />}
          label="記録を見せる相手"
          value={sharedCount > 0 ? `${sharedCount}か所` : '見せていない'}
          onClick={() => navigate('me-share')}
        />
        <RowButton icon={<img src={meIcon} alt="" />} label="お名前・身長・体重" onClick={() => navigate('me-profile')} />
      </div>
    </Screen>
  );
}
