// 体の動き（加速度）から 歩数を数える（M-03・N-17）。
//
// スマホを持って歩くと、1歩ごとに 加速度の大きさに 山ができる。その山を数える。
//   1. 加速度の大きさ √(x²+y²+z²) を出す（スマホの向きに 左右されない）
//   2. 直近の数点で 平均して なめらかにする
//   3. ゆっくり ついてくる平均（重力の分）を引き、しきい値を こえた山を 1歩とする
//   4. 山と山の間が 近すぎるものは 同じ1歩、空きすぎたら つづきを 切る
//   5. 手で ゆらしただけで数えないよう、何歩か つづいてから まとめて足す
//
// 数値は 試作で決めた案。実機で 実際の歩数と くらべて 直す（15章「歩数の精度」）。
// ブラウザにも React にも 頼らないので、node --test で そのまま確かめられる。

export interface MotionSample {
  /** ミリ秒 */
  t: number;
  /** 重力をふくむ加速度（m/s²） */
  x: number;
  y: number;
  z: number;
}

export interface StepOptions {
  /** なめらかにするとき 平均する 点の数 */
  smoothCount: number;
  /** 重力の分を ならす はやさ（ミリ秒。大きいほど ゆっくり ついてくる） */
  baselineMs: number;
  /** 平均より これだけ上の山を 1歩とする（m/s²） */
  threshold: number;
  /** これより近い山は 同じ1歩 */
  minGapMs: number;
  /** これより空いたら つづきが切れる */
  maxGapMs: number;
  /** ここまで つづいたら、それまでの分を まとめて足す */
  confirmSteps: number;
  /** 値が これより長く来なければ はじめから */
  resetGapMs: number;
}

export const DEFAULT_STEP_OPTIONS: StepOptions = {
  smoothCount: 4,
  baselineMs: 1000,
  // iPhone の実機で 実際の歩数と くらべ、1.0 が いちばん近かった（11/6。はじめの案は 1.2）
  threshold: 1.0,
  minGapMs: 250,
  maxGapMs: 2000,
  confirmSteps: 4,
  resetGapMs: 1000,
};

export interface StepDetector {
  /** 値を1つ入れて、いま足す歩数を返す */
  push(sample: MotionSample): number;
  reset(): void;
  /** 確かめる画面と テストのための 中の様子 */
  inspect(): { smoothed: number; baseline: number; streak: number; walking: boolean; lastStepAt: number | null };
}

export function createStepDetector(options: Partial<StepOptions> = {}): StepDetector {
  const o: StepOptions = { ...DEFAULT_STEP_OPTIONS, ...options };
  let recent: number[] = [];
  let lastT: number | null = null;
  let smoothed = 0;
  let baseline: number | null = null;
  /** 次の山を 受けつけるか（いちど 平均より下に もどるまで 次の山を 数えない） */
  let armed = true;
  let lastPeakAt: number | null = null;
  let streak = 0;

  const reset = () => {
    recent = [];
    lastT = null;
    smoothed = 0;
    baseline = null;
    armed = true;
    lastPeakAt = null;
    streak = 0;
  };

  const push = (sample: MotionSample): number => {
    const { t, x, y, z } = sample;
    if (![t, x, y, z].every(Number.isFinite)) return 0;
    if (lastT !== null && (t < lastT || t - lastT >= o.resetGapMs)) reset();
    const dt = lastT === null ? 0 : t - lastT;
    lastT = t;

    recent.push(Math.sqrt(x * x + y * y + z * z));
    if (recent.length > o.smoothCount) recent.shift();
    smoothed = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    baseline = baseline === null ? smoothed : baseline + (smoothed - baseline) * Math.min(1, dt / o.baselineMs);

    const diff = smoothed - baseline;
    if (!armed) {
      if (diff <= 0) armed = true;
      return 0;
    }
    if (diff <= o.threshold) return 0;
    armed = false;

    const gap = lastPeakAt === null ? Infinity : t - lastPeakAt;
    if (gap < o.minGapMs) return 0;
    lastPeakAt = t;
    streak = gap > o.maxGapMs ? 1 : streak + 1;
    if (streak === o.confirmSteps) return o.confirmSteps;
    return streak > o.confirmSteps ? 1 : 0;
  };

  const inspect = () => ({
    smoothed,
    baseline: baseline ?? 0,
    streak,
    walking: streak >= o.confirmSteps && lastPeakAt !== null && lastT !== null && lastT - lastPeakAt <= o.maxGapMs,
    lastStepAt: lastPeakAt,
  });

  return { push, reset, inspect };
}

/** 値の列を まとめて数える（テストと 確かめる画面の くらべ用） */
export function countSteps(samples: MotionSample[], options: Partial<StepOptions> = {}): number {
  const detector = createStepDetector(options);
  return samples.reduce((sum, s) => sum + detector.push(s), 0);
}
