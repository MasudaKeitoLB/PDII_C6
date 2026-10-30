import { useAppState } from '../flow/AppState';
import { ALL_ROUTES, type RouteId } from '../flow/routes';
import { clearAllUsers } from '../lib/auth';
import styles from './DemoPanel.module.css';

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
  { title: 'ログイン（2回目以降）', ids: ['login-name', 'login-birthday', 'login-letter', 'home'] },
];

/** 確認用のパネル（アプリの外側。パソコンで見るときだけ出す） */
export function DemoPanel() {
  const { route, navigate, useLoginLetter, setUseLoginLetter, resetRegistration, resetLogin, setUser } = useAppState();
  const letterRoutes: RouteId[] = ['register-letter', 'login-letter'];

  return (
    <aside className={styles.panel} aria-label="確認用のメニュー">
      <p className={styles.eyebrow}>試作デモ・確認用</p>
      <h2 className={styles.title}>歩歩〜HoHo〜</h2>
      <p className={styles.lead}>はじめての設定とログイン。右のスマホは そのまま押して 動かせます。</p>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>チームで確認中の案</h3>
        <label className={styles.toggle}>
          <input
            id="demo-use-login-letter"
            type="checkbox"
            checked={useLoginLetter}
            onChange={(e) => {
              setUseLoginLetter(e.target.checked);
              if (!e.target.checked && letterRoutes.includes(route)) navigate('start');
            }}
          />
          <span>
            <strong>合言葉の文字（L-03 案）を使う</strong>
            <small>確認したいこと 2。使うときは 登録にも「文字を決める」画面（U-02b）が入ります</small>
          </span>
        </label>
      </section>

      {GROUPS.map((group) => (
        <section key={group.title} className={styles.section}>
          <h3 className={styles.sectionTitle}>{group.title}</h3>
          <ol className={styles.list}>
            {group.ids.map((id) => {
              const r = ALL_ROUTES.find((x) => x.id === id)!;
              const disabled = !useLoginLetter && letterRoutes.includes(id);
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={styles.link}
                    aria-current={route === id ? 'page' : undefined}
                    aria-disabled={disabled || undefined}
                    onClick={(e) => disabled && e.preventDefault()}
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
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            clearAllUsers();
            resetRegistration();
            resetLogin();
            setUser(null);
            navigate('start');
          }}
        >
          入力した内容と 登録を消す
        </button>
        <p className={styles.note}>登録は このブラウザの中だけに 保存されます（サーバーには送りません）。</p>
      </section>
    </aside>
  );
}
