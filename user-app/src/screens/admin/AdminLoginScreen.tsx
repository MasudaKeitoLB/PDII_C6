import homeBg from '../../assets/scene/home-bg.svg';
import { FitScene, Place } from '../../components/FitScene';
import { Screen } from '../../components/Screen';
import { useAppState } from '../../flow/AppState';
import { AdminLoginForm } from './AdminLoginForm';
import s from './adminPhone.module.css';

/** AM-01 管理者ログイン（スマホ）：ケアマネージャーが 訪問先や移動中に使う想定 */
export function AdminLoginScreen() {
  const { navigate, setAdminUserId } = useAppState();

  return (
    <Screen
      title="管理者ログイン（スマホ）"
      scene={
        <>
          <div className={s.statusShade} aria-hidden="true" />
          <FitScene width={393} height={303}>
            <Place x={0} y={0}>
              <span className={s.loginHeaderBg} />
            </Place>
            {/* 冒険の背景の帯（Figma の帯の書き出しが使えないため、ホームの背景の一部を使う） */}
            <Place x={0} y={208}>
              <span className={s.loginStrip}>
                <img src={homeBg} alt="" />
              </span>
            </Place>
            <Place x={0} y={92}>
              <p className={s.loginLogo}>歩歩</p>
            </Place>
            <Place x={132.5} y={166}>
              <p className={s.loginBadge}>管理者用</p>
            </Place>
          </FitScene>
        </>
      }
    >
      <div className={s.loginBody}>
        <AdminLoginForm
          variant="phone"
          onSuccess={() => {
            setAdminUserId(null);
            navigate('admin-list');
          }}
        />
      </div>
    </Screen>
  );
}
