// 端末とブラウザの見分け（Android版）。しきい値を 端末で分けるときと、確かめる画面の記録に使う。
// 端末の種類を決めるのは detectOs だけにする（あちこちで 判定しない）。

import type { MotionOs } from './stepDetector';

/** navigator のうち 見分けに使うところ（テストでは まねたものを渡す） */
export interface NavigatorLike {
  userAgent: string;
  maxTouchPoints?: number;
  userAgentData?: { platform?: string };
}

/**
 * 端末の種類。userAgentData（Chrome など）を先に見て、無ければ userAgent を見る。
 * iPad は Mac と名乗るので、指で触れる Mac は iPad とみなす。PC 版サイトの表示にした Android は other になる
 */
export function detectOs(nav: NavigatorLike = navigator as NavigatorLike): MotionOs {
  if (nav.userAgentData?.platform === 'Android' || /Android/i.test(nav.userAgent)) return 'android';
  if (/iPhone|iPad|iPod/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && (nav.maxTouchPoints ?? 0) > 1)) return 'ios';
  return 'other';
}

export type BrowserName = 'samsung' | 'firefox' | 'edge' | 'chrome' | 'safari' | 'other';

/** ブラウザの種類（確かめる画面の 表示と記録にだけ使う） */
export function detectBrowser(nav: NavigatorLike = navigator as NavigatorLike): BrowserName {
  const ua = nav.userAgent;
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Firefox|FxiOS/.test(ua)) return 'firefox';
  if (/Edg(A|iOS)?\//.test(ua)) return 'edge';
  if (/Chrome|CriOS/.test(ua)) return 'chrome';
  if (/Safari/.test(ua)) return 'safari';
  return 'other';
}

export const OS_LABEL: Record<MotionOs, string> = { ios: 'iPhone・iPad', android: 'Android', other: 'そのほか（PC など）' };

export const BROWSER_LABEL: Record<BrowserName, string> = {
  samsung: 'Samsung Internet',
  firefox: 'Firefox',
  edge: 'Edge',
  chrome: 'Chrome',
  safari: 'Safari',
  other: 'そのほか',
};
