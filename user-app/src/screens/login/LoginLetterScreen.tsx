import { useState } from 'react';
import { Button } from '../../components/Button';
import { FieldMessage } from '../../components/FieldMessage';
import { LetterGrid } from '../../components/LetterGrid';
import { Heading, Lead, Screen } from '../../components/Screen';
import { useAppState, useStep } from '../../flow/AppState';
import s from '../screens.module.css';
import { LoginFailedMessage } from './LoginFailedMessage';
import { useLoginSubmit } from './useLoginSubmit';

/**
 * L-03 ログイン③ 合言葉の文字（案）
 * 16章「ログインの安全性」のメモ（好きなローマ字1文字）を形にした案。キーボードを使わず 大きなボタンから1文字選ぶ。
 */
export function LoginLetterScreen() {
  const { navigate, loginDraft, updateLogin, loginOrder } = useAppState();
  const step = useStep('login-letter', loginOrder, 'login-birthday', 'home');
  const [showError, setShowError] = useState(false);
  const { submit, failed, busy, clearFailed } = useLoginSubmit();

  const enter = () => {
    if (!loginDraft.letter) {
      setShowError(true);
      return;
    }
    submit();
  };

  return (
    <Screen
      title="ログイン③ 合言葉の文字"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footer={
        <>
          {showError && !loginDraft.letter && <FieldMessage>文字を 1つ 選んでください</FieldMessage>}
          {failed && <LoginFailedMessage withLetter />}
          <Button withArrow onClick={enter} disabled={busy}>
            アプリに入る
          </Button>
        </>
      }
    >
      <Heading>
        登録のときに決めた
        <br />
        文字を 選んでください
      </Heading>
      <Lead small>
        好きなローマ字 1文字です。
        <br />
        ほかの人が入れないように するためです
      </Lead>
      <div className={s.letterGrid}>
        <LetterGrid
          label="合言葉の文字"
          value={loginDraft.letter}
          onChange={(letter) => {
            updateLogin({ letter });
            clearFailed();
          }}
        />
      </div>
    </Screen>
  );
}
