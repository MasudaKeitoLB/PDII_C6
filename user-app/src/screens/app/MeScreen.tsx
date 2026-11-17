import { useState } from 'react';
import facilityIcon from '../../assets/icon/facility.svg';
import flagIcon from '../../assets/icon/tab-adventure.svg';
import meIcon from '../../assets/icon/tab-me.svg';
import heroSmall from '../../assets/sprite/hero-small.svg';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { RowButton } from '../../components/RowButton';
import { Heading, Screen } from '../../components/Screen';
import { useAppState, useUser } from '../../flow/AppState';
import { usePreferences } from '../../flow/usePreferences';
import { canStartLap, lapLabel } from '../../lib/game';
import { formatSteps } from '../../lib/health';
import { onOffLabel, togglePreference } from '../../lib/preferences';
import { startNextLap } from '../../lib/store';
import type { TextSize } from '../../lib/types';
import s from './me.module.css';

export const TEXT_SIZE_LABEL: Record<TextSize, string> = { normal: 'ふつう', large: '大きい', xlarge: 'とても大きい' };

/**
 * M-01 わたし（マイページ・M-13）：プロフィール・目標歩数・文字の大きさ・音と動き・記録を見せる相手を確認・変更する。
 * はつひのでを こえた人には「次の巡りを はじめる」を出す（はじめるか どうかは 自由。押す前に 確かめる）
 */
export function MeScreen() {
  const { navigate } = useAppState();
  const user = useUser();
  const sharedCount = (['facility', 'careManager'] as const).filter((t) => user.shares[t].agreed).length;
  const [confirmLap, setConfirmLap] = useState(false);
  const lapReady = canStartLap(user.game);
  const prefs = usePreferences();

  return (
    <Screen
      title="わたし"
      onBack={() => navigate('home')}
      tab="me"
      overlay={
        confirmLap && (
          <Dialog label="次の巡りの確認" onClose={() => setConfirmLap(false)}>
            <div className={s.confirm}>
              <p className={s.confirmTitle}>
                つぎの巡りを
                <br />
                はじめますか？
              </p>
              <p className={s.confirmText}>
                図鑑と ポイントは
                <br />
                そのまま のこります
              </p>
              <div className={s.confirmButtons}>
                <Button
                  onClick={() => {
                    startNextLap(user.id);
                    setConfirmLap(false);
                  }}
                >
                  はじめる
                </Button>
                <Button variant="secondary" className={s.confirmBack} onClick={() => setConfirmLap(false)}>
                  やめずに もどる
                </Button>
              </div>
            </div>
          </Dialog>
        )
      }
    >
      <Heading className={s.heading}>わたし</Heading>
      <section className={s.profile} aria-label="プロフィール">
        <span className={s.avatar} aria-hidden="true">
          <img src={heroSmall} alt="" />
        </span>
        <div className={s.profileText}>
          <p className={s.nickname}>{user.nickname}</p>
          <p className={s.fullName}>{user.name} さん</p>
          <div className={s.badges}>
            <p className={s.levelBadge}>レベル {user.game.level}</p>
            {/* 巡りの数は 2巡り目から出す */}
            {user.game.lap > 1 && <p className={s.lapBadge}>{lapLabel(user.game.lap)}</p>}
          </div>
        </div>
      </section>
      {lapReady && (
        <section className={s.lapCard} aria-label="次の巡り">
          <p>
            年こしの峠を こえました。
            <br />
            七つの道を もう一度 歩けます
          </p>
          <Button onClick={() => setConfirmLap(true)}>次の巡りを はじめる</Button>
        </section>
      )}
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
        {/* 音と 動きの 設定（この端末だけに 保存）。押すと その場で 入・切が かわる */}
        <RowButton
          icon={
            <span className={s.textSizeIcon} aria-hidden="true">
              音
            </span>
          }
          label="音"
          value={onOffLabel(prefs.sound)}
          pressed={prefs.sound}
          onClick={() => togglePreference('sound')}
        />
        <RowButton
          icon={
            <span className={s.textSizeIcon} aria-hidden="true">
              鈴
            </span>
          }
          label="歩いている間の音"
          value={onOffLabel(prefs.walkSound)}
          pressed={prefs.walkSound}
          onClick={() => togglePreference('walkSound')}
        />
        <RowButton
          icon={
            <span className={s.textSizeIcon} aria-hidden="true">
              動
            </span>
          }
          label="動きをへらす"
          value={onOffLabel(prefs.reduceMotion)}
          pressed={prefs.reduceMotion}
          onClick={() => togglePreference('reduceMotion')}
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
