import { useState, type ReactNode } from 'react';
import { BirthdayFields, isCompleteBirthday } from '../../components/BirthdayFields';
import { Button } from '../../components/Button';
import { FieldMessage } from '../../components/FieldMessage';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import { useAppState, useStep } from '../../flow/AppState';
import s from '../screens.module.css';

/** U-02 登録② 誕生日 */
export function BirthdayScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-birthday', registerOrder, 'start', 'register-nickname');
  const [overlay, setOverlay] = useState<ReactNode>(null);
  const [showError, setShowError] = useState(false);
  const incomplete = !isCompleteBirthday(registration.birthday);

  const next = () => {
    if (incomplete) {
      setShowError(true);
      return;
    }
    navigate(step.next);
  };

  return (
    <Screen
      title="登録② 誕生日"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      overlay={overlay}
      footer={
        <Button withArrow onClick={next}>
          つぎへ
        </Button>
      }
    >
      <Heading>
        誕生日を
        <br />
        教えてください
      </Heading>
      <Lead>
        お名前と いっしょに、
        <br />
        アプリに入るときに 使います
      </Lead>
      <div className={s.birthdayFields}>
        <BirthdayFields
          idPrefix="register-birthday"
          value={registration.birthday}
          invalid={showError}
          onChange={(birthday) => updateRegistration({ birthday })}
          renderOverlay={setOverlay}
        />
      </div>
      {showError && incomplete ? (
        <FieldMessage>年・月・日を すべて 選んでください</FieldMessage>
      ) : (
        <Note className={s.birthdayNote}>押すと、大きな一覧から 選べます</Note>
      )}
    </Screen>
  );
}
