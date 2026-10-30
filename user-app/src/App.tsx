import { useEffect, useState } from 'react';
import { DemoPanel } from './demo/DemoPanel';
import { DeviceFrame } from './demo/DeviceFrame';
import { useAppState } from './flow/AppState';
import { ALL_ROUTES, type RouteId } from './flow/routes';
import { HomePlaceholder } from './screens/HomePlaceholder';
import { LoginBirthdayScreen } from './screens/login/LoginBirthdayScreen';
import { LoginLetterScreen } from './screens/login/LoginLetterScreen';
import { LoginNameScreen } from './screens/login/LoginNameScreen';
import { BirthdayScreen } from './screens/register/BirthdayScreen';
import { HeightScreen, WeightScreen } from './screens/register/BodyScreens';
import { GenderScreen } from './screens/register/GenderScreen';
import { GoalScreen } from './screens/register/GoalScreen';
import { LetterScreen } from './screens/register/LetterScreen';
import { NameScreen } from './screens/register/NameScreen';
import { NicknameScreen } from './screens/register/NicknameScreen';
import { PermissionScreen } from './screens/register/PermissionScreen';
import { ReadyScreen } from './screens/register/ReadyScreen';
import { ShareScreen } from './screens/register/ShareScreen';
import { StartScreen } from './screens/register/StartScreen';
import styles from './App.module.css';

/** スマホで開いたときに 画面の上下（ブラウザの余白）に見える色 */
const EDGE_COLOR: Partial<Record<RouteId, string>> = {
  start: 'var(--color-sky)',
  'register-ready': 'var(--color-sky)',
  home: 'var(--color-sky)',
  'register-permission': 'var(--color-kinari)',
};

function useWideLayout() {
  const query = '(min-width: 720px) and (min-height: 560px)';
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setWide(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return wide;
}

function CurrentScreen() {
  const { route, user, useLoginLetter } = useAppState();
  switch (route) {
    case 'start':
      return <StartScreen />;
    case 'register-name':
      return <NameScreen />;
    case 'register-birthday':
      return <BirthdayScreen />;
    case 'register-letter':
      return useLoginLetter ? <LetterScreen /> : <NicknameScreen />;
    case 'register-nickname':
      return <NicknameScreen />;
    case 'register-gender':
      return <GenderScreen />;
    case 'register-height':
      return <HeightScreen />;
    case 'register-weight':
      return <WeightScreen />;
    case 'register-goal':
      return <GoalScreen />;
    case 'register-share':
      return <ShareScreen />;
    case 'register-permission':
      return <PermissionScreen />;
    case 'register-ready':
      return <ReadyScreen />;
    case 'login-name':
      return <LoginNameScreen />;
    case 'login-birthday':
      return <LoginBirthdayScreen />;
    case 'login-letter':
      return useLoginLetter ? <LoginLetterScreen /> : <LoginBirthdayScreen />;
    case 'home':
      return user ? <HomePlaceholder user={user} /> : <StartScreen />;
  }
}

export function App() {
  const { route } = useAppState();
  const wide = useWideLayout();

  useEffect(() => {
    const info = ALL_ROUTES.find((r) => r.id === route);
    document.title = info ? `${info.name}｜歩歩〜HoHo〜` : '歩歩〜HoHo〜';
  }, [route]);

  useEffect(() => {
    document.body.style.setProperty('--page-bg', wide ? 'var(--color-desk)' : (EDGE_COLOR[route] ?? 'var(--color-white)'));
  }, [route, wide]);

  if (!wide) {
    return (
      <main className={styles.phone}>
        <CurrentScreen key={route} />
      </main>
    );
  }

  return (
    <div className={styles.desk}>
      <DemoPanel />
      <main>
        <DeviceFrame>
          <CurrentScreen key={route} />
        </DeviceFrame>
      </main>
    </div>
  );
}
