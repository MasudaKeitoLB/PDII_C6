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

/** 利用者登録（M-01）で決める内容 */
export interface Profile {
  name: string;
  birthday: CompleteBirthday;
  /** ログインの安全性（N-13）の案：好きなローマ字1文字。使わない設定のときは null */
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

export interface RegisteredUser extends Profile {
  id: string;
  shareConsent: ShareConsent;
  registeredAt: string;
}

export interface LoginCredentials {
  name: string;
  birthday: CompleteBirthday;
  letter: string | null;
}
