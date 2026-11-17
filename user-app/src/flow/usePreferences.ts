import { useEffect, useState, useSyncExternalStore } from 'react';
import { getPreferences, subscribePreferences, type Preferences } from '../lib/preferences';

/** この端末の 設定（かわると 画面を 作りなおす） */
export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribePreferences, getPreferences);
}

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

function osReducesMotion(): boolean {
  try {
    return window.matchMedia(REDUCE_QUERY).matches;
  } catch {
    return false;
  }
}

/** 動きを へらすか（「わたし」の 設定か、端末の「視差効果を減らす」） */
export function useReducedMotion(): boolean {
  const { reduceMotion } = usePreferences();
  const [os, setOs] = useState(osReducesMotion);
  useEffect(() => {
    let query: MediaQueryList;
    try {
      query = window.matchMedia(REDUCE_QUERY);
    } catch {
      return;
    }
    const onChange = () => setOs(query.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);
  return reduceMotion || os;
}

/**
 * 画面を さわったら 演出を すぐ おわらせる（docs/世界観.md 9章：演出の 間も 待たせない）。
 * もどり値が true に なったら、動きを 止めて おわりの 形を 出す。
 */
export function useSkipOnTouch(): boolean {
  const [skip, setSkip] = useState(false);
  useEffect(() => {
    if (skip) return;
    const onTouch = () => setSkip(true);
    document.addEventListener('pointerdown', onTouch, { capture: true, passive: true });
    return () => document.removeEventListener('pointerdown', onTouch, { capture: true });
  }, [skip]);
  return skip;
}

/**
 * 数を 0 から value まで 上げていく（ポイントの 演出）。
 * instant のときは すぐ value を 返す。delayMs 待ってから durationMs かけて 上げる。
 */
export function useCountUp(value: number, { delayMs, durationMs, instant }: { delayMs: number; durationMs: number; instant: boolean }): number {
  const [shown, setShown] = useState(instant ? value : 0);
  useEffect(() => {
    if (instant || value <= 0) {
      setShown(value);
      return;
    }
    let frame = 0;
    const begin = performance.now() + delayMs;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - begin) / durationMs));
      // おわりに 向かって ゆっくりに する
      const eased = 1 - (1 - p) ** 3;
      setShown(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, delayMs, durationMs, instant]);
  return shown;
}
