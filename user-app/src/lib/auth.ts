// 利用者の登録とログイン（M-01, M-02）。
// 試作では 端末の中に保存する。本実装では サーバーのAPIに置きかえる（関数の形は そのまま使える）。

import { readJson, removeKey, writeJson } from './storage';
import type { LoginCredentials, Profile, RegisteredUser, ShareConsent } from './types';

const USERS_KEY = 'hoho.users';
const SESSION_KEY = 'hoho.session';

/** 全角・半角のちがいと 姓と名のあいだの空白を そろえる（U-01「あけても あけなくても 大丈夫」） */
export function normalizeName(name: string): string {
  return name.normalize('NFKC').replace(/\s+/g, '');
}

function sameBirthday(a: LoginCredentials['birthday'], b: LoginCredentials['birthday']) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function loadUsers(): RegisteredUser[] {
  return readJson<RegisteredUser[]>(USERS_KEY, []);
}

export async function registerUser(profile: Profile, shareConsent: ShareConsent): Promise<RegisteredUser> {
  const user: RegisteredUser = {
    ...profile,
    name: profile.name.trim(),
    nickname: profile.nickname.trim(),
    id: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    shareConsent,
    registeredAt: new Date().toISOString(),
  };
  writeJson(USERS_KEY, [...loadUsers(), user]);
  writeJson(SESSION_KEY, user.id);
  return user;
}

/**
 * 名前・誕生日（・文字）が すべて合う人がいれば ログインする。
 * どれが合わなかったかは 返さない（なりすまし対策 N-13）。
 */
export async function login(credentials: LoginCredentials): Promise<RegisteredUser | null> {
  const name = normalizeName(credentials.name);
  const user = loadUsers().find(
    (u) =>
      normalizeName(u.name) === name &&
      sameBirthday(u.birthday, credentials.birthday) &&
      (credentials.letter === null || u.letter === null || u.letter === credentials.letter),
  );
  if (!user) return null;
  writeJson(SESSION_KEY, user.id);
  return user;
}

/** 一度ログインした端末では 次から入力しなくても使える（M-02 案） */
export function currentUser(): RegisteredUser | null {
  const id = readJson<string | null>(SESSION_KEY, null);
  if (!id) return null;
  return loadUsers().find((u) => u.id === id) ?? null;
}

export function logout(): void {
  removeKey(SESSION_KEY);
}

export function hasRegisteredUsers(): boolean {
  return loadUsers().length > 0;
}

/** デモ用：この端末に保存した登録をすべて消す */
export function clearAllUsers(): void {
  removeKey(USERS_KEY);
  removeKey(SESSION_KEY);
}
