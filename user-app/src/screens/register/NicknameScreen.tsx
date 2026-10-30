import { useState } from 'react';
import bgPreview from '../../assets/scene/adventure-bg-preview.svg';
import heroSmall from '../../assets/sprite/hero-small.svg';
import { Button } from '../../components/Button';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useAppState, useStep } from '../../flow/AppState';
import s from '../screens.module.css';

/** U-03 登録③ 呼び名：呼び名を 主人公の名前にして 愛着をもってもらう（提案） */
export function NicknameScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-nickname', registerOrder, 'register-birthday', 'register-gender');
  const [error, setError] = useState<string | null>(null);
  const nickname = registration.nickname.trim();

  const next = () => {
    if (nickname === '') {
      setError('呼び名を 入れてください');
      return;
    }
    navigate(step.next);
  };

  return (
    <Screen
      title="登録③ 呼び名"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footer={
        <Button withArrow onClick={next}>
          つぎへ
        </Button>
      }
    >
      <Heading>
        アプリの中での
        <br />
        呼び名を 決めてください
      </Heading>
      <Lead>主人公の名前になります</Lead>
      <div className={s.nicknameField}>
        <TextField
          id="register-nickname"
          label="呼び名"
          value={registration.nickname}
          placeholder="例：はなこ"
          maxLength={8}
          autoComplete="nickname"
          error={error}
          onChange={(value) => {
            updateRegistration({ nickname: value });
            if (error) setError(null);
          }}
          onSubmit={next}
        />
      </div>
      {/* 見本：入力した呼び名が そのまま 主人公の上に出る */}
      <div className={s.preview} aria-hidden="true">
        <FitScene width={353} height={216} className={s.previewFrame}>
          <Place x={0} y={0}>
            <img src={bgPreview} alt="" />
          </Place>
          <Place x={176.5} y={23}>
            <GameWindow className={`${s.nameTag} ${nickname === '' ? s.nameTagEmpty : ''}`}>{nickname || 'よびな'}</GameWindow>
          </Place>
          <Place x={144.5} y={80}>
            <img src={heroSmall} alt="" />
          </Place>
        </FitScene>
      </div>
      <Note className={s.previewCaption}>こんなふうに 表示されます</Note>
    </Screen>
  );
}
