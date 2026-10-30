import type { ReactNode } from 'react';
import styles from './GameWindow.module.css';

/** RPGウィンドウ：紺の地に 白い二重のふち。ゲームの情報だけに使う（Figma 部品：ゲーム） */
export function GameWindow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.window, className].filter(Boolean).join(' ')}>{children}</div>;
}
