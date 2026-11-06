import { useEffect, useRef, type ReactNode } from 'react';
import meIcon from '../../assets/icon/tab-me.svg';
import { useAppState } from '../../flow/AppState';
import { ROLE_LABEL } from '../../lib/admin';
import { setAdminSession } from '../../lib/store';
import type { AdminAccount } from '../../lib/types';
import s from './adminPc.module.css';

interface PcLayoutProps {
  title: string;
  account: AdminAccount;
  /** 上の帯（AP-02）。測定結果（AP-03）は 帯なしで 見出しから始まる */
  topBar?: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
}

/** 管理者画面 PC版のわく：左のメニュー（248幅）と 右の内容（AP-02・AP-03） */
export function PcLayout({ title, account, topBar, overlay, children }: PcLayoutProps) {
  const { route, navigate, setAdminUserId } = useAppState();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 画面がかわったら 読み上げの位置を 新しい内容に移す
    mainRef.current?.focus({ preventScroll: true });
  }, []);

  const logout = () => {
    setAdminSession(null);
    setAdminUserId(null);
    navigate('admin-pc-login');
  };
  const roleLabel = ROLE_LABEL[account.role];

  return (
    <div className={s.layout}>
      <nav className={s.side} aria-label="管理者メニュー">
        <p className={s.sideLogo}>
          <span className={s.sideLogoMark}>歩歩</span>
          <span className={s.sideLogoText}>管理者画面</span>
        </p>
        <a
          href="#admin-pc-list"
          className={s.menuItem}
          aria-current={route === 'admin-pc-list' ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            navigate('admin-pc-list');
          }}
        >
          <img className={s.menuIcon} src={meIcon} alt="" />
          利用者の一覧
        </a>
        <div className={s.account}>
          <p className={s.accountName}>{account.name}</p>
          {account.organization !== roleLabel && <p className={s.accountOrg}>{account.organization}</p>}
          <p className={s.accountOrg}>{roleLabel}</p>
          <button type="button" className={s.logout} onClick={logout}>
            ログアウト
          </button>
        </div>
      </nav>
      <main ref={mainRef} className={s.main} tabIndex={-1} aria-label={title}>
        {topBar}
        <div className={s.content}>{children}</div>
      </main>
      {overlay}
    </div>
  );
}
