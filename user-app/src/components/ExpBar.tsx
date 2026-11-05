import type { CSSProperties } from 'react';
import styles from './ExpBar.module.css';

const SEGMENTS = 20;

/** 経験値のバー：20マス。たまった分を金色で出す（Figma 部品：RPGウィンドウ） */
export function ExpBar({ value, label }: { value: number; label: string }) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * SEGMENTS);
  return (
    <div className={styles.bar} role="img" aria-label={label} style={{ '--segments': SEGMENTS } as CSSProperties}>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span key={i} className={i < filled ? styles.on : styles.off} />
      ))}
    </div>
  );
}
