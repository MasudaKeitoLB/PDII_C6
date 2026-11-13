import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { Heading, Lead, Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAppState, useStep } from '../../flow/AppState';
import { isStaffId } from '../../lib/staffAuth';
import { setAdminSession } from '../../lib/store';
import s from '../screens.module.css';

/**
 * L-01 ログイン① お名前（M-02, N-13）
 * 「おかえりなさい」で 前と同じ手順だと分かるように。入力の形は 登録と同じ。
 */
export function LoginNameScreen() {
  const { navigate, loginDraft, updateLogin, loginOrder } = useAppState();
  const step = useStep('login-name', loginOrder, 'start', 'login-birthday');
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const next = async () => {
    if (pending.current) return;
    if (loginDraft.name.trim() === '') {
      setError('お名前を 入れてください');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const staff = await isStaffId(loginDraft.name);
      setAdminSession(null);
      navigate(staff ? 'admin-login' : step.next);
    } catch (error) {
      setError(error instanceof Error ? error.message : '確認できませんでした');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <Screen
      title="ログイン① お名前"
      onBack={() => navigate('start')}
      progress={step.progress}
      footer={
        <Button withArrow onClick={next} disabled={busy}>
          {busy ? '確認中…' : 'つぎへ'}
        </Button>
      }
    >
      <Heading>
        おかえりなさい
        <br />
        お名前を 入れてください
      </Heading>
      <Lead>利用者の方はお名前、管理者の方は登録済みの管理者ID（名前）を入力してください</Lead>
      <div className={s.loginNameField}>
        <TextField
          id="login-name"
          label="お名前・管理者ID"
          value={loginDraft.name}
          placeholder="例：山田 花子"
          maxLength={100}
          disabled={busy}
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
