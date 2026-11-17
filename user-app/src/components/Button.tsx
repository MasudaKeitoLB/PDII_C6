import type { ButtonHTMLAttributes } from 'react';
import arrowRight from '../assets/ui/arrow-right-white.svg';
import { playSound } from '../lib/sound';
import pressable from './pressable.module.css';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 主ボタン（緑）か 副ボタン（白・主ボタンと同じ大きさ） */
  variant?: 'primary' | 'secondary';
  /** 次の画面へ進むボタンには 右に「＞」をつける */
  withArrow?: boolean;
}

export function Button({ variant = 'primary', withArrow = false, className, children, type = 'button', onClick, ...rest }: ButtonProps) {
  const classes = [pressable.pressable, styles.button, variant === 'primary' && pressable.green, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type={type}
      className={classes}
      onClick={(e) => {
        onClick?.(e);
        // 小さな 手ごたえ（音が 切なら 鳴らない）
        playSound('tap');
      }}
      {...rest}
    >
      <span>{children}</span>
      {withArrow && variant === 'primary' && <img className={styles.arrow} src={arrowRight} alt="" />}
    </button>
  );
}
