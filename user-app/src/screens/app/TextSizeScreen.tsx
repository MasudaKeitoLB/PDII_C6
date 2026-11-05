import { useState } from 'react';
import { Button } from '../../components/Button';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import pressable from '../../components/pressable.module.css';
import { useAppState, useUser } from '../../flow/AppState';
import { dayKey, now } from '../../lib/dates';
import { formatSteps } from '../../lib/health';
import { setTextSize } from '../../lib/store';
import type { TextSize } from '../../lib/types';
import { TEXT_SIZE_LABEL } from './MeScreen';
import s from './me.module.css';

const SIZES: TextSize[] = ['normal', 'large', 'xlarge'];

/**
 * M-02 文字の大きさ（N-01・N-04）
 * 見本を見ながら 3段階から選ぶ。選ぶと すぐ見本が変わり、「この大きさにする」で決める。
 */
export function TextSizeScreen() {
  const { navigate } = useAppState();
  const user = useUser();
  const [selected, setSelected] = useState<TextSize>(user.textSize);
  const today = user.days[dayKey(now())] ?? 0;

  return (
    <Screen
      title="文字の大きさ"
      onBack={() => navigate('me')}
      footer={
        <Button
          onClick={() => {
            setTextSize(user.id, selected);
            navigate('me');
          }}
        >
          この大きさにする
        </Button>
      }
    >
      <Heading className={s.heading}>文字の大きさ</Heading>
      <Lead className={s.lead}>読みやすい大きさを 選んでください</Lead>
      <div className={s.sizeCards} role="radiogroup" aria-label="文字の大きさ">
        {SIZES.map((size) => {
          const isSelected = size === selected;
          return (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`${pressable.pressable} ${pressable.shallow} ${s.sizeCard} ${isSelected ? s.sizeCardSelected : ''}`}
              onClick={() => setSelected(size)}
            >
              <span className={s.sizeHead}>
                <span className={s.radio} aria-hidden="true">
                  {isSelected && <span className={s.dot} />}
                </span>
                <span className={s.sizeLabel}>{TEXT_SIZE_LABEL[size]}</span>
              </span>
              <span className={`${s.sample} ${s[`sample_${size}`]}`}>
                今日の歩数 <strong>{formatSteps(today)}歩</strong>
              </span>
            </button>
          );
        })}
      </div>
      <Note className={s.sizeNote}>あとから いつでも変えられます</Note>
    </Screen>
  );
}
