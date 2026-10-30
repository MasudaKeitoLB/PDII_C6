import { useState } from 'react';
import { Button } from '../../components/Button';
import { FieldMessage } from '../../components/FieldMessage';
import { LetterGrid } from '../../components/LetterGrid';
import { Heading, Lead, Screen } from '../../components/Screen';
import { useAppState, useStep } from '../../flow/AppState';
import s from '../screens.module.css';

/**
 * U-02b 登録 合言葉の文字（案）
 * L-03 の注記「採用するなら、登録にも『文字を決める』画面を1つ足す」に合わせて、L-03 と同じ部品で作った。
 * 「合言葉の文字」を使わない設定のときは 出さない。
 */
export function LetterScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-letter', registerOrder, 'register-birthday', 'register-nickname');
  const [showError, setShowError] = useState(false);

  const next = () => {
    if (!registration.letter) {
      setShowError(true);
      return;
    }
    navigate(step.next);
  };

  return (
    <Screen
      title="登録 合言葉の文字"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footer={
        <>
          {showError && !registration.letter && <FieldMessage>文字を 1つ 選んでください</FieldMessage>}
          <Button withArrow onClick={next}>
            つぎへ
          </Button>
        </>
      }
    >
      <Heading>
        好きな文字を
        <br />
        1つ 決めてください
      </Heading>
      <Lead small>
        次から アプリに入るときに 選びます。
        <br />
        ほかの人が入れないように するためです
      </Lead>
      <div className={s.letterGrid}>
        <LetterGrid label="合言葉の文字" value={registration.letter} onChange={(letter) => updateRegistration({ letter })} />
      </div>
    </Screen>
  );
}
