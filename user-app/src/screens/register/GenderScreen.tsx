import { useState } from 'react';
import { Button } from '../../components/Button';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { FieldMessage } from '../../components/FieldMessage';
import { Heading, Lead, Screen } from '../../components/Screen';
import { useAppState, useStep } from '../../flow/AppState';
import type { Gender } from '../../lib/types';
import s from '../screens.module.css';

const OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: '女性' },
  { value: 'male', label: '男性' },
  // 提案：「答えない」も選べるようにする（U-04 注記）
  { value: 'unanswered', label: '答えない' },
];

/** U-04 登録④ 性別：何に使うか（カロリーの計算）を書いておく */
export function GenderScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-gender', registerOrder, 'register-nickname', 'register-height');
  const [showError, setShowError] = useState(false);

  const next = () => {
    if (!registration.gender) {
      setShowError(true);
      return;
    }
    navigate(step.next);
  };

  return (
    <Screen
      title="登録④ 性別"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footer={
        <>
          {showError && !registration.gender && <FieldMessage>どれか 1つを 選んでください</FieldMessage>}
          <Button withArrow onClick={next}>
            つぎへ
          </Button>
        </>
      }
    >
      <Heading>
        性別を
        <br />
        教えてください
      </Heading>
      <Lead>消費カロリーの計算に 使います</Lead>
      <div className={s.choices}>
        <ChoiceGroup label="性別" options={OPTIONS} value={registration.gender} onChange={(gender) => updateRegistration({ gender })} />
      </div>
    </Screen>
  );
}
