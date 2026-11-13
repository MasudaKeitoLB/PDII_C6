// 管理者画面（M-15〜M-19）。施設のスタッフと ケアマネージャーは それぞれ専用のアカウントで入る。
// 見られるのは、本人が共有に同意した利用者だけ（N-14）。ケアマネージャーには 担当の利用者だけを出す（M-16）。

import { verifiedAdmin } from './staffAuth';
import { addDays, ageOn, dayKey, lastDays, startOfDay } from './dates';
import { caloriesKcal, distanceKm } from './health';
import { OTHER_CARE_MANAGER_ID, SAMPLE_CARE_MANAGER_ID, SAMPLE_FACILITY_ID } from './sampleData';
import { normalizeName } from './store';
import type { AdminAccount, AppUser } from './types';

/** 運営者が発行した アカウント（デモ用。パスワードは確認用パネルに出す） */
export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: SAMPLE_CARE_MANAGER_ID,
    password: 'hoho-2026',
    name: '佐藤 恵子',
    role: 'careManager',
    organization: 'ケアマネージャー',
    facilityId: SAMPLE_FACILITY_ID,
  },
  {
    id: 'temari-tamura01',
    password: 'hoho-2026',
    name: '田村 美咲',
    role: 'staff',
    organization: 'てまりフィットネス 〇〇店',
    facilityId: SAMPLE_FACILITY_ID,
  },
];

export const ROLE_LABEL: Record<AdminAccount['role'], string> = {
  staff: '施設スタッフ',
  careManager: 'ケアマネージャー',
};

/** 担当ケアマネージャーの名前（AP-03 の見出しに出す）。サンプルには アカウントのないケアマネージャーもいる */
const CARE_MANAGER_NAMES: Record<string, string> = {
  [SAMPLE_CARE_MANAGER_ID]: '佐藤 恵子',
  [OTHER_CARE_MANAGER_ID]: '木村 和也',
};

export function careManagerName(id: string | null): string | null {
  return id ? (CARE_MANAGER_NAMES[id] ?? null) : null;
}

export function findAdmin(id: string | null): AdminAccount | null {
  return verifiedAdmin(id);
}

/** そのアカウントで 見られる利用者 */
export function visibleUsers(account: AdminAccount, users: AppUser[]): AppUser[] {
  return users.filter((u) =>
    account.role === 'careManager'
      ? u.careManagerId === account.id && u.shares.careManager.agreed
      : u.facilityId === account.facilityId && u.shares.facility.agreed,
  );
}

export function canSeeUser(account: AdminAccount, user: AppUser): boolean {
  return visibleUsers(account, [user]).length === 1;
}

export interface UserSummary {
  user: AppUser;
  age: number;
  todaySteps: number;
  goal: number;
  /** 目標に対しての割合（％） */
  ratio: number;
  /** 先週の同じ曜日との差（9章 確認4 の案）。今日の記録が届いていないときは null */
  diffFromLastWeek: number | null;
  lastSyncAt: Date | null;
  /** 今日の記録が まだ届いていない */
  notReceivedToday: boolean;
  distanceKm: number;
  kcal: number;
}

export function summarize(user: AppUser, now: Date): UserSummary {
  const today = startOfDay(now);
  const todaySteps = user.days[dayKey(today)] ?? 0;
  const lastSyncAt = user.lastSyncAt ? new Date(user.lastSyncAt) : null;
  const notReceivedToday = !lastSyncAt || lastSyncAt < today;
  const lastWeek = user.days[dayKey(addDays(today, -7))];
  return {
    user,
    age: ageOn(user.birthday, now),
    todaySteps,
    goal: user.dailyGoalSteps,
    ratio: user.dailyGoalSteps > 0 ? Math.round((todaySteps / user.dailyGoalSteps) * 100) : 0,
    diffFromLastWeek: notReceivedToday || lastWeek === undefined ? null : todaySteps - lastWeek,
    lastSyncAt,
    notReceivedToday,
    distanceKm: distanceKm(todaySteps, user.heightCm),
    kcal: caloriesKcal(todaySteps, user.weightKg),
  };
}

export type AdminSort = 'fewest' | 'most' | 'name' | 'ratio';

export const SORT_LABEL: Record<AdminSort, string> = {
  fewest: '歩数が少ない順',
  most: '歩数が多い順',
  ratio: '目標に対して低い順',
  name: '名前順',
};

const reading = (s: UserSummary) => s.user.kana ?? s.user.name;

export function sortSummaries(list: UserSummary[], sort: AdminSort): UserSummary[] {
  const sorted = [...list];
  switch (sort) {
    case 'fewest':
      return sorted.sort((a, b) => a.todaySteps - b.todaySteps);
    case 'most':
      return sorted.sort((a, b) => b.todaySteps - a.todaySteps);
    case 'ratio':
      return sorted.sort((a, b) => a.ratio - b.ratio);
    case 'name':
      return sorted.sort((a, b) => reading(a).localeCompare(reading(b), 'ja'));
  }
}

/** 介護レベル（管理者側が登録する案）。登録がない人は「なし」（AP-02 の 加藤 博さん） */
export const careLevelLabel = (user: AppUser) => user.careLevel ?? 'なし';

/** 年齢・介護レベル の表示 */
export function ageAndCare(s: UserSummary): string {
  return `${s.age}歳・${careLevelLabel(s.user)}`;
}

/** カタカナを ひらがなに そろえる（「ヤマダ」でも「やまだ」でも さがせる） */
const toHiragana = (text: string) => text.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

/** 名前でさがす（AP-02）。漢字・ひらがな・カタカナのどれでも、空白は気にしない */
export function matchesName(user: AppUser, query: string): boolean {
  const q = toHiragana(normalizeName(query));
  if (q === '') return true;
  return normalizeName(user.name).includes(q) || (user.kana !== null && toHiragana(normalizeName(user.kana)).includes(q));
}

export interface DayRecord {
  date: Date;
  steps: number;
  distanceKm: number;
  kcal: number;
}

/** 測定結果（AM-03・AP-03）：今日をふくむ n 日分の 日ごとの記録（古い日から） */
export function dayRecords(user: AppUser, today: Date, n: number): DayRecord[] {
  return lastDays(today, n).map((date) => {
    const steps = user.days[dayKey(date)] ?? 0;
    return { date, steps, distanceKm: distanceKm(steps, user.heightCm), kcal: caloriesKcal(steps, user.weightKg) };
  });
}
