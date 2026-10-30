import type { Gender } from './types';

/** 身長・体重の画面で 最初に出しておく数（およその平均。だいたいで大丈夫なので ここから少し動かせばよい） */
export const DEFAULT_HEIGHT_CM: Record<Gender, number> = { female: 152, male: 163, unanswered: 158 };
export const DEFAULT_WEIGHT_KG: Record<Gender, number> = { female: 50, male: 60, unanswered: 55 };
