import { useState } from 'react';
import meIcon from '../../assets/icon/tab-me.svg';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { NumberStepper } from '../../components/NumberStepper';
import { RowButton } from '../../components/RowButton';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAppState, useUser } from '../../flow/AppState';
import type { RouteId } from '../../flow/routes';
import { logoutAppUser, updateProfile } from '../../lib/store';
import screens from '../screens.module.css';
import s from './me.module.css';

/** M-06 お名前・身長・体重：登録のときの内容を 確認・変更する（M-13） */
export function ProfileScreen() {
  const { navigate } = useAppState();
  const user = useUser();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const rows: { label: string; value: string; route: RouteId }[] = [
    { label: 'お名前', value: user.name, route: 'me-profile-name' },
    { label: '呼び名', value: user.nickname, route: 'me-profile-nickname' },
    { label: '身長', value: `${user.heightCm}cm`, route: 'me-profile-height' },
    { label: '体重', value: `${user.weightKg}kg`, route: 'me-profile-weight' },
  ];

  return (
    <Screen
      title="お名前・身長・体重"
      onBack={() => navigate('me')}
      overlay={
        confirmLogout && (
          <Dialog label="ログアウトの確認" onClose={() => setConfirmLogout(false)}>
            <div className={s.confirm}>
              <img className={s.confirmPerson} src={meIcon} alt="" />
              <p className={s.confirmTitle}>
                この端末から
                <br />
                ログアウトしますか？
              </p>
              <p className={s.confirmText}>
                歩いた記録は 消えません。
                <br />
                次は お名前と誕生日で 入ります
              </p>
              <div className={s.confirmButtons}>
                <Button
                  className={s.dangerButton}
                  onClick={() => {
                    logoutAppUser();
                    navigate('start');
                  }}
                >
                  ログアウトする
                </Button>
                <Button variant="secondary" className={s.confirmBack} onClick={() => setConfirmLogout(false)}>
                  やめずに もどる
                </Button>
              </div>
            </div>
          </Dialog>
        )
      }
    >
      <Heading className={s.heading}>お名前・身長・体重</Heading>
      <div className={`${s.rows} ${s.profileRows}`}>
        {rows.map((r) => (
          <RowButton key={r.route} icon={<img src={meIcon} alt="" />} label={r.label} value={r.value} onClick={() => navigate(r.route)} />
        ))}
      </div>
      <p className={s.logoutLead}>この端末を ほかの人が使うときは</p>
      <Button variant="secondary" className={s.logoutButton} onClick={() => setConfirmLogout(true)}>
        この端末から ログアウトする
      </Button>
    </Screen>
  );
}

/** お名前・呼び名を変える（登録の U-01・U-03 と同じ入力欄） */
export function ProfileTextEditScreen({ field }: { field: 'name' | 'nickname' }) {
  const { navigate } = useAppState();
  const user = useUser();
  const [value, setValue] = useState(field === 'name' ? user.name : user.nickname);
  const [error, setError] = useState<string | null>(null);
  const label = field === 'name' ? 'お名前' : '呼び名';

  const save = () => {
    if (value.trim() === '') {
      setError(`${label}を 入れてください`);
      return;
    }
    updateProfile(user.id, { [field]: value.trim() });
    navigate('me-profile');
  };

  return (
    <Screen
      title={`${label}を変える`}
      onBack={() => navigate('me-profile')}
      footer={<Button onClick={save}>この{label}にする</Button>}
    >
      <Heading>
        {label}を
        <br />
        変えます
      </Heading>
      <Lead>{field === 'name' ? '次から、このお名前で アプリに入ります' : '主人公の名前も かわります'}</Lead>
      <div className={screens.nameField}>
        <TextField
          id={`me-${field}`}
          label={label}
          value={value}
          maxLength={field === 'name' ? 20 : 8}
          autoComplete={field === 'name' ? 'name' : 'nickname'}
          error={error}
          onChange={(v) => {
            setValue(v);
            if (error) setError(null);
          }}
          onSubmit={save}
        />
      </div>
      {field === 'name' && (
        <Note className={screens.nameNote}>
          姓と名のあいだは、
          <br />
          あけても あけなくても 大丈夫です
        </Note>
      )}
    </Screen>
  );
}

/** 身長・体重を変える（登録の U-05・U-06 と同じ部品） */
export function ProfileNumberEditScreen({ field }: { field: 'heightCm' | 'weightKg' }) {
  const { navigate } = useAppState();
  const user = useUser();
  const [value, setValue] = useState(user[field]);
  const height = field === 'heightCm';
  const label = height ? '身長' : '体重';
  const unit = height ? 'cm' : 'kg';

  return (
    <Screen
      title={`${label}を変える`}
      onBack={() => navigate('me-profile')}
      footer={
        <Button
          onClick={() => {
            updateProfile(user.id, { [field]: value });
            navigate('me-profile');
          }}
        >
          この{label}にする
        </Button>
      }
    >
      <Heading>
        {label}を
        <br />
        変えます
      </Heading>
      <Lead>
        {height ? '歩いた距離の計算に 使います。' : '消費カロリーの計算に 使います。'}
        <br />
        だいたいで 大丈夫です
      </Lead>
      <div className={screens.stepper}>
        <NumberStepper id={`me-${field}`} label={label} value={value} unit={unit} min={height ? 100 : 25} max={height ? 220 : 150} onChange={setValue} />
      </div>
      <Note className={screens.stepperNote}>
        ＋や－を押すと 1{unit}ずつ変わります。
        <br />
        数字を押すと、入力もできます
      </Note>
    </Screen>
  );
}
