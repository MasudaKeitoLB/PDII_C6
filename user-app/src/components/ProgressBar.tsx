import type { CSSProperties } from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** 0〜1。1をこえたら いっぱいにする */
  value: number;
  /** home：ホーム（高さ32・光の線つき）／ card：測定結果（高さ14）／ mini：一覧（高さ10〜12） */
  variant?: 'home' | 'card' | 'mini';
  label?: string;
  className?: string;
}

/** 進みぐあいのバー。数字も必ずそえる（Figma 部品：ゲーム「進みぐあいのバー」） */
export function ProgressBar({ value, variant = 'home', label, className }: ProgressBarProps) {
  const ratio = Math.max(0, Math.min(1, value));
  return (
    <div
      className={[styles.bar, styles[variant], className].filter(Boolean).join(' ')}
      style={{ '--ratio': ratio } as CSSProperties}
      role="img"
      aria-label={label}
    >
      <span className={styles.fill} />
    </div>
  );
}
