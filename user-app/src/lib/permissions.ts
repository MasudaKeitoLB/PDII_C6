// 歩数（体の動き）の許可（U-09, M-03）。
//
// 試作は Web アプリなので、ブラウザの devicemotion を使う（11/6決定）。
//   - iPhone（Safari）：画面のボタンを押したときに 許可を求める（DeviceMotionEvent.requestPermission）。HTTPS が必要
//   - Android の Chrome（152 から）：requestPermission はあるが 既定で許可。サイトの設定で「モーション センサー」を止めていると denied
//   - Samsung Internet・Firefox・古い Chrome：requestPermission が無い。止めているかは Permissions API（accelerometer）で調べる
//     （Firefox には それも無い。値が届くかは motion.ts で見張る）
// いる場所は 試作では使わない（距離は「歩数×歩幅」で出す。M-04）。

/**
 * checking：調べている／granted：数えられる／needs-button：ボタンを押して 許可してもらう必要がある（iPhone）
 * denied：許可されなかった／unsupported：このブラウザでは 数えられない
 */
export type MotionAccess = 'checking' | 'granted' | 'needs-button' | 'denied' | 'unsupported';

type PermissionResult = 'granted' | 'denied';
type MotionEventClass = { requestPermission?: () => Promise<PermissionResult> };

/** Permissions API で分かった 加速度センサーの状態（unknown：調べられない） */
export type SensorPermission = PermissionState | 'unknown';

function motionEventClass(): MotionEventClass | null {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return null;
  return window.DeviceMotionEvent as unknown as MotionEventClass;
}

/** 許可を求める仕組み（requestPermission）が あるか */
export function hasPermissionButton(): boolean {
  return typeof motionEventClass()?.requestPermission === 'function';
}

function accelerometerQuery(): Promise<PermissionStatus> | null {
  if (typeof navigator === 'undefined' || typeof navigator.permissions?.query !== 'function') return null;
  try {
    return navigator.permissions.query({ name: 'accelerometer' as PermissionName });
  } catch {
    return null;
  }
}

/** 加速度センサーの許可の状態を調べる。調べられないブラウザ（Firefox・Safari）では unknown（何も出さない） */
export async function queryAccelerometer(): Promise<SensorPermission> {
  try {
    const status = await accelerometerQuery();
    return status ? status.state : 'unknown';
  } catch {
    return 'unknown';
  }
}

/** 加速度センサーの許可が かわったら知らせる（Android で 設定を直したとき）。もどり値を呼ぶと やめる */
export function watchAccelerometer(onChange: (state: PermissionState) => void): () => void {
  let stopped = false;
  let status: PermissionStatus | null = null;
  const handler = () => {
    if (status) onChange(status.state);
  };
  accelerometerQuery()
    ?.then((s) => {
      if (stopped) return;
      status = s;
      s.addEventListener('change', handler);
    })
    .catch(() => {});
  return () => {
    stopped = true;
    status?.removeEventListener('change', handler);
  };
}

/** requestPermission の無いブラウザで：止めていれば denied、それ以外は granted（値が届くかは 別に見張る） */
async function accessWithoutButton(): Promise<MotionAccess> {
  return (await queryAccelerometer()) === 'denied' ? 'denied' : 'granted';
}

/** ボタン操作なしで 調べる（開いたとき）。まだ聞いていない iPhone では needs-button になる */
export async function checkMotionAccess(): Promise<MotionAccess> {
  const cls = motionEventClass();
  if (!cls) return 'unsupported';
  if (typeof cls.requestPermission !== 'function') return accessWithoutButton();
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
  if (typeof cls.requestPermission !== 'function') return accessWithoutButton();
  return cls.requestPermission().then(
    (result): MotionAccess => (result === 'granted' ? 'granted' : 'denied'),
    (): MotionAccess => 'needs-button',
  );
}

/**
 * ボタン操作なしで 調べなおす（画面が見えるようになったとき・設定が かわったとき）。調べなおさないときは null。
 *   - まだ はじめの調べ（checking）の途中なら 調べなおさない（その結果を 捨てないため）
 *   - requestPermission があるとき（iPhone・Chrome 152 から）は denied のときだけ 聞きなおす
 *     （iPhone で まだ許可していない人や、ボタンで許可している途中の人の 結果を 上書きしない）
 */
export function recheckMotionAccess(current: MotionAccess): Promise<MotionAccess> | null {
  if (current === 'checking') return null;
  if (!hasPermissionButton()) return checkMotionAccess();
  return current === 'denied' ? checkMotionAccess() : null;
}
