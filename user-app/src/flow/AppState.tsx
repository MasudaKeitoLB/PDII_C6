import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { findAdmin } from '../lib/admin';
import { dayKey, now } from '../lib/dates';
import { readJson, writeJson } from '../lib/storage';
import { ensureSampleData, findUser, getStore, recordSteps, useStore } from '../lib/store';
import type { AdminAccount, AppUser, Birthday, Gender, ShareConsent } from '../lib/types';
import { isRouteId, loginSteps, registerSteps, routeInfo, type RouteId } from './routes';

/** 登録の途中の入力。途中で閉じても 続きから入力できるよう 端末に残す */
export interface RegistrationDraft {
  name: string;
  birthday: Birthday;
  letter: string | null;
  nickname: string;
  gender: Gender | null;
  heightCm: number | null;
  weightKg: number | null;
  dailyGoalSteps: number;
  shareConsent: ShareConsent | null;
}

export interface LoginDraft {
  name: string;
  birthday: Birthday;
  letter: string | null;
}

/**
 * 歩きスマホ防止（M-11）の状態。
 * walking：歩いている（画面を操作できない）／stopping：止まった（少し待ってから使えるようになる）
 */
export type WalkState = 'idle' | 'walking' | 'stopping';

const EMPTY_BIRTHDAY: Birthday = { year: null, month: null, day: null };

export const EMPTY_REGISTRATION: RegistrationDraft = {
  name: '',
  birthday: EMPTY_BIRTHDAY,
  letter: null,
  nickname: '',
  gender: null,
  heightCm: null,
  weightKg: null,
  dailyGoalSteps: 5000,
  shareConsent: null,
};

const EMPTY_LOGIN: LoginDraft = { name: '', birthday: EMPTY_BIRTHDAY, letter: null };

const DRAFT_KEY = 'hoho.registrationDraft';
const LETTER_SETTING_KEY = 'hoho.demo.useLoginLetter';
const ADMIN_USER_KEY = 'hoho.admin.selectedUser';

/** 止まってから 使えるようになるまで（N-10：試作で決める） */
export const UNLOCK_DELAY_MS = 2500;
/** デモで歩いているときに 0.5秒ごとに ふえる歩数 */
const DEMO_STEPS_PER_TICK = 40;

interface AppState {
  route: RouteId;
  navigate: (route: RouteId) => void;
  registration: RegistrationDraft;
  updateRegistration: (patch: Partial<RegistrationDraft>) => void;
  resetRegistration: () => void;
  loginDraft: LoginDraft;
  updateLogin: (patch: Partial<LoginDraft>) => void;
  resetLogin: () => void;
  /** この端末でログインしている利用者 */
  user: AppUser | null;
  /** 管理者画面にログインしている アカウント */
  admin: AdminAccount | null;
  /** 管理者画面で 開いている利用者 */
  adminUserId: string | null;
  setAdminUserId: (id: string | null) => void;
  walk: WalkState;
  startWalking: () => void;
  stopWalking: () => void;
  /** デモ用：アプリを閉じている間に 歩いたことにして、開いたときの成果を出す */
  walkInBackground: (steps: number) => void;
  /** L-03「合言葉の文字」を使うか（16章：ローマ字1文字を入れることに決定。デモでは切りかえられる） */
  useLoginLetter: boolean;
  setUseLoginLetter: (value: boolean) => void;
  registerOrder: RouteId[];
  loginOrder: RouteId[];
}

const AppStateContext = createContext<AppState | null>(null);

/** 端末に残っていた 登録の途中の入力を読む。古い形や こわれた値は 空にもどす */
function restoreDraft(): RegistrationDraft {
  const saved = readJson<unknown>(DRAFT_KEY, null);
  if (typeof saved !== 'object' || saved === null) return EMPTY_REGISTRATION;
  const d = saved as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const b = (typeof d.birthday === 'object' && d.birthday !== null ? d.birthday : {}) as Record<string, unknown>;
  const consent = d.shareConsent as Partial<ShareConsent> | null | undefined;
  return {
    name: typeof d.name === 'string' ? d.name : '',
    birthday: { year: num(b.year), month: num(b.month), day: num(b.day) },
    letter: typeof d.letter === 'string' && /^[A-Z]$/.test(d.letter) ? d.letter : null,
    nickname: typeof d.nickname === 'string' ? d.nickname : '',
    gender: d.gender === 'female' || d.gender === 'male' || d.gender === 'unanswered' ? d.gender : null,
    heightCm: num(d.heightCm),
    weightKg: num(d.weightKg),
    dailyGoalSteps: num(d.dailyGoalSteps) ?? EMPTY_REGISTRATION.dailyGoalSteps,
    shareConsent:
      typeof consent === 'object' && consent !== null && typeof consent.agreed === 'boolean' && typeof consent.decidedAt === 'string'
        ? { agreed: consent.agreed, decidedAt: consent.decidedAt }
        : null,
  };
}

function routeFromHash(fallback: RouteId): RouteId {
  const id = window.location.hash.replace(/^#/, '');
  return isRouteId(id) ? id : fallback;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.users.find((u) => u.id === s.sessionUserId) ?? null);
  const admin = useStore((s) => findAdmin(s.adminSessionId));
  const [route, setRoute] = useState<RouteId>(() => routeFromHash(getStore().sessionUserId ? 'home' : 'start'));
  const [registration, setRegistration] = useState<RegistrationDraft>(restoreDraft);
  const [loginDraft, setLoginDraft] = useState<LoginDraft>(EMPTY_LOGIN);
  const [useLoginLetter, setUseLoginLetterState] = useState<boolean>(() => readJson<unknown>(LETTER_SETTING_KEY, true) !== false);
  const [adminUserId, setAdminUserIdState] = useState<string | null>(() => {
    const saved = readJson<unknown>(ADMIN_USER_KEY, null);
    return typeof saved === 'string' ? saved : null;
  });
  const [walk, setWalk] = useState<WalkState>('idle');
  const walkTimer = useRef<number | null>(null);
  /** 歩いている（歩数を記録している）利用者 */
  const walkingUserId = useRef<string | null>(null);
  const unlockTimer = useRef<number | null>(null);

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash('start'));
    window.addEventListener('hashchange', onHashChange);
    // 日がかわったら サンプルの利用者を 作りなおす
    let today = dayKey(now());
    const dayTimer = window.setInterval(() => {
      if (dayKey(now()) !== today) {
        today = dayKey(now());
        ensureSampleData(now());
      }
    }, 60_000);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.clearInterval(dayTimer);
    };
  }, []);

  const navigate = useCallback((next: RouteId) => {
    if (window.location.hash === `#${next}`) return;
    window.location.hash = next;
  }, []);

  const updateRegistration = useCallback((patch: Partial<RegistrationDraft>) => {
    setRegistration((prev) => {
      const next = { ...prev, ...patch };
      writeJson(DRAFT_KEY, next);
      return next;
    });
  }, []);

  const resetRegistration = useCallback(() => {
    setRegistration(EMPTY_REGISTRATION);
    writeJson(DRAFT_KEY, EMPTY_REGISTRATION);
  }, []);

  const updateLogin = useCallback((patch: Partial<LoginDraft>) => setLoginDraft((prev) => ({ ...prev, ...patch })), []);
  const resetLogin = useCallback(() => setLoginDraft(EMPTY_LOGIN), []);

  const setUseLoginLetter = useCallback((value: boolean) => {
    setUseLoginLetterState(value);
    writeJson(LETTER_SETTING_KEY, value);
  }, []);

  const setAdminUserId = useCallback((id: string | null) => {
    setAdminUserIdState(id);
    writeJson(ADMIN_USER_KEY, id);
  }, []);

  const clearWalkTimers = () => {
    if (walkTimer.current !== null) window.clearInterval(walkTimer.current);
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
    walkTimer.current = null;
    unlockTimer.current = null;
  };

  const startWalking = useCallback(() => {
    const id = getStore().sessionUserId;
    if (!id) return;
    clearWalkTimers();
    setWalk('walking');
    // 本実装では スマホのセンサーが 歩いていることを知らせる。デモでは 0.5秒ごとに歩数をふやす
    walkingUserId.current = id;
    walkTimer.current = window.setInterval(() => recordSteps(id, DEMO_STEPS_PER_TICK, now()), 500);
  }, []);

  const stopWalking = useCallback(() => {
    clearWalkTimers();
    setWalk((w) => (w === 'idle' ? 'idle' : 'stopping'));
    unlockTimer.current = window.setTimeout(() => {
      unlockTimer.current = null;
      setWalk('idle');
      // 立ち止まって開くと、歩いた分の冒険の成果が見られる（M-07）。
      // 確認パネルから 管理者画面などを見ているときは 画面を かえない
      const current = findUser(getStore().sessionUserId);
      const onApp = routeInfo(routeFromHash('start')).group === 'app';
      if (current?.game.pending && onApp) navigate('adventure-result');
    }, UNLOCK_DELAY_MS);
  }, [navigate]);

  const walkInBackground = useCallback(
    (steps: number) => {
      const id = getStore().sessionUserId;
      if (!id) return;
      recordSteps(id, steps, now());
      navigate('adventure-result');
    },
    [navigate],
  );

  // ログアウトしたときや ほかの人に かわったときは 歩いている状態を やめる（前の人に歩数を入れない）
  const userId = user?.id ?? null;
  useEffect(() => {
    if (walk !== 'idle' && userId !== walkingUserId.current) {
      clearWalkTimers();
      walkingUserId.current = null;
      setWalk('idle');
    }
  }, [userId, walk]);

  useEffect(() => () => clearWalkTimers(), []);

  const value = useMemo<AppState>(
    () => ({
      route,
      navigate,
      registration,
      updateRegistration,
      resetRegistration,
      loginDraft,
      updateLogin,
      resetLogin,
      user,
      admin,
      adminUserId,
      setAdminUserId,
      walk,
      startWalking,
      stopWalking,
      walkInBackground,
      useLoginLetter,
      setUseLoginLetter,
      registerOrder: registerSteps(useLoginLetter),
      loginOrder: loginSteps(useLoginLetter),
    }),
    [route, navigate, registration, updateRegistration, resetRegistration, loginDraft, updateLogin, resetLogin, user, admin, adminUserId, setAdminUserId, walk, startWalking, stopWalking, walkInBackground, useLoginLetter, setUseLoginLetter],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('AppStateProvider の中で使ってください');
  return state;
}

/** ログインしている利用者（ログインしていない画面では 使わない） */
export function useUser(): AppUser {
  const { user } = useAppState();
  if (!user) throw new Error('ログインしている利用者がいません');
  return user;
}

/** 手順の中での 位置・前後の画面・進み具合 */
export function useStep(route: RouteId, order: RouteId[], before: RouteId, after: RouteId) {
  const index = order.indexOf(route);
  return {
    progress: index >= 0 ? { current: index + 1, total: order.length } : undefined,
    prev: index > 0 ? order[index - 1] : before,
    next: index >= 0 && index < order.length - 1 ? order[index + 1] : after,
    isLast: index === order.length - 1,
  };
}
