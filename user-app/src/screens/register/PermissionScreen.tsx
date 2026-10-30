import { useState } from 'react';
import distanceIcon from '../../assets/icon/distance.svg';
import stepsIcon from '../../assets/icon/steps.svg';
import { isCompleteBirthday } from '../../components/BirthdayFields';
import { Button } from '../../components/Button';
import { FieldMessage } from '../../components/FieldMessage';
import { IconItem, InfoCard } from '../../components/InfoCard';
import { Heading, Lead, Screen } from '../../components/Screen';
import { useAppState } from '../../flow/AppState';
import { registerUser } from '../../lib/auth';
import { DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG } from '../../lib/bodyDefaults';
import { requestSensorPermissions } from '../../lib/permissions';
import type { Profile } from '../../lib/types';
import s from '../screens.module.css';

/**
 * U-09 登録⑨ スマホの許可（M-03, M-04, N-15）
 * スマホの許可画面の前に、理由を ふだんの言葉で説明する。
 */
export function PermissionScreen() {
  const { navigate, registration, resetRegistration, setUser, useLoginLetter } = useAppState();
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  const next = async () => {
    const r = registration;
    if (!r.name.trim() || !isCompleteBirthday(r.birthday) || !r.nickname.trim() || !r.gender || (useLoginLetter && !r.letter)) {
      setMissing(true);
      return;
    }
    setBusy(true);
    await requestSensorPermissions();
    const profile: Profile = {
      name: r.name,
      birthday: r.birthday,
      letter: useLoginLetter ? r.letter : null,
      nickname: r.nickname,
      gender: r.gender,
      heightCm: r.heightCm ?? DEFAULT_HEIGHT_CM[r.gender],
      weightKg: r.weightKg ?? DEFAULT_WEIGHT_KG[r.gender],
      dailyGoalSteps: r.dailyGoalSteps,
    };
    const user = await registerUser(profile, r.shareConsent ?? { agreed: false, decidedAt: new Date().toISOString() });
    setUser(user);
    resetRegistration();
    setBusy(false);
    navigate('register-ready');
  };

  return (
    <Screen
      title="登録⑨ スマホの許可"
      background="kinari"
      onBack={() => navigate('register-share')}
      footer={
        <>
          {missing && (
            <FieldMessage>
              まだ入れていない ところがあります。
              <br />
              「戻る」で 前の画面を たしかめてください
            </FieldMessage>
          )}
          <Button withArrow onClick={next} disabled={busy}>
            つぎへ
          </Button>
        </>
      }
    >
      <Heading>
        歩数を数えるための
        <br />
        準備をします
      </Heading>
      <Lead>
        このあと スマホに出る画面で、
        <br />
        「許可」を押してください
      </Lead>
      <div className={s.permissionCards}>
        <InfoCard className={s.permissionCard}>
          <IconItem icon={stepsIcon} title="歩数を数える" iconGap={20.5} iconTop={4}>
            体の動きを使って、
            <br />
            歩数を数えます
          </IconItem>
        </InfoCard>
        <InfoCard className={s.permissionCard}>
          <IconItem icon={distanceIcon} title="歩いた距離をはかる" iconGap={20.5} iconTop={4}>
            いる場所を使います。
            <br />
            いる場所は だれにも見せません
          </IconItem>
        </InfoCard>
      </div>
    </Screen>
  );
}
