import { useEffect, useRef, useState } from 'react';
import pressable from './pressable.module.css';
import styles from './NumberStepper.module.css';

interface NumberStepperProps {
  id: string;
  /** 読み上げ用。例：「身長」 */
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** 数を選ぶ：＋－は76pxの大きなボタン。数字を押すと 入力もできる（U-05 注記） */
export function NumberStepper({ id, label, value, unit, min, max, step = 1, onChange }: NumberStepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const n = Number(draft.normalize('NFKC'));
    if (draft.trim() !== '' && Number.isFinite(n)) onChange(clamp(Math.round(n), min, max));
    setEditing(false);
  };

  return (
    <div className={styles.box} role="group" aria-label={label}>
      <button
        type="button"
        className={`${pressable.pressable} ${styles.change}`}
        aria-label={`${step}${unit} へらす`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step, min, max))}
      >
        －
      </button>

      {editing ? (
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          type="text"
          inputMode="numeric"
          enterKeyHint="done"
          aria-label={`${label}（${unit}）`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <button
          id={id}
          type="button"
          className={styles.value}
          aria-label={`${label} ${value}${unit}。押すと 数字を入力できます`}
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
        >
          <span className={styles.number}>{value}</span>
          <span className={styles.unit}> {unit}</span>
        </button>
      )}

      <button
        type="button"
        className={`${pressable.pressable} ${styles.change}`}
        aria-label={`${step}${unit} ふやす`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step, min, max))}
      >
        ＋
      </button>
      <p className="visually-hidden" aria-live="polite">
        {value}
        {unit}
      </p>
    </div>
  );
}
