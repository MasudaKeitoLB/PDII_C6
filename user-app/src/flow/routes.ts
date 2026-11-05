// 画面の一覧と順番。URL の # に画面の名前が入るので、確認したい画面へ直接とべる。

export type RouteId =
  // 2 はじめての設定
  | 'start' // U-00 はじめの画面
  | 'register-name' // U-01
  | 'register-birthday' // U-02
  | 'register-letter' // U-02b 合言葉の文字（L-03 を使うときだけ）
  | 'register-nickname' // U-03
  | 'register-gender' // U-04
  | 'register-height' // U-05
  | 'register-weight' // U-06
  | 'register-goal' // U-07
  | 'register-share' // U-08
  | 'register-permission' // U-09
  | 'register-ready' // U-10
  // 3 ログイン
  | 'login-name' // L-01
  | 'login-birthday' // L-02
  | 'login-letter' // L-03
  // 4 ホームと冒険（H-02 歩きスマホ防止は 画面に重ねて出す）
  | 'home' // H-01・H-01b
  | 'adventure-result' // H-03
  | 'level-up' // H-04
  // 5 記録
  | 'records' // R-01
  | 'records-month' // R-02
  // 6 わたし
  | 'me' // M-01
  | 'me-text-size' // M-02
  | 'me-share' // M-03
  | 'me-share-stop' // M-04
  | 'me-goal' // 目標歩数の変更（U-07 と同じ画面）
  | 'me-profile' // お名前・身長・体重
  | 'me-profile-name'
  | 'me-profile-nickname'
  | 'me-profile-height'
  | 'me-profile-weight'
  // 7 管理者画面：スマホ版
  | 'admin-login' // AM-01
  | 'admin-list' // AM-02
  | 'admin-user' // AM-03
  // 8 管理者画面：PC版
  | 'admin-pc-login' // AP-01
  | 'admin-pc-list' // AP-02
  | 'admin-pc-user'; // AP-03

export type RouteGroup = 'register' | 'login' | 'app' | 'admin' | 'admin-pc';

export interface RouteInfo {
  id: RouteId;
  code: string;
  name: string;
  group: RouteGroup;
}

export const ALL_ROUTES: RouteInfo[] = [
  { id: 'start', code: 'U-00', name: 'はじめの画面', group: 'register' },
  { id: 'register-name', code: 'U-01', name: '登録① お名前', group: 'register' },
  { id: 'register-birthday', code: 'U-02', name: '登録② 誕生日', group: 'register' },
  { id: 'register-letter', code: 'U-02b', name: '登録 合言葉の文字', group: 'register' },
  { id: 'register-nickname', code: 'U-03', name: '登録③ 呼び名', group: 'register' },
  { id: 'register-gender', code: 'U-04', name: '登録④ 性別', group: 'register' },
  { id: 'register-height', code: 'U-05', name: '登録⑤ 身長', group: 'register' },
  { id: 'register-weight', code: 'U-06', name: '登録⑥ 体重', group: 'register' },
  { id: 'register-goal', code: 'U-07', name: '登録⑦ 1日の目標歩数', group: 'register' },
  { id: 'register-share', code: 'U-08', name: '登録⑧ 記録を見せる', group: 'register' },
  { id: 'register-permission', code: 'U-09', name: '登録⑨ スマホの許可', group: 'register' },
  { id: 'register-ready', code: 'U-10', name: '準備ができました', group: 'register' },
  { id: 'login-name', code: 'L-01', name: 'ログイン① お名前', group: 'login' },
  { id: 'login-birthday', code: 'L-02', name: 'ログイン② 誕生日', group: 'login' },
  { id: 'login-letter', code: 'L-03', name: 'ログイン③ 合言葉の文字', group: 'login' },
  { id: 'home', code: 'H-01', name: 'ホーム（冒険）', group: 'app' },
  { id: 'adventure-result', code: 'H-03', name: '冒険の成果', group: 'app' },
  { id: 'level-up', code: 'H-04', name: 'レベルアップ', group: 'app' },
  { id: 'records', code: 'R-01', name: '記録（1週間）', group: 'app' },
  { id: 'records-month', code: 'R-02', name: '記録（1か月）', group: 'app' },
  { id: 'me', code: 'M-01', name: 'わたし', group: 'app' },
  { id: 'me-text-size', code: 'M-02', name: '文字の大きさ', group: 'app' },
  { id: 'me-share', code: 'M-03', name: '記録を見せる相手', group: 'app' },
  { id: 'me-share-stop', code: 'M-04', name: '見せるのをやめる確認', group: 'app' },
  { id: 'me-goal', code: 'M-05', name: '1日の目標歩数を変える', group: 'app' },
  { id: 'me-profile', code: 'M-06', name: 'お名前・身長・体重', group: 'app' },
  { id: 'me-profile-name', code: 'M-06a', name: 'お名前を変える', group: 'app' },
  { id: 'me-profile-nickname', code: 'M-06b', name: '呼び名を変える', group: 'app' },
  { id: 'me-profile-height', code: 'M-06c', name: '身長を変える', group: 'app' },
  { id: 'me-profile-weight', code: 'M-06d', name: '体重を変える', group: 'app' },
  { id: 'admin-login', code: 'AM-01', name: '管理者ログイン（スマホ）', group: 'admin' },
  { id: 'admin-list', code: 'AM-02', name: '利用者の一覧（スマホ）', group: 'admin' },
  { id: 'admin-user', code: 'AM-03', name: '測定結果（スマホ）', group: 'admin' },
  { id: 'admin-pc-login', code: 'AP-01', name: '管理者ログイン（PC）', group: 'admin-pc' },
  { id: 'admin-pc-list', code: 'AP-02', name: '利用者の一覧（PC）', group: 'admin-pc' },
  { id: 'admin-pc-user', code: 'AP-03', name: '測定結果（PC）', group: 'admin-pc' },
];

export function routeInfo(id: RouteId): RouteInfo {
  return ALL_ROUTES.find((r) => r.id === id)!;
}

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

/** 下のタブ（MVPは3つ・N-06）。名前は ふだんの言葉にする（9章 確認1） */
export type TabId = 'adventure' | 'records' | 'me';

export function tabOf(route: RouteId): TabId | null {
  if (route === 'home') return 'adventure';
  if (route === 'records' || route === 'records-month') return 'records';
  if (route === 'me') return 'me';
  return null;
}
