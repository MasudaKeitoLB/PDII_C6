import { useEffect, useState } from 'react';
import { now } from '../lib/dates';

/** 時計を すすめる 間（ミリ秒）。時間帯の 色は 1分ごとに 少しずつ かわる */
const TICK_MS = 60_000;

/** 画面が 隠れているか（タブを かえた・画面を 消した） */
function pageHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/**
 * 場面の 時計：いまの 時刻（1分ごと）と、画面が 隠れているか。
 * 隠れている 間と stopped の 間は 時計を 止める（もどったら すぐ 時刻を 読みなおす）
 */
export function useSceneClock(stopped: boolean): { date: Date; hidden: boolean } {
  const [date, setDate] = useState(now);
  const [hidden, setHidden] = useState(pageHidden);

  useEffect(() => {
    const onChange = () => {
      const h = pageHidden();
      setHidden(h);
      if (!h) setDate(now());
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  useEffect(() => {
    if (stopped || hidden) return;
    setDate(now());
    const id = window.setInterval(() => setDate(now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [stopped, hidden]);

  return { date, hidden };
}
