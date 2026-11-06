import bgStart from '../../assets/scene/adventure-bg-start.svg';
import hero from '../../assets/sprite/hero.svg';
import { FitScene, Place } from '../../components/FitScene';
import { GameWindow } from '../../components/GameWindow';
import { useAppState } from '../../flow/AppState';
import { AdminLoginForm } from './AdminLoginForm';
import s from './adminPc.module.css';

/**
 * AP-01 管理者ログイン（PC）：左に アプリと同じ世界観の絵、右に入力欄。スマホ版と同じアカウントで入れる。
 * 左の絵は Figma の絵の書き出しが使えないため、はじめの画面（U-00）の背景を 720幅に広げて使う。
 */
export function AdminPcLoginScreen() {
  const { navigate, setAdminUserId } = useAppState();

  return (
    <section className={s.loginPage} aria-label="管理者ログイン（PC）">
      <div className={s.loginArt} aria-hidden="true">
        <FitScene width={720} height={1024}>
          <Place x={0} y={0}>
            <span className={s.loginSky} />
          </Place>
          <Place x={0} y={130}>
            <img className={s.loginBg} src={bgStart} alt="" />
          </Place>
          <Place x={150} y={250}>
            <GameWindow className={s.loginWindow}>
              <p className={s.loginLogo}>歩歩</p>
              <p className={s.loginLogoSub}>〜 HoHo 〜</p>
              <p className={s.loginLogoNote}>管理者画面</p>
            </GameWindow>
          </Place>
          <Place x={158} y={650}>
            <img className={s.loginHero} src={hero} alt="" />
          </Place>
        </FitScene>
      </div>
      <div className={s.loginFormArea}>
        <AdminLoginForm
          variant="pc"
          onSuccess={() => {
            setAdminUserId(null);
            navigate('admin-pc-list');
          }}
        />
      </div>
    </section>
  );
}
