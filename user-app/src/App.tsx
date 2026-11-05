import { useEffect, useRef, useState } from 'react';
import { DemoPanel, DEMO_PANEL_RESERVE } from './demo/DemoPanel';
import { DeviceFrame, PcFrame } from './demo/DeviceFrame';
import { useAppState } from './flow/AppState';
import { routeInfo, type RouteId } from './flow/routes';
import { AdminListScreen } from './screens/admin/AdminListScreen';
import { AdminLoginScreen } from './screens/admin/AdminLoginScreen';
import { AdminPcListScreen } from './screens/admin/AdminPcListScreen';
import { AdminPcLoginScreen } from './screens/admin/AdminPcLoginScreen';
import { AdminPcUserScreen } from './screens/admin/AdminPcUserScreen';
import { AdminUserScreen } from './screens/admin/AdminUserScreen';
import { AdventureResultScreen } from './screens/app/AdventureResultScreen';
import { GoalEditScreen } from './screens/app/GoalEditScreen';
import { HomeScreen } from './screens/app/HomeScreen';
import { LevelUpScreen } from './screens/app/LevelUpScreen';
import { MeScreen } from './screens/app/MeScreen';
import { ProfileNumberEditScreen, ProfileScreen, ProfileTextEditScreen } from './screens/app/ProfileScreens';
import { RecordsScreen } from './screens/app/RecordsScreen';
import { ShareTargetsScreen } from './screens/app/ShareTargetsScreen';
import { TextSizeScreen } from './screens/app/TextSizeScreen';
import { WalkingLock } from './screens/app/WalkingLock';
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
  'level-up': 'var(--color-navy)',
  'admin-login': 'var(--color-navy)',
  'admin-list': 'var(--color-navy)',
  'admin-user': 'var(--color-navy)',
};

/** 紺の画面では ステータスバー・ホームバーを 白にする（Figma の H-02・H-04・AM-01〜03） */
const LIGHT_STATUS = new Set<RouteId>(['level-up', 'admin-login', 'admin-list', 'admin-user']);
const LIGHT_INDICATOR = new Set<RouteId>(['level-up']);

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
  const { route, user, admin, useLoginLetter } = useAppState();
  const group = routeInfo(route).group;

  // ログインが必要な画面：利用者アプリは はじめの画面、管理者画面は ログインの画面を出す
  if (group === 'app' && !user) return <StartScreen />;
  if (group === 'admin' && !admin) return <AdminLoginScreen />;
  if (group === 'admin-pc' && !admin) return <AdminPcLoginScreen />;

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
      return <HomeScreen />;
    case 'adventure-result':
      return <AdventureResultScreen />;
    case 'level-up':
      return <LevelUpScreen />;
    case 'records':
      return <RecordsScreen period="week" />;
    case 'records-month':
      return <RecordsScreen period="month" />;
    case 'me':
      return <MeScreen />;
    case 'me-text-size':
      return <TextSizeScreen />;
    case 'me-share':
      return <ShareTargetsScreen />;
    case 'me-share-stop':
      return <ShareTargetsScreen confirm="careManager" />;
    case 'me-goal':
      return <GoalEditScreen />;
    case 'me-profile':
      return <ProfileScreen />;
    case 'me-profile-name':
      return <ProfileTextEditScreen field="name" />;
    case 'me-profile-nickname':
      return <ProfileTextEditScreen field="nickname" />;
    case 'me-profile-height':
      return <ProfileNumberEditScreen field="heightCm" />;
    case 'me-profile-weight':
      return <ProfileNumberEditScreen field="weightKg" />;
    case 'admin-login':
      return <AdminLoginScreen />;
    case 'admin-list':
      return <AdminListScreen account={admin!} />;
    case 'admin-user':
      return <AdminUserScreen />;
    case 'admin-pc-login':
      return <AdminPcLoginScreen />;
    case 'admin-pc-list':
      return <AdminPcListScreen account={admin!} />;
    case 'admin-pc-user':
      return <AdminPcUserScreen />;
  }
}

/** 画面と、歩いている間だけ重ねる 歩きスマホ防止（H-02） */
function ScreenStack({ locked }: { locked: boolean }) {
  const { route, admin } = useAppState();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 歩いている間は うしろの画面を 押せない・読み上げない
    const el = ref.current;
    if (!el) return;
    if (locked) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }, [locked]);

  return (
    <>
      <div ref={ref} className={styles.stack}>
        {/* 管理者のアカウントが かわったときは 一覧のデータを取りなおすため 作りなおす */}
        <CurrentScreen key={`${route}|${admin?.id ?? ''}`} />
      </div>
      {locked && <WalkingLock />}
    </>
  );
}

export function App() {
  const { route, user, walk } = useAppState();
  const wide = useWideLayout();
  const info = routeInfo(route);
  const pc = info.group === 'admin-pc';
  const locked = info.group === 'app' && user !== null && walk !== 'idle';
  const textSize = user?.textSize;

  useEffect(() => {
    document.title = `${info.name}｜歩歩〜HoHo〜`;
  }, [info.name]);

  useEffect(() => {
    // 文字の大きさ（M-02）は 利用者アプリの画面だけに使う
    const size = info.group === 'app' && textSize ? textSize : 'normal';
    if (size === 'normal') delete document.documentElement.dataset.textSize;
    else document.documentElement.dataset.textSize = size;
  }, [info.group, textSize]);

  useEffect(() => {
    const edge = locked ? 'var(--color-navy)' : (EDGE_COLOR[route] ?? 'var(--color-white)');
    document.body.style.setProperty('--page-bg', wide ? 'var(--color-desk)' : edge);
  }, [route, wide, locked]);

  if (!wide) {
    return (
      <main className={pc ? styles.pcPage : styles.phone} data-screen={pc ? undefined : 'phone'}>
        <ScreenStack locked={locked} />
      </main>
    );
  }

  return (
    <div className={styles.desk}>
      <DemoPanel />
      <main className={styles.deskMain}>
        {pc ? (
          <PcFrame reserve={DEMO_PANEL_RESERVE}>
            <ScreenStack locked={false} />
          </PcFrame>
        ) : (
          <DeviceFrame
            statusTone={locked || LIGHT_STATUS.has(route) ? 'light' : 'dark'}
            indicatorTone={locked || LIGHT_INDICATOR.has(route) ? 'light' : 'dark'}
          >
            <ScreenStack locked={locked} />
          </DeviceFrame>
        )}
      </main>
    </div>
  );
}
