// 歩数（体の動き）の許可（U-09, M-03）。
//
// 試作は Web アプリなので、ブラウザの devicemotion を使う（11/6決定）。
//   - iPhone（Safari）：画面のボタンを押したときに 許可を求める（DeviceMotionEvent.requestPermission）。HTTPS が必要
//   - Android（Chrome）：許可はいらない
// いる場所は 試作では使わない（距離は「歩数×歩幅」で出す。M-04）。

/**
 * checking：調べている／granted：数えられる／needs-button：ボタンを押して 許可してもらう必要がある（iPhone）
 * denied：許可されなかった／unsupported：このブラウザでは 数えられない
 */
export type MotionAccess = 'checking' | 'granted' | 'needs-button' | 'denied' | 'unsupported';

type PermissionResult = 'granted' | 'denied';
type MotionEventClass = { requestPermission?: () => Promise<PermissionResult> };

function motionEventClass(): MotionEventClass | null {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return null;
  return window.DeviceMotionEvent as unknown as MotionEventClass;
}

/** ボタン操作なしで 調べる（開いたとき）。まだ聞いていない iPhone では needs-button になる */
export async function checkMotionAccess(): Promise<MotionAccess> {
  const cls = motionEventClass();
  if (!cls) return 'unsupported';
  if (typeof cls.requestPermission !== 'function') return 'granted';
  try {
    return (await cls.requestPermission()) === 'granted' ? 'granted' : 'denied';
  } catch (e) {
    return e instanceof DOMException && e.name === 'NotAllowedError' ? 'needs-button' : 'unsupported';
  }
}

/**
 * ボタンを押したときに 許可を求める。
 * iPhone では ボタン操作の中で 最初に呼ぶ必要がある（この前に await を はさまない）
 */
export function requestSensorPermissions(): Promise<MotionAccess> {
  const cls = motionEventClass();
  if (!cls) return Promise.resolve('unsupported');
  if (typeof cls.requestPermission !== 'function') return Promise.resolve('granted');
  return cls.requestPermission().then(
    (result): MotionAccess => (result === 'granted' ? 'granted' : 'denied'),
    (): MotionAccess => 'needs-button',
  );
}
