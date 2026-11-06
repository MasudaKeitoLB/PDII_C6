import { useState } from 'react';
import { isCompleteBirthday } from '../../components/BirthdayFields';
import { useAppState } from '../../flow/AppState';
import { login } from '../../lib/auth';

/** ログインの最後の画面で「アプリに入る」を押したとき */
export function useLoginSubmit() {
  const { loginDraft, useLoginLetter, navigate, resetLogin, motionAccess, allowMotion } = useAppState();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isCompleteBirthday(loginDraft.birthday)) return;
    setBusy(true);
    const user = login({
      name: loginDraft.name,
      birthday: loginDraft.birthday,
      letter: useLoginLetter ? loginDraft.letter : null,
    });
    setBusy(false);
    if (!user) {
      setFailed(true);
      return;
    }
    // iPhone で まだ許可していなければ、「アプリに入る」を押した この操作の中で 許可を求める（M-03）。
    // 開いた直後で まだ調べている間（checking）に押されたときも 求める（許可のいらない端末では すぐ granted になる）
    if (motionAccess !== 'granted' && motionAccess !== 'unsupported') void allowMotion();
    resetLogin();
    navigate('home');
  };

  return { submit, failed, busy, clearFailed: () => setFailed(false) };
}
