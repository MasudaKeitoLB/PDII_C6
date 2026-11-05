export type Gender = 'female' | 'male' | 'unanswered';

export interface Birthday {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface CompleteBirthday {
  year: number;
  month: number;
  day: number;
}

/** 文字の大きさ（M-02 / N-01）。ふつう・大きい・とても大きい の3段階 */
export type TextSize = 'normal' | 'large' | 'xlarge';

/** 利用者登録（M-01）で決める内容 */
export interface Profile {
  name: string;
  birthday: CompleteBirthday;
  /** ログインの安全性（N-13）：好きなローマ字1文字（16章で採用）。使わない設定のときは null */
  letter: string | null;
  nickname: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  dailyGoalSteps: number;
}

/** 管理者側との共有（M-14）の同意の記録 */
export interface ShareConsent {
  agreed: boolean;
  decidedAt: string;
}

/** 記録を見せる相手（M-14）：施設のスタッフ と 担当のケアマネージャー */
export type ShareTarget = 'facility' | 'careManager';

/** 相手ごとの 見せる／見せない と、変えた日時（12章「共有と同意の記録」） */
export interface ShareState {
  agreed: boolean;
  changedAt: string;
}

export type EnemyId = 'amagumo' | 'ishikoron' | 'happappa';

/** 立ち止まって開いたときに まとめて見せる、歩いた分の冒険（16章：成果だけを画面に表示） */
export interface PendingAdventure {
  steps: number;
  enemies: EnemyId[];
  exp: number;
  points: number;
  fromLevel: number;
  toLevel: number;
}

/** ゲームの記録（12章）：本人だけが見る */
export interface GameState {
  level: number;
  /** いまのレベルの中で たまった経験値（16章：経験値は持ち越し） */
  exp: number;
  points: number;
  /** 次の敵に会うまでに 歩いた歩数 */
  stepsTowardEnemy: number;
  /** 次に会う敵（あまぐも → いしころん → はっぱっぱ の順） */
  nextEnemy: number;
  pending: PendingAdventure | null;
}

/** 利用者（サーバーに置く 利用者情報・日ごとの記録・ゲームの記録・共有の記録） */
export interface AppUser extends Profile {
  id: string;
  /** 名前順に並べるときの よみがな（管理者画面）。わからないときは null */
  kana: string | null;
  /** 介護レベル（管理者側が登録する・12章）。未登録は null */
  careLevel: string | null;
  facilityId: string;
  /** 担当のケアマネージャー（管理者側のアカウントID） */
  careManagerId: string | null;
  shares: Record<ShareTarget, ShareState>;
  textSize: TextSize;
  /** 日ごとの歩数（日付 YYYY-MM-DD → 歩数） */
  days: Record<string, number>;
  /** 最後に記録を受け取った日時（N-19） */
  lastSyncAt: string | null;
  game: GameState;
  registeredAt: string;
  /** デモ用のサンプルの利用者 */
  sample: boolean;
}

export interface LoginCredentials {
  name: string;
  birthday: CompleteBirthday;
  letter: string | null;
}

export type AdminRole = 'staff' | 'careManager';

/** 管理者側のアカウント（運営者が発行する・M-15） */
export interface AdminAccount {
  /** ログインに使うアカウントID */
  id: string;
  password: string;
  name: string;
  role: AdminRole;
  /** 画面に出す 所属 */
  organization: string;
  facilityId: string;
}
