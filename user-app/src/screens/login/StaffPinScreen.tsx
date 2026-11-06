import { useState } from 'react';
import { Button } from '../../components/Button';
import { FieldMessage } from '../../components/FieldMessage';
import { Heading, Lead, Screen } from '../../components/Screen';
import { useAppState } from '../../flow/AppState';
import { authenticateStaff } from '../../lib/staffAuth';
import s from '../screens.module.css';
import fieldStyles from '../../components/TextField.module.css';

export function StaffPinScreen() {
  const { loginDraft, setStaffAuthenticated, navigate } = useAppState();
  const [staffPin, updateStaffPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (staffPin.length < 4 || busy) {
      if (staffPin.length < 4) setError('暗証番号を 4桁以上 入れてください');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (await authenticateStaff(loginDraft.name, staffPin)) {
        setStaffAuthenticated(true);
        updateStaffPin('');
        navigate('staff-home');
      } else {
        setError('ログインできませんでした。お名前と暗証番号を確認してください');
      }
    } catch {
      setError('ログインを確認できません。通信設定を確認してください');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="管理者側ログイン 暗証番号" onBack={() => navigate('login-name')} footer={<Button withArrow onClick={submit} disabled={busy}>{busy ? '確認中…' : 'ログイン'}</Button>}>
      <Heading>スタッフの<br />暗証番号を 入れてください</Heading>
      <Lead>運営者から発行された 暗証番号です</Lead>
      <div className={s.loginNameField}>
        <label className={fieldStyles.label} htmlFor="staff-pin">暗証番号</label>
        <input className={fieldStyles.input} id="staff-pin" type="password" inputMode="numeric" autoComplete="current-password" value={staffPin} onChange={(e) => updateStaffPin(e.target.value.replace(/\D/g, '').slice(0, 32))} onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }} aria-invalid={Boolean(error)} />
      </div>
      {error && <FieldMessage>{error}</FieldMessage>}
    </Screen>
  );
}
