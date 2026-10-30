import { useEffect, useRef } from 'react';
import { FieldMessage } from './FieldMessage';
import styles from './TextField.module.css';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 決定（キーボードの「改行」）を押したとき */
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
  error?: string | null;
}

/** 入力欄：入力中は緑のふち（Figma 部品：入力） */
export function TextField({ id, label, value, onChange, onSubmit, placeholder, maxLength, autoComplete, error }: TextFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1画面に1項目なので 開いたらすぐ入力できるようにする
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        className={styles.input}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        enterKeyHint="next"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) onSubmit?.();
        }}
      />
      {error && <FieldMessage id={`${id}-error`}>{error}</FieldMessage>}
    </div>
  );
}
