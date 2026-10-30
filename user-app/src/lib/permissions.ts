// 歩数（体の動き）と いる場所の許可（U-09, M-03, M-04, N-15）。
//
// 本実装（スマホのアプリ）では ここで OS の許可画面を出す：
//   - iPhone：モーションとフィットネス（CMPedometer）、位置情報（使用中のみ）
//   - Android：身体活動（ACTIVITY_RECOGNITION）、位置情報
// 距離を「歩数×歩幅」で出すなら、いる場所の許可はいらない（M-04 は設計で決める）。
//
// 試作（ブラウザ）では 許可画面を出さずに 次へ進む。

export async function requestSensorPermissions(): Promise<void> {
  return Promise.resolve();
}
