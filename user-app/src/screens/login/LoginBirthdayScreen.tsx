import { useState, type ReactNode } from 'react';
import { BirthdayFields, isCompleteBirthday } from '../../components/BirthdayFields';
import { Button } from '../../components/Button';
import { FieldMessage } from '../../components/FieldMessage';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import { useAppState, useStep } from '../../flow/AppState';
import s from '../screens.module.css';
import { LoginFailedMessage } from './LoginFailedMessage';
import { useLoginSubmit } from './useLoginSubmit';

/** L-02 ログイン② 誕生日：登録（U-02）と同じ部品を使う */
export function LoginBirthdayScreen() {
  const { navigate, loginDraft, updateLogin, loginOrder } = useAppState();
  const step = useStep('login-birthday', loginOrder, 'login-name', 'home');
  const [overlay, setOverlay] = useState<ReactNode>(null);
  const [showError, setShowError] = useState(false);
  const { submit, failed, busy, clearFailed } = useLoginSubmit();
  const incomplete = !isCompleteBirthday(loginDraft.birthday);

  const next = () => {
    if (incomplete) {
      setShowError(true);
      return;
    }
    // 「合言葉の文字」を使わない設定では ここが最後の画面
    if (step.isLast) submit();
    else navigate(step.next);
  };

  return (
    <Screen
      title="ログイン② 誕生日"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      overlay={overlay}
      footer={
        <>
          {failed && <LoginFailedMessage withLetter={false} />}
          <Button withArrow onClick={next} disabled={busy}>
            {step.isLast ? 'アプリに入る' : 'つぎへ'}
          </Button>
        </>
      }
    >
      <Heading>
        誕生日を
        <br />
        選んでください
      </Heading>
      <Lead>登録したときの 誕生日です</Lead>
      <div className={s.loginBirthdayFields}>
        <BirthdayFields
          idPrefix="login-birthday"
          value={loginDraft.birthday}
          invalid={showError}
          onChange={(birthday) => {
            updateLogin({ birthday });
            clearFailed();
          }}
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
