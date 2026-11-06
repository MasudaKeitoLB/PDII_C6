// 移動距離（M-04）と消費カロリー（M-05）の計算。
// 試作では 歩数から出す（距離を「歩数×歩幅」で出せば、いる場所の許可がいらない・9章 確認5）。
// 計算のしかたは チームで確かめる前提の案。

/** 歩幅（cm）：身長 × 0.37（ゆっくり歩く高齢の人の目安） */
export function strideCm(heightCm: number): number {
  return Math.round(heightCm * 0.37);
}

export function distanceKm(steps: number, heightCm: number): number {
  return (steps * strideCm(heightCm)) / 100_000;
}

/** 歩く時間の目安：1分に100歩 */
const STEPS_PER_MINUTE = 100;

/**
 * 体重1kg・1歩あたりの 消費カロリー（kcal）。
 * Figma の数字（体重50kgで 1歩0.031kcal：3,210歩→100kcal）に合わせた 仮の係数。
 * 散歩（3.5メッツ）を 1分に約99歩で歩いたときに あたる（kcal = 1.05 × メッツ × 体重 × 時間）。性別は使わない
 */
const KCAL_PER_STEP_PER_KG = 0.00062;

export function caloriesKcal(steps: number, weightKg: number): number {
  return steps * weightKg * KCAL_PER_STEP_PER_KG;
}

export function walkingMinutes(steps: number): number {
  return steps / STEPS_PER_MINUTE;
}

export const formatSteps = (n: number) => Math.round(n).toLocaleString('ja-JP');
export const formatKm = (km: number) => km.toFixed(1);
export const formatKcal = (kcal: number) => Math.round(kcal).toLocaleString('ja-JP');
