import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './FitScene.module.css';

interface FitSceneProps {
  /** デザイン上の大きさ（px） */
  width: number;
  height: number;
  className?: string;
  /** 絵の部品。デザインの座標（px）のまま 置く */
  children: ReactNode;
}

/**
 * ドット絵の場面を デザインの座標のまま置き、画面の幅に合わせて 全体を同じ割合で拡大・縮小する。
 * 絵の部品は 元の大きさのまま使える。
 */
export function FitScene({ width, height, className, children }: FitSceneProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={outerRef}
      className={[styles.outer, className].filter(Boolean).join(' ')}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div className={styles.inner} style={{ width, height, '--scene-scale': scale } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

/** 場面の中の部品を デザインの座標（左上 x, y）に置く */
export function Place({ x, y, children, className }: { x: number; y: number; children: ReactNode; className?: string }) {
  return (
    <div className={[styles.place, className].filter(Boolean).join(' ')} style={{ left: x, top: y }}>
      {children}
    </div>
  );
}
