import type { CSSProperties } from 'react';
import { threadDots } from '../data/stages';
import s from './ThreadDots.module.css';

/**
 * 7色の 糸（7つの 小さな 丸）。いまの 道は 白い ふち、色の もどった 道は その色、まだの 道は うすい ふち。
 * エリア名の 札の 中に 出す。名前は 札の 読み上げで 伝えるので、丸は 読み上げない
 */
export function ThreadDots({ pos, lap }: { pos: number; lap: number }) {
  return (
    <span className={s.dots} aria-hidden="true" data-threads>
      {threadDots(pos, lap).map((d) => (
        <span key={d.area} className={s.dot} data-thread-state={d.state} data-area={d.area} style={{ '--c': d.color } as CSSProperties} />
      ))}
    </span>
  );
}
