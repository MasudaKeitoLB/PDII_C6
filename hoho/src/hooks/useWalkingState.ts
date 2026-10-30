import { useEffect, useRef, useState } from 'react';

// 完全に止まってから10秒で「歩行終了」と判定する
const STOP_MS = 10_000;

export function useWalkingState(steps: number, onFinish: () => void) {
  const [walking, setWalking] = useState(false);
  const lastSteps = useRef(steps);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (steps === lastSteps.current) return;
    lastSteps.current = steps;

    setWalking(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setWalking(false);
      onFinishRef.current();
    }, STOP_MS);
  }, [steps]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return walking;
}