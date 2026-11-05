import { useState } from 'react';
import checkIcon from '../../assets/icon/check.svg';
import crossIcon from '../../assets/icon/cross.svg';
import facilityIcon from '../../assets/icon/facility.svg';
import personIcon from '../../assets/icon/person.svg';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { Heading, Note, Screen } from '../../components/Screen';
import pressable from '../../components/pressable.module.css';
import { useAppState, useUser } from '../../flow/AppState';
import { SHARE_TARGETS } from '../../lib/shareTargets';
import { setShare } from '../../lib/store';
import type { ShareTarget } from '../../lib/types';
import s from './me.module.css';

const TARGETS: { id: ShareTarget; icon: string; name: string; sub: string; dialogName: string; who: string }[] = [
  {
    id: 'facility',
    icon: facilityIcon,
    name: SHARE_TARGETS.facility.name,
    sub: SHARE_TARGETS.facility.role,
    dialogName: SHARE_TARGETS.facility.name,
    who: '施設のスタッフ',
  },
  {
    id: 'careManager',
    icon: personIcon,
    name: SHARE_TARGETS.careManager.role,
    sub: `${SHARE_TARGETS.careManager.name} さん`,
    dialogName: `${SHARE_TARGETS.careManager.name}さん`,
    who: `${SHARE_TARGETS.careManager.name.split(' ')[0]}さん`,
  },
];

/**
 * M-03 記録を見せる相手（M-14・N-14・N-15）：相手ごとに 見せるのを やめられる。見せているもの・見せていないものを いつも表示。
 * M-04 見せるのをやめる確認（N-07）：大事な操作の前に確認する。やめても あとで また見せられる。
 */
export function ShareTargetsScreen({ confirm }: { confirm?: ShareTarget }) {
  const { navigate } = useAppState();
  const user = useUser();
  const [stopping, setStopping] = useState<ShareTarget | null>(confirm && user.shares[confirm].agreed ? confirm : null);
  const anyShared = TARGETS.some((t) => user.shares[t.id].agreed);
  const target = TARGETS.find((t) => t.id === stopping);

  const closeDialog = () => {
    setStopping(null);
    if (confirm) navigate('me-share');
  };

  return (
    <Screen
      title="記録を見せる相手"
      onBack={() => navigate('me')}
      overlay={
        target && (
          <Dialog label="見せるのをやめる確認" onClose={closeDialog}>
            <div className={s.confirm}>
              <img className={target.id === 'facility' ? s.confirmFacility : s.confirmPerson} src={target.icon} alt="" />
              <p className={s.confirmTitle}>
                {target.dialogName}に
                <br />
                記録を見せるのを
                <br />
                やめますか？
              </p>
              <p className={s.confirmText}>
                やめると、{target.who}は
                <br />
                あなたの歩数を 見られなくなります
              </p>
              <div className={s.confirmButtons}>
                <Button
                  className={s.dangerButton}
                  onClick={() => {
                    setShare(user.id, target.id, false);
                    closeDialog();
                  }}
                >
                  見せるのを やめる
                </Button>
                <Button variant="secondary" className={s.confirmBack} onClick={closeDialog}>
                  やめずに もどる
                </Button>
              </div>
            </div>
          </Dialog>
        )
      }
    >
      <Heading className={s.heading}>記録を見せる相手</Heading>
      <section className={s.sharedInfo} aria-label="見せているもの">
        {anyShared ? (
          <p className={s.sharedWhat}>見せているもの：歩数・歩いた距離・消費カロリー</p>
        ) : (
          <p className={s.sharedWhat}>いまは だれにも 見せていません</p>
        )}
        <p className={s.sharedNot}>いる場所は 見せていません</p>
      </section>
      {TARGETS.map((t) => {
        const agreed = user.shares[t.id].agreed;
        return (
          <section key={t.id} className={s.targetCard} aria-label={t.name}>
            <img className={s.targetIcon} src={t.icon} alt="" />
            <p className={s.targetName}>{t.name}</p>
            <p className={s.targetSub}>{t.sub}</p>
            <p className={`${s.statusPill} ${agreed ? s.statusOn : s.statusOff}`}>
              <img className={agreed ? s.statusCheck : s.statusCross} src={agreed ? checkIcon : crossIcon} alt="" />
              {agreed ? '見せています' : '見せていません'}
            </p>
            <button
              type="button"
              className={`${pressable.pressable} ${pressable.shallow} ${s.targetButton}`}
              onClick={() => (agreed ? setStopping(t.id) : setShare(user.id, t.id, true))}
            >
              {agreed ? '見せるのを やめる' : 'また 見せる'}
            </button>
          </section>
        );
      })}
      <Note className={s.shareNote}>やめても、あとで また見せることが できます</Note>
    </Screen>
  );
}
