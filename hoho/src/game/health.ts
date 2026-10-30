// 歩数から距離(km)を出す。歩幅 = 身長 × 0.45 の目安
export const distanceKm = (steps: number, heightCm: number) =>
  (steps * heightCm * 0.45) / 100000;

// 消費カロリー(kcal)の目安 = 体重 × 距離 × 0.55
export const kcal = (steps: number, heightCm: number, weightKg: number) =>
  distanceKm(steps, heightCm) * weightKg * 0.55;