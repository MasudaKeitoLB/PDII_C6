import { STOP_AFTER_MS, UNLOCK_DELAY_MS, useAppState } from '../flow/AppState';
import type { MotionSignal } from '../lib/motion';
import type { MotionAccess } from '../lib/permissions';
import { ALL_ROUTES, routeInfo, type RouteId } from '../flow/routes';
import { ADMIN_ACCOUNTS, canSeeUser, findAdmin, ROLE_LABEL } from '../lib/admin';
import { dayKey, now } from '../lib/dates';
import { formatSteps } from '../lib/health';
import { fillSampleHistory, findUser, getStore, loginAs, resetAll, setAdminSession } from '../lib/store';
import styles from './DemoPanel.module.css';

/** 確認パネルの幅と すきま（PC版の画面を 縮める大きさの計算に使う） */
export const DEMO_PANEL_RESERVE = 300 + 40 + 32;

/** サンプルの利用者：Figma の 利用者アプリの画面と同じ人 */
const SAMPLE_USER_ID = 's-yamada';
/** 「歩いたことにする」歩数：Figma の H-03（2,345歩・3体）と H-04（レベル12→13）に なる */
const DEMO_WALK_STEPS = 2345;

/** 体の動きで 歩数を数えられるか（スマホでは 体の動きで、PC では 下のボタンで 歩く） */
const MOTION_LABEL: Record<MotionAccess, string> = {
  checking: '調べています',
  granted: '数えられます',
  'needs-button': 'ホームで 許可が必要です（iPhone）',
  denied: '許可されていません',
  unsupported: 'このブラウザでは 数えられません',
};

/** 数えられるとき、値が届いているか（Android で 設定を止めていると 届かない。PC は センサーが無いので 届かないのが ふつう） */
const SIGNAL_LABEL: Record<MotionSignal, string> = {
  unknown: '',
  receiving: '（値が届いています）',
  silent: '（値が届いていません。PC では ふつう）',
};

const GROUPS: { title: string; ids: RouteId[] }[] = [
  {
    title: 'はじめての設定（登録）',
    ids: [
      'start',
      'register-name',
      'register-birthday',
      'register-letter',
      'register-nickname',
      'register-gender',
      'register-height',
      'register-weight',
      'register-goal',
      'register-share',
      'register-permission',
      'register-ready',
    ],
  },
  { title: 'ログイン（2回目以降）', ids: ['login-name', 'login-birthday', 'login-letter'] },
  { title: 'ホームと冒険', ids: ['home', 'adventure-result', 'level-up'] },
  { title: '記録', ids: ['records', 'records-month'] },
  {
    title: 'わたし',
    ids: [
      'me',
      'me-goal',
      'me-text-size',
      'me-share',
      'me-share-stop',
      'me-profile',
      'me-profile-name',
      'me-profile-nickname',
      'me-profile-height',
      'me-profile-weight',
    ],
  },
  { title: '管理者画面（スマホ）', ids: ['admin-login', 'admin-list', 'admin-user'] },
  { title: '管理者画面（PC）', ids: ['admin-pc-login', 'admin-pc-list', 'admin-pc-user'] },
  { title: '試作の確認（チーム用）', ids: ['check-steps'] },
];

const LETTER_ROUTES: RouteId[] = ['register-letter', 'login-letter'];
const ADMIN_LOGIN_ROUTES: RouteId[] = ['admin-login', 'admin-pc-login'];

/** 確認用のパネル（アプリの外側。パソコンで見るときだけ出す） */
export function DemoPanel() {
  const {
    route,
    navigate,
    user,
    admin,
    adminUserId,
    setAdminUserId,
    walk,
    startWalking,
    stopWalking,
    walkDemoSteps,
    motionAccess,
    motionSignal,
    useLoginLetter,
    setUseLoginLetter,
    resetRegistration,
    resetLogin,
  } = useAppState();

  /** 一覧から 画面へ とぶ前に、その画面に必要なログインを すませておく */
  const prepare = (id: RouteId) => {
    const group = routeInfo(id).group;
    if (group === 'app' && !getStore().sessionUserId) loginAs(SAMPLE_USER_ID);
    if ((group === 'admin' || group === 'admin-pc') && !ADMIN_LOGIN_ROUTES.includes(id)) {
      let account = findAdmin(getStore().adminSessionId);
      if (!account) {
        // スマホ版は ケアマネージャー、PC版は 施設スタッフ（Figma と同じ）
        account = ADMIN_ACCOUNTS.find((a) => a.role === (group === 'admin' ? 'careManager' : 'staff'))!;
        setAdminSession(account.id);
      }
      const selected = findUser(adminUserId);
      if ((id === 'admin-user' || id === 'admin-pc-user') && (!selected || !canSeeUser(account, selected))) {
        setAdminUserId(SAMPLE_USER_ID);
      }
    }
  };

  const enterAdmin = (accountId: string, pc: boolean) => {
    setAdminSession(accountId);
    setAdminUserId(null);
    navigate(pc ? 'admin-pc-list' : 'admin-list');
  };

  const reset = () => {
    resetAll(now());
    resetRegistration();
    resetLogin();
    setAdminUserId(null);
    navigate('start');
  };

  return (
    <aside className={styles.panel} aria-label="確認用のメニュー">
      <p className={styles.eyebrow}>試作デモ・確認用</p>
      <h2 className={styles.title}>歩歩〜HoHo〜</h2>
      <p className={styles.lead}>Figma の すべての画面を 動かせます。となりの画面は そのまま押して 操作できます。</p>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>いまの状態</h3>
        <p className={styles.status}>
          利用者アプリ：
          {user ? (
            <strong>
              {user.name}さん（レベル{user.game.level}・今日 {formatSteps(user.days[dayKey(now())] ?? 0)}歩）
            </strong>
          ) : (
            'ログインしていません'
          )}
        </p>
        <p className={styles.status}>
          管理者画面：{admin ? <strong>{`${admin.name}（${ROLE_LABEL[admin.role]}）`}</strong> : 'ログインしていません'}
        </p>
        <p className={styles.status}>
          体の動き：
          <strong>
            {MOTION_LABEL[motionAccess]}
            {motionAccess === 'granted' && SIGNAL_LABEL[motionSignal]}
          </strong>
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>利用者アプリで 試す</h3>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              loginAs(SAMPLE_USER_ID);
              navigate('home');
            }}
          >
            サンプルの利用者（山田 花子さん）で入る
          </button>
          {walk === 'idle' ? (
            <button type="button" className={styles.action} disabled={!user} onClick={startWalking}>
              歩きはじめる（歩きスマホ防止 H-02）
            </button>
          ) : (
            <button type="button" className={`${styles.action} ${styles.actionOn}`} disabled={walk === 'stopping'} onClick={stopWalking}>
              {walk === 'walking' ? '立ち止まる' : 'もうすぐ 使えるようになります…'}
            </button>
          )}
          <button type="button" className={styles.action} disabled={!user || walk !== 'idle'} onClick={() => walkDemoSteps(DEMO_WALK_STEPS)}>
            {formatSteps(DEMO_WALK_STEPS)}歩 歩いて 止まったことにする（H-03・H-04）
          </button>
          {user && !user.sample && (
            <button type="button" className={styles.action} onClick={() => fillSampleHistory(user.id)}>
              この人に 30日分の記録を入れる（記録のグラフ用）
            </button>
          )}
        </div>
        <p className={styles.note}>
          スマホでは 体の動きで歩数を数え、{STOP_AFTER_MS / 1000}秒 ふえなければ 止まったとみなします。PC では このボタンで歩き、0.5秒ごとに歩数が ふえます。止まって {UNLOCK_DELAY_MS / 1000}秒たつと 使えるようになり、冒険の成果が出ます。
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>管理者のアカウント（運営者が発行・デモ用）</h3>
        <ul className={styles.accounts}>
          {ADMIN_ACCOUNTS.map((a) => (
            <li key={a.id} className={styles.account}>
              <p>
                <strong>{a.name}</strong>（{ROLE_LABEL[a.role]}）
              </p>
              <p className={styles.credential}>
                ID <code>{a.id}</code> ／ パスワード <code>{a.password}</code>
              </p>
              <div className={styles.accountButtons}>
                <button type="button" className={styles.small} onClick={() => enterAdmin(a.id, false)}>
                  スマホ版で入る
                </button>
                <button type="button" className={styles.small} onClick={() => enterAdmin(a.id, true)}>
                  PC版で入る
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className={styles.note}>ケアマネージャーには 担当の6人、施設スタッフには 施設の12人が 出ます（共有に同意した人だけ）。</p>
      </section>

      {GROUPS.map((group) => (
        <section key={group.title} className={styles.section}>
          <h3 className={styles.sectionTitle}>{group.title}</h3>
          <ol className={styles.list}>
            {group.ids.map((id) => {
              const r = ALL_ROUTES.find((x) => x.id === id)!;
              const disabled = !useLoginLetter && LETTER_ROUTES.includes(id);
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={styles.link}
                    aria-current={route === id ? 'page' : undefined}
                    aria-disabled={disabled || undefined}
                    onClick={(e) => {
                      if (disabled) {
                        e.preventDefault();
                        return;
                      }
                      prepare(id);
                    }}
                  >
                    <span className={styles.code}>{r.code}</span>
                    <span>{r.name}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>決まったこと（16章）</h3>
        <label className={styles.toggle}>
          <input
            id="demo-use-login-letter"
            type="checkbox"
            checked={useLoginLetter}
            onChange={(e) => {
              setUseLoginLetter(e.target.checked);
              if (!e.target.checked && LETTER_ROUTES.includes(route)) navigate('start');
            }}
          />
          <span>
            <strong>合言葉の文字（L-03）を使う</strong>
            <small>好きなローマ字1文字を 登録・ログインで入れることに決定。外すと 文字なしの流れと くらべられます</small>
          </span>
        </label>
      </section>

      <section className={styles.section}>
        <button type="button" className={styles.reset} onClick={reset}>
          データを はじめの状態に もどす
        </button>
        <p className={styles.note}>データは このブラウザの中だけに 保存されます（サーバーには送りません）。</p>
      </section>
    </aside>
  );
}

