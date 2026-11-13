// 試作の「サーバー」。利用者情報・日ごとの記録・ゲームの記録・共有の記録を 1か所に置き、
// 利用者アプリと管理者画面が 同じデータを使う（3章「同じデータを使う」）。
// 試作ではブラウザの中に保存する。本実装では この関数をサーバーのAPIに置きかえる。

import { clearVerifiedAdmin } from './staffAuth';
import { useSyncExternalStore } from 'react';
import { dayKey, now as currentTime } from './dates';
import { clearPending, newGame, walk } from './game';
import { buildSampleUsers, SAMPLE_CARE_MANAGER_ID, SAMPLE_FACILITY_ID, sampleHistory } from './sampleData';
import { readJson, removeKey, writeJson } from './storage';
import type { AppUser, LoginCredentials, Profile, ShareTarget, TextSize } from './types';

const STORE_KEY = 'hoho.v2';
const OLD_USERS_KEY = 'hoho.users';
const OLD_SESSION_KEY = 'hoho.session';

export interface StoreData {
  version: 2;
  users: AppUser[];
  /** この端末でログインしている利用者（M-02：次から入力しなくても使える） */
  sessionUserId: string | null;
  /** この端末でログインしている管理者側のアカウント */
  adminSessionId: string | null;
  /** サンプルの利用者を作った日 */
  sampleDay: string | null;
}

const listeners = new Set<() => void>();
let state: StoreData = load();

/** 全角・半角のちがいと 姓と名のあいだの空白を そろえる（U-01「あけても あけなくても 大丈夫」） */
export function normalizeName(name: string): string {
  return name.normalize('NFKC').replace(/\s+/g, '');
}

function isAppUser(value: unknown): value is AppUser {
  if (typeof value !== 'object' || value === null) return false;
  const u = value as Partial<AppUser>;
  const b = u.birthday;
  return (
    typeof u.id === 'string' &&
    typeof u.name === 'string' &&
    typeof u.nickname === 'string' &&
    typeof b === 'object' &&
    b !== null &&
    typeof b.year === 'number' &&
    typeof b.month === 'number' &&
    typeof b.day === 'number' &&
    (u.gender === 'female' || u.gender === 'male' || u.gender === 'unanswered') &&
    typeof u.heightCm === 'number' &&
    typeof u.weightKg === 'number' &&
    typeof u.dailyGoalSteps === 'number' &&
    typeof u.shares === 'object' &&
    u.shares !== null &&
    typeof u.shares.facility?.agreed === 'boolean' &&
    typeof u.shares.careManager?.agreed === 'boolean' &&
    typeof u.days === 'object' &&
    u.days !== null &&
    typeof u.game === 'object' &&
    u.game !== null &&
    typeof u.game.level === 'number'
  );
}

/** 前の試作（v1）で登録した人を 新しい形にうつす */
function migrateV1(): AppUser[] {
  const old = readJson<unknown>(OLD_USERS_KEY, []);
  if (!Array.isArray(old)) return [];
  return old.flatMap((o) => {
    if (typeof o !== 'object' || o === null) return [];
    const u = o as Record<string, unknown>;
    const b = u.birthday as AppUser['birthday'] | undefined;
    if (typeof u.id !== 'string' || typeof u.name !== 'string' || !b || typeof b.year !== 'number') return [];
    const agreed = Boolean((u.shareConsent as { agreed?: boolean } | undefined)?.agreed);
    const at = typeof u.registeredAt === 'string' ? u.registeredAt : new Date().toISOString();
    const profile: Profile = {
      name: u.name,
      birthday: b,
      letter: typeof u.letter === 'string' ? u.letter : null,
      nickname: typeof u.nickname === 'string' ? u.nickname : u.name,
      gender: u.gender === 'male' || u.gender === 'unanswered' ? u.gender : 'female',
      heightCm: typeof u.heightCm === 'number' ? u.heightCm : 155,
      weightKg: typeof u.weightKg === 'number' ? u.weightKg : 52,
      dailyGoalSteps: typeof u.dailyGoalSteps === 'number' ? u.dailyGoalSteps : 5000,
    };
    return [newAppUser(profile, agreed, new Date(at), u.id)];
  });
}

function load(): StoreData {
  const saved = readJson<unknown>(STORE_KEY, null);
  if (typeof saved === 'object' && saved !== null && (saved as StoreData).version === 2) {
    const s = saved as StoreData;
    const users = Array.isArray(s.users) ? s.users.filter(isAppUser) : [];
    return {
      version: 2,
      users,
      // いない人のセッションは 残さない（はじめの画面から やりなおせるように）
      sessionUserId: typeof s.sessionUserId === 'string' && users.some((u) => u.id === s.sessionUserId) ? s.sessionUserId : null,
      adminSessionId: typeof s.adminSessionId === 'string' ? s.adminSessionId : null,
      sampleDay: typeof s.sampleDay === 'string' ? s.sampleDay : null,
    };
  }
  const migrated = migrateV1();
  const oldSession = readJson<unknown>(OLD_SESSION_KEY, null);
  return {
    version: 2,
    users: migrated,
    sessionUserId: typeof oldSession === 'string' && migrated.some((u) => u.id === oldSession) ? oldSession : null,
    adminSessionId: null,
    sampleDay: null,
  };
}

function commit(next: StoreData) {
  state = next;
  writeJson(STORE_KEY, next);
  listeners.forEach((l) => l());
}

export function getStore(): StoreData {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 画面から データを読む（変わったら 画面も かわる） */
export function useStore<T>(selector: (s: StoreData) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export function findUser(id: string | null | undefined): AppUser | null {
  if (!id) return null;
  return state.users.find((u) => u.id === id) ?? null;
}

/** サンプルの利用者を 今日の日付で用意する（日がかわったら 作りなおす。新しく登録した人は そのまま） */
export function ensureSampleData(at: Date = currentTime()): void {
  const today = dayKey(at);
  if (state.sampleDay === today && state.users.some((u) => u.sample)) return;
  // この端末でログインしているサンプルの人は 歩いた記録や変更を 消さないよう そのまま残す
  const keep = state.users.find((u) => u.sample && u.id === state.sessionUserId);
  const samples = buildSampleUsers(at).map((u) => (keep && u.id === keep.id ? keep : u));
  const others = state.users.filter((u) => !u.sample);
  commit({ ...state, users: [...samples, ...others], sampleDay: today });
}

function newAppUser(profile: Profile, agreed: boolean, at: Date, id?: string): AppUser {
  const iso = at.toISOString();
  return {
    ...profile,
    name: profile.name.trim(),
    nickname: profile.nickname.trim(),
    id: id ?? `u_${at.getTime().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    kana: null,
    careLevel: null,
    facilityId: SAMPLE_FACILITY_ID,
    // 記録を見せる相手は U-08 で案内した 施設と 担当のケアマネージャー
    careManagerId: SAMPLE_CARE_MANAGER_ID,
    shares: { facility: { agreed, changedAt: iso }, careManager: { agreed, changedAt: iso } },
    textSize: 'normal',
    days: {},
    lastSyncAt: iso,
    game: newGame(),
    registeredAt: iso,
    sample: false,
  };
}

function updateUser(id: string, fn: (u: AppUser) => AppUser): AppUser | null {
  let updated: AppUser | null = null;
  const users = state.users.map((u) => {
    if (u.id !== id) return u;
    updated = fn(u);
    return updated;
  });
  if (updated) commit({ ...state, users });
  return updated;
}

// ---------- 利用者アプリ ----------

export function registerAppUser(profile: Profile, agreed: boolean, at: Date = currentTime()): AppUser {
  const user = newAppUser(profile, agreed, at);
  commit({ ...state, users: [...state.users, user], sessionUserId: user.id });
  return user;
}

function sameBirthday(a: LoginCredentials['birthday'], b: LoginCredentials['birthday']) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * 名前・誕生日（・文字）が すべて合う人がいれば ログインする。
 * どれが合わなかったかは 返さない（なりすまし対策 N-13）。同じ人が登録しなおしたときは 新しい登録で入る。
 */
export function loginAppUser(credentials: LoginCredentials): AppUser | null {
  const name = normalizeName(credentials.name);
  const user = [...state.users]
    .reverse()
    .find(
      (u) =>
        normalizeName(u.name) === name &&
        sameBirthday(u.birthday, credentials.birthday) &&
        (credentials.letter === null || u.letter === null || u.letter === credentials.letter),
    );
  if (!user) return null;
  commit({ ...state, sessionUserId: user.id });
  return user;
}

export function logoutAppUser(): void {
  commit({ ...state, sessionUserId: null });
}

export function loginAs(id: string): void {
  if (findUser(id)) commit({ ...state, sessionUserId: id });
}

/** 歩数を記録する（M-03）。日ごとの記録・最終受信・冒険が すすむ */
export function recordSteps(id: string, steps: number, at: Date = currentTime()): AppUser | null {
  if (steps <= 0) return findUser(id);
  return updateUser(id, (u) => {
    const key = dayKey(at);
    return {
      ...u,
      days: { ...u.days, [key]: (u.days[key] ?? 0) + steps },
      lastSyncAt: at.toISOString(),
      game: walk(u.game, steps),
    };
  });
}

/** 冒険の成果を見おわった */
export function finishAdventure(id: string): void {
  updateUser(id, (u) => ({ ...u, game: clearPending(u.game) }));
}

export function setTextSize(id: string, textSize: TextSize): void {
  updateUser(id, (u) => ({ ...u, textSize }));
}

/** 記録を見せる相手ごとに 見せる／やめる（M-14・N-14：いつでもやめられる） */
export function setShare(id: string, target: ShareTarget, agreed: boolean, at: Date = currentTime()): void {
  updateUser(id, (u) => ({ ...u, shares: { ...u.shares, [target]: { agreed, changedAt: at.toISOString() } } }));
}

/** 1日の目標歩数（M-19）。本人も 管理者側も 変えられる */
export function setGoal(id: string, steps: number): void {
  updateUser(id, (u) => ({ ...u, dailyGoalSteps: steps }));
}

export function updateProfile(id: string, patch: Partial<Pick<AppUser, 'name' | 'nickname' | 'heightCm' | 'weightKg'>>): void {
  updateUser(id, (u) => ({ ...u, ...patch }));
}

// ---------- 管理者画面 ----------

export function setAdminSession(accountId: string | null): void {
  if (accountId === null) clearVerifiedAdmin();
  commit({ ...state, adminSessionId: accountId });
}

// ---------- デモ用 ----------

/** 新しく登録した人に 30日分の記録を入れる（グラフを見るため） */
export function fillSampleHistory(id: string, at: Date = currentTime()): void {
  updateUser(id, (u) => ({ ...u, days: { ...sampleHistory(u.dailyGoalSteps, u.id, at), ...u.days } }));
}

/** この端末に保存したデータを すべて消して、サンプルだけに もどす */
export function resetAll(at: Date = currentTime()): void {
  removeKey(OLD_USERS_KEY);
  removeKey(OLD_SESSION_KEY);
  commit({ version: 2, users: buildSampleUsers(at), sessionUserId: null, adminSessionId: null, sampleDay: dayKey(at) });
}
