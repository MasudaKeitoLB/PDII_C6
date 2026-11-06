// 歩くと進む冒険（M-07〜M-09）。
// - 歩いた歩数が そのまま経験値になる。経験値は持ち越し（16章で決定）：レベルが上がっても あまりは次へ
// - 歩くと敵に会い、たおすとポイントが手に入る（戦い方は未決のため、自動でたおす形にしておく）
// - 歩いた分の冒険は 立ち止まって開いたときに 成果だけまとめて見せる（16章で決定）

import type { EnemyId, GameState, PendingAdventure } from './types';

export const ENEMY_ORDER: EnemyId[] = ['amagumo', 'ishikoron', 'happappa'];

export const ENEMY_NAMES: Record<EnemyId, string> = {
  amagumo: 'あまぐも',
  ishikoron: 'いしころん',
  happappa: 'はっぱっぱ',
};

/** 敵に1回会うまでの歩数 */
export const STEPS_PER_ENEMY = 750;
/** 敵を1体たおすと もらえるポイント */
export const POINTS_PER_ENEMY = 10;

/**
 * レベル L から L+1 に上がるのに いる経験値（歩数）。レベルが上がるほど 少しずつ ふえる（案）。
 * Figma の H-01（レベル12・あと1,450歩で バー20マスのうち12マス）に合う数にしている。
 */
export function expForNextLevel(level: number): number {
  return 3000 + 50 * level;
}

export function newGame(): GameState {
  return { level: 1, exp: 0, points: 0, stepsTowardEnemy: 0, nextEnemy: 0, pending: null };
}

/** 次のレベルまで あと何歩か */
export function stepsToNextLevel(game: GameState): number {
  return Math.max(0, expForNextLevel(game.level) - game.exp);
}

/** 経験値のバーの割合（0〜1） */
export function levelProgress(game: GameState): number {
  return Math.min(1, game.exp / expForNextLevel(game.level));
}

/** 次に会う敵 */
export function upcomingEnemy(game: GameState): EnemyId {
  return ENEMY_ORDER[game.nextEnemy % ENEMY_ORDER.length];
}

/** 歩いた分を 冒険に入れる。成果は pending にたまり、見たときに消す */
export function walk(game: GameState, steps: number): GameState {
  if (steps <= 0) return game;
  let { level, exp, points, stepsTowardEnemy, nextEnemy } = game;
  const pending: PendingAdventure = game.pending
    ? { ...game.pending, enemies: [...game.pending.enemies] }
    : { steps: 0, enemies: [], exp: 0, points: 0, fromLevel: level, toLevel: level };

  // 経験値とレベル（あまりは持ち越し）
  exp += steps;
  while (exp >= expForNextLevel(level)) {
    exp -= expForNextLevel(level);
    level += 1;
  }

  // 敵とポイント
  stepsTowardEnemy += steps;
  while (stepsTowardEnemy >= STEPS_PER_ENEMY) {
    stepsTowardEnemy -= STEPS_PER_ENEMY;
    pending.enemies.push(ENEMY_ORDER[nextEnemy % ENEMY_ORDER.length]);
    nextEnemy = (nextEnemy + 1) % ENEMY_ORDER.length;
    points += POINTS_PER_ENEMY;
    pending.points += POINTS_PER_ENEMY;
  }

  pending.steps += steps;
  pending.exp += steps;
  pending.toLevel = level;
  return { level, exp, points, stepsTowardEnemy, nextEnemy, pending };
}

/** 成果を見おわった */
export function clearPending(game: GameState): GameState {
  return { ...game, pending: null };
}

/** いまのレベルと経験値から ゲームの記録を作る（サンプルの利用者用） */
export function gameAt(level: number, stepsLeftToNext: number, points: number, nextEnemy = 0): GameState {
  return {
    level,
    exp: Math.max(0, expForNextLevel(level) - stepsLeftToNext),
    points,
    stepsTowardEnemy: 0,
    nextEnemy,
    pending: null,
  };
}
