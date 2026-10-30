// 画面の一覧と順番。URL の # に画面の名前が入るので、確認したい画面へ直接とべる。

export type RouteId =
  | 'start' // U-00 はじめの画面
  | 'register-name' // U-01
  | 'register-birthday' // U-02
  | 'register-letter' // U-02b 合言葉の文字（案。L-03 を使うときだけ）
  | 'register-nickname' // U-03
  | 'register-gender' // U-04
  | 'register-height' // U-05
  | 'register-weight' // U-06
  | 'register-goal' // U-07
  | 'register-share' // U-08
  | 'register-permission' // U-09
  | 'register-ready' // U-10
  | 'login-name' // L-01
  | 'login-birthday' // L-02
  | 'login-letter' // L-03（案）
  | 'home'; // ホーム（次の段階で作る）

export const ALL_ROUTES: { id: RouteId; code: string; name: string }[] = [
  { id: 'start', code: 'U-00', name: 'はじめの画面' },
  { id: 'register-name', code: 'U-01', name: '登録① お名前' },
  { id: 'register-birthday', code: 'U-02', name: '登録② 誕生日' },
  { id: 'register-letter', code: 'U-02b', name: '登録 合言葉の文字（案）' },
  { id: 'register-nickname', code: 'U-03', name: '登録③ 呼び名' },
  { id: 'register-gender', code: 'U-04', name: '登録④ 性別' },
  { id: 'register-height', code: 'U-05', name: '登録⑤ 身長' },
  { id: 'register-weight', code: 'U-06', name: '登録⑥ 体重' },
  { id: 'register-goal', code: 'U-07', name: '登録⑦ 1日の目標歩数' },
  { id: 'register-share', code: 'U-08', name: '登録⑧ 記録を見せる' },
  { id: 'register-permission', code: 'U-09', name: '登録⑨ スマホの許可' },
  { id: 'register-ready', code: 'U-10', name: '準備ができました' },
  { id: 'login-name', code: 'L-01', name: 'ログイン① お名前' },
  { id: 'login-birthday', code: 'L-02', name: 'ログイン② 誕生日' },
  { id: 'login-letter', code: 'L-03', name: 'ログイン③ 合言葉の文字（案）' },
  { id: 'home', code: 'H-01', name: 'ホーム（仮）' },
];

export function isRouteId(value: string): value is RouteId {
  return ALL_ROUTES.some((r) => r.id === value);
}

/** 進み具合を出す 登録の手順（U-09・U-10 は数えない） */
export function registerSteps(useLoginLetter: boolean): RouteId[] {
  return [
    'register-name',
    'register-birthday',
    ...(useLoginLetter ? (['register-letter'] as const) : []),
    'register-nickname',
    'register-gender',
    'register-height',
    'register-weight',
    'register-goal',
    'register-share',
  ];
}

export function loginSteps(useLoginLetter: boolean): RouteId[] {
  return ['login-name', 'login-birthday', ...(useLoginLetter ? (['login-letter'] as const) : [])];
}
