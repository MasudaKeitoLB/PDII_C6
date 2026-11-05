import type { ReactNode } from 'react';
import { Chevron } from './Chevron';
import pressable from './pressable.module.css';
import styles from './RowButton.module.css';

interface RowButtonProps {
  icon: ReactNode;
  label: string;
  /** 右に出す いまの値（例：5,000歩） */
  value?: string;
  onClick: () => void;
}

/** 一覧の行：行全体が押せる。押せる行は すべて「ふちどり＋影＋＞」でそろえる（M-01 注記） */
export function RowButton({ icon, label, value, onClick }: RowButtonProps) {
  return (
    <button type="button" className={`${pressable.pressable} ${pressable.shallow} ${styles.row}`} onClick={onClick}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      {value && <span className={styles.value}>{value}</span>}
      <Chevron className={styles.chevron} />
    </button>
  );
}
