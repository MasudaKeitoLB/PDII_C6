import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { findAdmin } from '../lib/admin';
import { dayKey, now } from '../lib/dates';
import type { MotionSignal } from '../lib/motion';
import { checkMotionAccess, recheckMotionAccess, requestSensorPermissions, watchAccelerometer, type MotionAccess } from '../lib/permissions';
import { readJson, writeJson } from '../lib/storage';
import { ensureSampleData, findUser, getStore, recordSteps, useStore } from '../lib/store';
import type { AdminAccount, AppUser, Birthday, Gender, ShareConsent } from '../lib/types';
import { isRouteId, loginSteps, registerSteps, routeInfo, type RouteId } from './routes';
import { useStepSensor } from './useStepSensor';

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
/** 体の動きで 歩数が これだけ ふえなければ 止まったとみなす（N-10：試作で決める） */
export const STOP_AFTER_MS = 2000;
/** 数えた歩数を まとめて記録する間隔（書くたびに 端末へ保存するので まとめる。N-18） */
export const FLUSH_INTERVAL_MS = 2000;
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
  staffAuthenticated: boolean;
  setStaffAuthenticated: (value: boolean) => void;
  /** この端末でログインしている利用者 */
  user: AppUser | null;
  /** 管理者画面にログインしている アカウント */
  admin: AdminAccount | null;
  /** 管理者画面で 開いている利用者 */
  adminUserId: string | null;
  setAdminUserId: (id: string | null) => void;
  walk: WalkState;
  /** デモ用：歩きはじめる（0.5秒ごとに 歩数を ふやす） */
  startWalking: () => void;
  stopWalking: () => void;
  /** デモ用：まとめて歩いて 止まったことにして、冒険の成果を出す */
  walkDemoSteps: (steps: number) => void;
  /** 体の動きで 歩数を数えられるか（M-03） */
  motionAccess: MotionAccess;
  /** ボタンを押したときに 許可を求める（iPhone）。ボタン操作の中で 最初に呼ぶ */
  allowMotion: () => Promise<MotionAccess>;
  /** 体の動きの値が 届いているか（Android で 設定を止めていると 届かない） */
  motionSignal: MotionSignal;
  /** 「もう一度 たしかめる」：許可を調べなおし、値が届くかを 見なおす。ボタン操作の中で 最初に呼ぶ */
  recheckMotion: () => Promise<MotionAccess>;
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
  const [staffAuthenticated, setStaffAuthenticated] = useState(false);
  const [useLoginLetter, setUseLoginLetterState] = useState<boolean>(() => readJson<unknown>(LETTER_SETTING_KEY, true) !== false);
  const [adminUserId, setAdminUserIdState] = useState<string | null>(() => {
    const saved = readJson<unknown>(ADMIN_USER_KEY, null);
    return typeof saved === 'string' ? saved : null;
  });
  const [walk, setWalkState] = useState<WalkState>('idle');
  /** センサーから呼ばれたときに いまの状態を読むため、state と同じ値を持っておく */
  const walkRef = useRef<WalkState>('idle');
  /** いまの歩行が 体の動き（sensor）か、確認パネルのボタン（demo）か */
  const walkSource = useRef<'sensor' | 'demo' | null>(null);
  const walkTimer = useRef<number | null>(null);
  /** 歩いている（歩数を記録している）利用者 */
  const walkingUserId = useRef<string | null>(null);
  const unlockTimer = useRef<number | null>(null);
  const stopTimer = useRef<number | null>(null);
  const flushTimer = useRef<number | null>(null);
  /** 数えたが まだ記録していない歩数 */
  const pendingSteps = useRef<{ userId: string | null; steps: number }>({ userId: null, steps: 0 });
  const [motionAccess, setMotionAccess] = useState<MotionAccess>('checking');
  const accessRef = useRef<MotionAccess>('checking');
  /** 調べた順番。開いたとき・ボタン・調べなおしが 重なったときに 古い結果を捨てる */
  const accessSeq = useRef(0);
  const [motionSignal, setMotionSignal] = useState<MotionSignal>('unknown');
  /** ふやすと センサーを聞きなおす（値が届くかを 最初から見なおす） */
  const [sensorRestart, setSensorRestart] = useState(0);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== 'hidden');

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

  const setWalk = (next: WalkState) => {
    walkRef.current = next;
    setWalkState(next);
  };

  const clearWalkTimers = () => {
    if (walkTimer.current !== null) window.clearInterval(walkTimer.current);
    if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
    if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
    if (flushTimer.current !== null) window.clearInterval(flushTimer.current);
    walkTimer.current = null;
    unlockTimer.current = null;
    stopTimer.current = null;
    flushTimer.current = null;
  };

  /** 数えた歩数を 記録する（歩いた人に入れる） */
  const flushSteps = () => {
    const { userId: id, steps } = pendingSteps.current;
    pendingSteps.current = { userId: null, steps: 0 };
    if (id && steps > 0) recordSteps(id, steps, now());
  };

  /** 立ち止まって開くと、歩いた分の冒険の成果が見られる（M-07）。管理者画面などを見ているときは 画面を かえない */
  const showResultIfAny = useCallback(() => {
    const current = findUser(getStore().sessionUserId);
    const onApp = routeInfo(routeFromHash('start')).group === 'app';
    if (current?.game.pending && onApp) navigate('adventure-result');
  }, [navigate]);

  const startWalking = useCallback(() => {
    const id = getStore().sessionUserId;
    if (!id) return;
    flushSteps();
    clearWalkTimers();
    walkSource.current = 'demo';
    setWalk('walking');
    // デモでは 0.5秒ごとに歩数をふやす（スマホでは 体の動きで数える）
    walkingUserId.current = id;
    walkTimer.current = window.setInterval(() => recordSteps(id, DEMO_STEPS_PER_TICK, now()), 500);
  }, []);

  const stopWalking = useCallback(() => {
    flushSteps();
    clearWalkTimers();
    setWalk(walkRef.current === 'idle' ? 'idle' : 'stopping');
    unlockTimer.current = window.setTimeout(() => {
      unlockTimer.current = null;
      walkSource.current = null;
      setWalk('idle');
      showResultIfAny();
    }, UNLOCK_DELAY_MS);
  }, [showResultIfAny]);

  const walkDemoSteps = useCallback(
    (steps: number) => {
      const id = getStore().sessionUserId;
      if (!id) return;
      recordSteps(id, steps, now());
      navigate('adventure-result');
    },
    [navigate],
  );

  /** 体の動きで 歩数が ふえたとき：歩いている状態にし、まとめて記録し、止まったら ロックを外す（M-03・M-11） */
  const onSensorSteps = useCallback(
    (steps: number) => {
      // 確認パネルのボタンで歩いている間（止まって 使えるようになるまでの間も）は、二重に数えないよう 体の動きの分を捨てる。
      // デモ（PC で確認する）ための動きなので、スマホで ボタンと体の動きを 同時に使うことは 考えない
      if (walkSource.current === 'demo') return;
      const id = getStore().sessionUserId;
      if (!id) return;
      if (pendingSteps.current.userId !== null && pendingSteps.current.userId !== id) flushSteps();
      pendingSteps.current = { userId: id, steps: pendingSteps.current.steps + steps };
      // 歩いている途中で ほかの人に かわったときも、いまの人の歩行として つづける
      walkingUserId.current = id;
      if (walkRef.current !== 'walking') {
        if (unlockTimer.current !== null) window.clearTimeout(unlockTimer.current);
        unlockTimer.current = null;
        walkSource.current = 'sensor';
        setWalk('walking');
      }
      if (flushTimer.current === null) flushTimer.current = window.setInterval(flushSteps, FLUSH_INTERVAL_MS);
      if (stopTimer.current !== null) window.clearTimeout(stopTimer.current);
      stopTimer.current = window.setTimeout(() => {
        stopTimer.current = null;
        stopWalking();
      }, STOP_AFTER_MS);
    },
    [stopWalking],
  );

  /** 調べた結果を 入れる（あとから始めた 調べが 先に終わっていたら 捨てる） */
  const applyAccess = useCallback(async (pending: Promise<MotionAccess>) => {
    const seq = ++accessSeq.current;
    const access = await pending;
    if (seq === accessSeq.current) {
      accessRef.current = access;
      setMotionAccess(access);
    }
    return access;
  }, []);

  // iPhone では ボタン操作の中で 最初に requestSensorPermissions を呼ぶ（その前に await を はさまない）
  const allowMotion = useCallback(() => applyAccess(requestSensorPermissions()), [applyAccess]);

  const recheckMotion = useCallback(() => {
    const pending = requestSensorPermissions();
    setMotionSignal('unknown');
    setSensorRestart((n) => n + 1);
    return applyAccess(pending);
  }, [applyAccess]);

  // 開いたときに 数えられるかを調べる（iPhone で まだ許可していなければ ボタンを出す）
  useEffect(() => {
    void applyAccess(checkMotionAccess());
    // StrictMode の2回目でも 番号が新しいほうだけが 入る
  }, [applyAccess]);

  /** ボタン操作なしで 調べなおす。調べなおさないときは 番号も進めない（先に始めた調べの結果を 捨てないため） */
  const recheckQuietly = useCallback(() => {
    const pending = recheckMotionAccess(accessRef.current);
    if (pending) void applyAccess(pending);
  }, [applyAccess]);

  // Android で サイトの設定（モーション センサー）を かえたら 調べなおす
  useEffect(() => watchAccelerometer(recheckQuietly), [recheckQuietly]);

  // 画面が隠れると 値が届かなくなる。数えた分を記録して、すぐに使えるようにもどす
  useEffect(() => {
    const onVisibility = () => {
      const visible = document.visibilityState !== 'hidden';
      setPageVisible(visible);
      if (!visible) {
        flushSteps();
        clearWalkTimers();
        walkSource.current = null;
        if (walkRef.current !== 'idle') setWalk('idle');
      } else {
        showResultIfAny();
        // 設定を直して もどってきたときのために 調べなおす
        recheckQuietly();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [showResultIfAny, recheckQuietly]);

  // ログアウトしたときや ほかの人に かわったときは 歩いている状態を やめる（前の人の歩数は 前の人に入れる）
  const userId = user?.id ?? null;
  useEffect(() => {
    if (walk !== 'idle' && userId !== walkingUserId.current) {
      flushSteps();
      clearWalkTimers();
      walkingUserId.current = null;
      walkSource.current = null;
      setWalk('idle');
    }
  }, [userId, walk]);

  // 数えるのは ログインしている間だけ。歩数を確かめる画面（チーム用）は 自分で数えるので ここでは数えない
  useStepSensor(motionAccess === 'granted' && userId !== null && pageVisible && routeInfo(route).group !== 'check', onSensorSteps, {
    onSignal: setMotionSignal,
    restartKey: sensorRestart,
  });

  useEffect(
    () => () => {
      flushSteps();
      clearWalkTimers();
    },
    [],
  );

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
      staffAuthenticated,
      setStaffAuthenticated,
      user,
      admin,
      adminUserId,
      setAdminUserId,
      walk,
      startWalking,
      stopWalking,
      walkDemoSteps,
      motionAccess,
      allowMotion,
      motionSignal,
      recheckMotion,
      useLoginLetter,
      setUseLoginLetter,
      registerOrder: registerSteps(useLoginLetter),
      loginOrder: loginSteps(useLoginLetter),
    }),
    [route, navigate, registration, updateRegistration, resetRegistration, loginDraft, updateLogin, resetLogin, staffAuthenticated, user, admin, adminUserId, setAdminUserId, walk, startWalking, stopWalking, walkDemoSteps, motionAccess, allowMotion, motionSignal, recheckMotion, useLoginLetter, setUseLoginLetter],
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
