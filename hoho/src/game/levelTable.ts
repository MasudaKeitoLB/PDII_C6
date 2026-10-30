// ゲームの数値設定とレベル計算
export const MAX_LEVEL = 1000;
export const STEPS_PER_ATTACK = 10; // 10歩で1回攻撃
export const ATTACKS_PER_ENEMY = 5; // 5回攻撃で敵を撃破（= 50歩で1体）
export const POINTS_PER_ENEMY = 10; // 敵1体ぶんのポイント

// レベル n から n+1 に上がるために必要な経験値（1歩 = 経験値1）
export const expToNext = (level: number): number =>
  Math.round(60 * Math.pow(level, 1.1));

// 経験値を加えて、新しいレベルと「今のレベル内の経験値」を返す
export function applyExp(level: number, expInLevel: number, gained: number) {
  let lv = level;
  let exp = expInLevel + gained;
  while (lv < MAX_LEVEL && exp >= expToNext(lv)) {
    exp -= expToNext(lv);
    lv += 1;
  }
  if (lv >= MAX_LEVEL) exp = 0;
  return { level: lv, expInLevel: exp };
}

// 歩数から攻撃回数・撃破数・ポイントを計算
export function calcBattle(steps: number) {
  const attacks = Math.floor(steps / STEPS_PER_ATTACK);
  const defeated = Math.floor(attacks / ATTACKS_PER_ENEMY);
  return { attacks, defeated, points: defeated * POINTS_PER_ENEMY };
}

// 調整用：Lv1000まで合計で何歩かかるか
export function totalExpToMax(): number {
  let sum = 0;
  for (let lv = 1; lv < MAX_LEVEL; lv++) sum += expToNext(lv);
  return sum;
}