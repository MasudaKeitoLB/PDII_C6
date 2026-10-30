import checkIcon from '../../assets/icon/check.svg';
import crossIcon from '../../assets/icon/cross.svg';
import facilityIcon from '../../assets/icon/facility.svg';
import personIcon from '../../assets/icon/person.svg';
import { Button } from '../../components/Button';
import { IconItem, InfoCard } from '../../components/InfoCard';
import { Heading, Note, Screen } from '../../components/Screen';
import { useAppState, useStep } from '../../flow/AppState';
import { SHARE_TARGETS } from '../../lib/shareTargets';
import s from '../screens.module.css';

/**
 * U-08 登録⑧ 記録を見せる（M-14, N-14, N-15）
 * だれに・何を見せるか／見せないかを はっきり書き、「今は見せない」も同じ大きさのボタンで選べる。
 */
export function ShareScreen() {
  const { navigate, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-share', registerOrder, 'register-goal', 'register-permission');

  const decide = (agreed: boolean) => {
    updateRegistration({ shareConsent: { agreed, decidedAt: new Date().toISOString() } });
    navigate('register-permission');
  };

  return (
    <Screen
      title="登録⑧ 記録を見せる"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footerBottom={6}
      footer={
        <>
          <Button onClick={() => decide(true)}>見せてよい</Button>
          <Button variant="secondary" onClick={() => decide(false)}>
            今は見せない
          </Button>
        </>
      }
    >
      <Heading>
        歩いた記録を
        <br />
        見せてもよいですか？
      </Heading>
      <h2 className={s.shareLabel}>見せる相手</h2>
      <InfoCard className={s.shareTargets}>
        <IconItem icon={facilityIcon} title={SHARE_TARGETS.facility.name} iconGap={16.3} iconTop={8} textGap={1}>
          {SHARE_TARGETS.facility.role}
        </IconItem>
        <div className={s.shareDivider} />
        <IconItem icon={personIcon} title={SHARE_TARGETS.careManager.role} iconGap={16.3} iconTop={10} textGap={1}>
          {SHARE_TARGETS.careManager.name} さん
        </IconItem>
      </InfoCard>
      <InfoCard tone="sand" className={s.shareWhat}>
        <IconItem icon={checkIcon} title="見せるもの" iconColumn={24.5} iconGap={9.7} iconTop={3.5} titleSize="small" textGap={0}>
          歩数・歩いた距離・消費カロリー
        </IconItem>
        <IconItem icon={crossIcon} title="見せないもの" iconColumn={24.5} iconGap={9.7} iconTop={8.25} titleSize="small" textGap={0}>
          いる場所・ゲームの記録
        </IconItem>
      </InfoCard>
      {/* いつでも やめられることを 最初に伝える */}
      <Note className={s.shareNote}>「わたし」の画面で いつでも やめられます</Note>
    </Screen>
  );
}
