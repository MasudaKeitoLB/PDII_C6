import { useState } from 'react';
import { isCompleteBirthday } from '../../components/BirthdayFields';
import { useAppState } from '../../flow/AppState';
import { login } from '../../lib/auth';

/** ログインの最後の画面で「アプリに入る」を押したとき */
export function useLoginSubmit() {
  const { loginDraft, useLoginLetter, setUser, navigate, resetLogin } = useAppState();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isCompleteBirthday(loginDraft.birthday)) return;
    setBusy(true);
    const user = await login({
      name: loginDraft.name,
      birthday: loginDraft.birthday,
      letter: useLoginLetter ? loginDraft.letter : null,
    });
    setBusy(false);
    if (!user) {
      setFailed(true);
      return;
    }
    setUser(user);
    resetLogin();
    navigate('home');
  };

  return { submit, failed, busy, clearFailed: () => setFailed(false) };
}
