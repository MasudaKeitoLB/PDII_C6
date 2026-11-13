// ホームに出す「歩数を数える準備」の案内を どれにするか（M-03・N-06）。
// 数えられる人には 何も出さない。PC のデモ（センサーが無い）では「値が届かない」を出さない。

import type { MotionSignal } from './motion';
import type { MotionAccess } from './permissions';

/**
 * needs-button：iPhone で まだ許可していない（ボタンで許可する）
 * blocked：許可されていない・このブラウザでは数えられない
 * silent：許可はあるが 体の動きの値が 届かない（Android の設定で止めている など）
 */
export type MotionNoticeKind = 'needs-button' | 'blocked' | 'silent';

/** phoneLike：スマホ・タブレット（iPhone・iPad・Android）で開いているか（PC では false） */
export function motionNoticeKind(access: MotionAccess, signal: MotionSignal, phoneLike: boolean): MotionNoticeKind | null {
  if (access === 'needs-button') return 'needs-button';
  if (access === 'denied') return 'blocked';
  if (access === 'unsupported') return phoneLike ? 'blocked' : null;
  if (access === 'granted' && signal === 'silent') return phoneLike ? 'silent' : null;
  return null;
}
