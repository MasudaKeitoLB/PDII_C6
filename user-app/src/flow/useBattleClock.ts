import { useEffect, useState } from 'react';

/** 時計の きざみ（秒）。これより こまかくは 画面を 作りなおさない */
const TICK_SEC = 1 / 30;

/**
 * 成果の画面の 戦闘の 時計（秒）。開いてから 0 → total まで 進み、total で 止まる。
 * instant（動きを へらす・画面を さわった）のときは すぐ total を 返す
 */
export function useBattleClock(total: number, instant: boolean): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    // 成果が かわって 長さが かわったときは はじめから
    setT(0);
    if (instant || total <= 0) return;
    let frame = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const sec = Math.min(total, (now - begin) / 1000);
      // 1/30秒 きざみに まるめる（同じ 値なら React は 作りなおさない）
      setT(sec >= total ? total : Math.floor(sec / TICK_SEC) * TICK_SEC);
      if (sec < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [total, instant]);
  return instant ? total : Math.min(t, total);
}
