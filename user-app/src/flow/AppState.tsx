import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { currentUser } from '../lib/auth';
import { readJson, writeJson } from '../lib/storage';
import type { Birthday, Gender, RegisteredUser, ShareConsent } from '../lib/types';
import { isRouteId, loginSteps, registerSteps, type RouteId } from './routes';

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

interface AppState {
  route: RouteId;
  navigate: (route: RouteId) => void;
  registration: RegistrationDraft;
  updateRegistration: (patch: Partial<RegistrationDraft>) => void;
  resetRegistration: () => void;
  loginDraft: LoginDraft;
  updateLogin: (patch: Partial<LoginDraft>) => void;
  resetLogin: () => void;
  user: RegisteredUser | null;
  setUser: (user: RegisteredUser | null) => void;
  /** L-03「合言葉の文字」の案を使うか（チームで確認中・9章 確認2） */
  useLoginLetter: boolean;
  setUseLoginLetter: (value: boolean) => void;
  registerOrder: RouteId[];
  loginOrder: RouteId[];
}

const AppStateContext = createContext<AppState | null>(null);

function routeFromHash(fallback: RouteId): RouteId {
  const id = window.location.hash.replace(/^#/, '');
  return isRouteId(id) ? id : fallback;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RegisteredUser | null>(() => currentUser());
  const [route, setRoute] = useState<RouteId>(() => routeFromHash(user ? 'home' : 'start'));
  const [registration, setRegistration] = useState<RegistrationDraft>(() => ({
    ...EMPTY_REGISTRATION,
    ...readJson<Partial<RegistrationDraft>>(DRAFT_KEY, {}),
  }));
  const [loginDraft, setLoginDraft] = useState<LoginDraft>(EMPTY_LOGIN);
  const [useLoginLetter, setUseLoginLetterState] = useState<boolean>(() => readJson(LETTER_SETTING_KEY, true));

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash('start'));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
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
      setUser,
      useLoginLetter,
      setUseLoginLetter,
      registerOrder: registerSteps(useLoginLetter),
      loginOrder: loginSteps(useLoginLetter),
    }),
    [route, navigate, registration, updateRegistration, resetRegistration, loginDraft, updateLogin, resetLogin, user, useLoginLetter, setUseLoginLetter],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('AppStateProvider の中で使ってください');
  return state;
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
