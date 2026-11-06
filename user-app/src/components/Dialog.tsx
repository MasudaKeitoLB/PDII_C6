import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Dialog.module.css';

interface DialogProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/** 大事な操作の前の確認（N-07）。うしろを暗くして、画面のまん中に出す */
export function Dialog({ label, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    // 閉じたときに もどす場所（窓を開いたボタン）
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // 開いたら 窓の中の 最初のボタンに位置を移す
    el?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // 窓の外に 操作の位置が出ないようにする
      if (e.key === 'Tab' && el) {
        const items = [...el.querySelectorAll<HTMLElement>('button, [href], input')];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      // 閉じたら 開く前の場所に 位置をもどす（キーボード・読み上げで 迷わないように）
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    // 開いたときに1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={styles.dialog} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
