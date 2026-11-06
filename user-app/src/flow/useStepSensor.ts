import { useEffect, useRef } from 'react';
import { listenMotion, type MotionSignal } from '../lib/motion';
import { detectOs } from '../lib/platform';
import { createStepDetector, stepOptionsFor } from '../lib/stepDetector';

interface StepSensorOptions {
  /** 値が届いているかが かわったとき（止めたときは unknown） */
  onSignal?: (signal: MotionSignal) => void;
  /** かわると 聞きなおす（「もう一度 たしかめる」） */
  restartKey?: number;
}

/**
 * enabled の間だけ 体の動きから歩数を数え、数えた分を onSteps に知らせる（M-03）。
 * 値は 1秒に 60回ほど届くので、ここでは 状態を変えない（歩数が ふえたときと、届いているかが かわったときだけ 知らせる）。
 * しきい値は 端末の種類で選ぶ（いまは どれも 1.0）
 */
export function useStepSensor(enabled: boolean, onSteps: (steps: number) => void, { onSignal, restartKey = 0 }: StepSensorOptions = {}): void {
  const onStepsRef = useRef(onSteps);
  const onSignalRef = useRef(onSignal);
  useEffect(() => {
    onStepsRef.current = onSteps;
    onSignalRef.current = onSignal;
  }, [onSteps, onSignal]);

  useEffect(() => {
    if (!enabled) return;
    const detector = createStepDetector(stepOptionsFor(detectOs()));
    const stop = listenMotion(
      (sample) => {
        const steps = detector.push(sample);
        if (steps > 0) onStepsRef.current(steps);
      },
      { onSignal: (signal) => onSignalRef.current?.(signal) },
    );
    return () => {
      stop();
      detector.reset();
      onSignalRef.current?.('unknown');
    };
  }, [enabled, restartKey]);
}
