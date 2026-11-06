import { useCallback, useMemo, useState } from 'react';
import { useAppState } from '../../flow/AppState';
import { canSeeUser, summarize, visibleUsers, type UserSummary } from '../../lib/admin';
import { now } from '../../lib/dates';
import { getStore, useStore } from '../../lib/store';
import type { AdminAccount, AppUser } from '../../lib/types';

/**
 * 利用者の一覧（AM-02・AP-02）のデータ。
 * 一覧を開いたとき・「更新」「最新にする」を押したときの データを出し、その時点を表示する（N-19）。
 */
export function useAdminSnapshot(account: AdminAccount) {
  const take = useCallback(() => {
    const at = now();
    return { at, list: visibleUsers(account, getStore().users).map((u) => summarize(u, at)) };
  }, [account]);
  const [snapshot, setSnapshot] = useState(take);
  const refresh = useCallback(() => setSnapshot(take()), [take]);
  return { fetchedAt: snapshot.at, list: snapshot.list, refresh };
}

/**
 * 測定結果（AM-03・AP-03）で見ている利用者。
 * 本人が共有をやめたら すぐに見られなくなる（N-14）ので、いつも 今のデータで確かめる。
 */
export function useAdminSelectedUser(): { account: AdminAccount; user: AppUser | null; summary: UserSummary | null } {
  const { admin, adminUserId } = useAppState();
  if (!admin) throw new Error('管理者のログインが 必要です');
  const user = useStore((s) => s.users.find((u) => u.id === adminUserId) ?? null);
  const visible = user && canSeeUser(admin, user) ? user : null;
  const summary = useMemo(() => (visible ? summarize(visible, now()) : null), [visible]);
  return { account: admin, user: visible, summary };
}

/** 並び順・期間などの おぼえ（ページを開いている間だけ。読みこみなおすと はじめにもどる） */
const remembered = new Map<string, unknown>();

/** 一覧の並び順・期間などを このページの間 おぼえておく（一覧→詳しく→一覧 と もどっても そのまま） */
export function useRemembered<T>(key: string, initial: T, isValid: (v: unknown) => v is T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const saved = remembered.get(key);
    return isValid(saved) ? saved : initial;
  });
  const set = useCallback(
    (v: T) => {
      setValue(v);
      remembered.set(key, v);
    },
    [key],
  );
  return [value, set];
}

export const isPeriod = (v: unknown): v is 'week' | 'month' => v === 'week' || v === 'month';
