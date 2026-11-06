import { useEffect, useRef } from 'react';
import { listenMotion } from '../lib/motion';
import { createStepDetector } from '../lib/stepDetector';

/**
 * enabled の間だけ 体の動きから歩数を数え、数えた分を onSteps に知らせる（M-03）。
 * 値は 1秒に 60回ほど届くので、ここでは 状態を変えない（歩数が ふえたときだけ 知らせる）
 */
export function useStepSensor(enabled: boolean, onSteps: (steps: number) => void): void {
  const onStepsRef = useRef(onSteps);
  useEffect(() => {
    onStepsRef.current = onSteps;
  }, [onSteps]);

  useEffect(() => {
    if (!enabled) return;
    const detector = createStepDetector();
    const stop = listenMotion((sample) => {
      const steps = detector.push(sample);
      if (steps > 0) onStepsRef.current(steps);
    });
    return () => {
      stop();
      detector.reset();
    };
  }, [enabled]);
}
