import { useState } from 'react';
import { Button } from '../../components/Button';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAppState, useStep } from '../../flow/AppState';
import s from '../screens.module.css';

/** U-01 登録① お名前 */
export function NameScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-name', registerOrder, 'start', 'register-birthday');
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    if (registration.name.trim() === '') {
      setError('お名前を 入れてください');
      return;
    }
    navigate(step.next);
  };

  return (
    <Screen
      title="登録① お名前"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footer={
        <Button withArrow onClick={next}>
          つぎへ
        </Button>
      }
    >
      <Heading>
        お名前を
        <br />
        入れてください
      </Heading>
      {/* 名前は 次からのログインに使うことを 先に伝える（U-01 注記） */}
      <Lead>
        次から、お名前と誕生日で
        <br />
        アプリに入れます
      </Lead>
      <div className={s.nameField}>
        <TextField
          id="register-name"
          label="お名前"
          value={registration.name}
          placeholder="例：山田 花子"
          maxLength={20}
          autoComplete="name"
          error={error}
          onChange={(name) => {
            updateRegistration({ name });
            if (error) setError(null);
          }}
          onSubmit={next}
        />
      </div>
      {/* 迷いやすい点（姓と名のあいだ）を 先回りして説明 */}
      <Note className={s.nameNote}>
        姓と名のあいだは、
        <br />
        あけても あけなくても 大丈夫です
      </Note>
    </Screen>
  );
}
