import type { ReactNode } from 'react';
import arrowDown from '../assets/ui/arrow-down.svg';
import pressable from './pressable.module.css';
import styles from './SelectField.module.css';

interface SelectFieldProps {
  id: string;
  label: string;
  /** 選んだ値。まだ選んでいないときは null */
  value: ReactNode | null;
  placeholder?: string;
  onOpen: () => void;
  invalid?: boolean;
}

/** 選ぶ欄：押すと 大きな一覧が開く（小さな回転式は使わない・U-02 注記） */
export function SelectField({ id, label, value, placeholder = '選ぶ', onOpen, invalid }: SelectFieldProps) {
  return (
    <div className={styles.field}>
      <p className={styles.label} id={`${id}-label`}>
        {label}
      </p>
      <button
        id={id}
        type="button"
        className={`${pressable.pressable} ${styles.select}`}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}`}
        aria-invalid={invalid || undefined}
        onClick={onOpen}
      >
        <span className={value === null ? styles.placeholder : styles.value}>{value ?? placeholder}</span>
        <img className={styles.arrow} src={arrowDown} alt="" />
      </button>
    </div>
  );
}
