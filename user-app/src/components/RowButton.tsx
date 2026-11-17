import type { ReactNode } from 'react';
import { playSound } from '../lib/sound';
import { Chevron } from './Chevron';
import pressable from './pressable.module.css';
import styles from './RowButton.module.css';

interface RowButtonProps {
  icon: ReactNode;
  label: string;
  /** 右に出す いまの値（例：5,000歩） */
  value?: string;
  onClick: () => void;
  /** 入・切の 行（押すと その場で 切りかわる）。読み上げに 入・切を 伝える */
  pressed?: boolean;
}

/** 一覧の行：行全体が押せる。押せる行は すべて「ふちどり＋影＋＞」でそろえる（M-01 注記） */
export function RowButton({ icon, label, value, onClick, pressed }: RowButtonProps) {
  return (
    <button
      type="button"
      className={`${pressable.pressable} ${pressable.shallow} ${styles.row}`}
      onClick={() => {
        onClick();
        // 小さな 手ごたえ（押したあとに 鳴らすので、音を 入に した ときは 鳴り、切に した ときは 鳴らない）
        playSound('tap');
      }}
      aria-pressed={pressed}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      {value && <span className={styles.value}>{value}</span>}
      <Chevron className={styles.chevron} />
    </button>
  );
}
