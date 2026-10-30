import type { CSSProperties, ReactNode } from 'react';
import { BackButton } from './BackButton';
import { StepProgress } from './StepProgress';
import styles from './Screen.module.css';

export type ScreenBackground = 'white' | 'kinari' | 'paper';

interface ScreenProps {
  /** 画面の名前（読み上げ用）。例：「登録① お名前」 */
  title: string;
  background?: ScreenBackground;
  onBack?: () => void;
  progress?: { current: number; total: number };
  /** 画面のいちばん上から始まる絵（はじめの画面・準備ができました） */
  scene?: ReactNode;
  /** 画面の下に固定するボタン */
  footer?: ReactNode;
  /** 下のボタンが2つのときの すきま（デザインでは 20 か 24） */
  footerGap?: number;
  /** いちばん下のボタンと 画面の下（ホームバー）との すきま */
  footerBottom?: number;
  /** 画面全体に重ねる部品（大きな一覧など） */
  overlay?: ReactNode;
  children: ReactNode;
}

const BACKGROUNDS: Record<ScreenBackground, string> = {
  white: 'var(--color-white)',
  kinari: 'var(--color-kinari)',
  paper: 'var(--color-paper)',
};

/** 1画面1アクション（N-04）の画面のわく。主ボタンはいつも画面の下（U-01 注記） */
export function Screen({ title, background = 'white', onBack, progress, scene, footer, footerGap, footerBottom, overlay, children }: ScreenProps) {
  const hasHeader = Boolean(onBack || progress);
  return (
    <section
      className={styles.screen}
      style={{ '--screen-bg': BACKGROUNDS[background] } as CSSProperties}
      aria-label={title}
    >
      <div className={styles.scroll}>
        {scene}
        {hasHeader && (
          <header className={styles.header}>
            {onBack && <BackButton onClick={onBack} />}
            {progress && <StepProgress current={progress.current} total={progress.total} />}
          </header>
        )}
        <div className={styles.body}>{children}</div>
      </div>
      {footer && (
        <footer
          className={styles.footer}
          style={{ gap: footerGap, paddingBottom: footerBottom === undefined ? undefined : `calc(var(--safe-bottom) + ${footerBottom}px)` }}
        >
          {footer}
        </footer>
      )}
      {overlay}
    </section>
  );
}

/** 見出し：28px 太字。改行の位置はデザインどおり <br /> で指定する */
export function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={[styles.heading, className].filter(Boolean).join(' ')}>{children}</h1>;
}

/** 見出しの下の説明：20px 墨（うすめ） */
export function Lead({ children, small = false, className }: { children: ReactNode; small?: boolean; className?: string }) {
  return <p className={[small ? styles.leadSmall : styles.lead, className].filter(Boolean).join(' ')}>{children}</p>;
}

/** 部品の下の小さな説明：18px */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={[styles.note, className].filter(Boolean).join(' ')}>{children}</p>;
}
