import type { CSSProperties, ReactNode } from 'react';
import styles from './InfoCard.module.css';

interface InfoCardProps {
  /** white：説明の台（ふち2px）／ sand：見せるもの・見せないもの の台 */
  tone?: 'white' | 'sand';
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** 押せない説明の台。押せるもの（ふちどり＋影）と見分けられるよう、うすいふちだけにする */
export function InfoCard({ tone = 'white', className, style, children }: InfoCardProps) {
  return (
    <div className={[styles.card, tone === 'sand' && styles.sand, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
}

interface IconItemProps {
  icon: string;
  title: ReactNode;
  children?: ReactNode;
  /** アイコンの列の幅と、文字までのすきま（画面ごとのデザインに合わせる） */
  iconColumn?: number;
  iconGap?: number;
  iconTop?: number;
  titleSize?: 'normal' | 'small';
  /** 見出しと説明のすきま */
  textGap?: number;
}

/** アイコン＋太字の見出し＋説明の行 */
export function IconItem({ icon, title, children, iconColumn = 31.5, iconGap = 20.5, iconTop = 4, titleSize = 'normal', textGap = 5 }: IconItemProps) {
  return (
    <div
      className={styles.item}
      style={{ '--icon-col': `${iconColumn}px`, '--icon-gap': `${iconGap}px`, '--icon-top': `${iconTop}px` } as CSSProperties}
    >
      <img className={styles.icon} src={icon} alt="" />
      <div className={styles.texts}>
        <p className={titleSize === 'small' ? styles.titleSmall : styles.title}>{title}</p>
        {children && (
          <p className={styles.text} style={{ marginTop: textGap }}>
            {children}
          </p>
        )}
      </div>
    </div>
  );
}
