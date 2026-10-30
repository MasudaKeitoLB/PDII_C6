import { useCallback, useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';

// 歩数センサー。steps は「アプリ起動後に数えた歩数」
export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;

    (async () => {
      try {
        const perm = await Pedometer.requestPermissionsAsync();
        const ok = perm.granted && (await Pedometer.isAvailableAsync());
        setAvailable(ok);
        if (!ok) return;
        sub = Pedometer.watchStepCount((result) => setSteps(result.steps));
      } catch {
        setAvailable(false);
      }
    })();

    return () => sub?.remove();
  }, []);

  // 開発用：ボタンで歩数を増やす
  const addDebugSteps = useCallback((n: number) => setSteps((s) => s + n), []);

  return { steps, available, addDebugSteps };
}