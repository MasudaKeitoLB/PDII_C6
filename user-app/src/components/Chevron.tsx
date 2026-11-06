import type { CSSProperties } from 'react';
import arrowRight from '../assets/ui/arrow-right-white.svg';
import styles from './Chevron.module.css';

interface ChevronProps {
  /** デザイン上の大きさ（やじるし本体の高さ。ふつうは 20） */
  size?: number;
  color?: string;
  className?: string;
}

/**
 * 行の右の「＞」。主ボタンのやじるし（Figma の同じ形）を、色だけ変えて使う。
 */
export function Chevron({ size = 20, color = 'var(--color-sumi)', className }: ChevronProps) {
  const scale = size / 20;
  return (
    <span
      className={[styles.chevron, className].filter(Boolean).join(' ')}
      style={{ '--chevron-url': `url("${arrowRight}")`, '--chevron-color': color, '--chevron-scale': scale } as CSSProperties}
      aria-hidden="true"
    />
  );
}
