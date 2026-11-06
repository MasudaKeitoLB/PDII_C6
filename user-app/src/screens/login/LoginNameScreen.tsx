import { useState } from 'react';
import { Button } from '../../components/Button';
import { Heading, Lead, Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAppState, useStep } from '../../flow/AppState';
import { isStaffName } from '../../lib/staffAuth';
import s from '../screens.module.css';

/**
 * L-01 ログイン① お名前（M-02, N-13）
 * 「おかえりなさい」で 前と同じ手順だと分かるように。入力の形は 登録と同じ。
 */
export function LoginNameScreen() {
  const { navigate, loginDraft, updateLogin, loginOrder, updateStaffPin } = useAppState();
  const step = useStep('login-name', loginOrder, 'start', 'login-birthday');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = async () => {
    if (busy) return;
    if (loginDraft.name.trim() === '') {
      setError('お名前を 入れてください');
      return;
    }
    setBusy(true);
    try {
      if (await isStaffName(loginDraft.name)) {
        updateStaffPin('');
        navigate('staff-pin');
      } else {
        navigate(step.next);
      }
    } catch {
      // Supabase が未設定・一時的に停止中なら、既存の利用者ログインを継続する。
      navigate(step.next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="ログイン① お名前"
      onBack={() => navigate('start')}
      progress={step.progress}
      footer={
          <Button withArrow onClick={() => void next()} disabled={busy}>
          {busy ? '確認中…' : 'つぎへ'}
        </Button>
      }
    >
      <Heading>
        おかえりなさい
        <br />
        お名前を 入れてください
      </Heading>
      <Lead>登録したときの お名前です</Lead>
      <div className={s.loginNameField}>
        <TextField
          id="login-name"
          label="お名前"
          value={loginDraft.name}
          placeholder="例：山田 花子"
          maxLength={20}
          autoComplete="name"
          error={error}
          onChange={(name) => {
            updateLogin({ name });
            if (error) setError(null);
          }}
          onSubmit={next}
        />
      </div>
    </Screen>
  );
}
