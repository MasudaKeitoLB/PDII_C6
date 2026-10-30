import type { ReactNode } from 'react';
import styles from './FieldMessage.module.css';

/** 入力の注意。色だけにたよらず 「！」の印と文で伝える（N-02） */
export function FieldMessage({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className={styles.message} role="alert">
      <span className={styles.mark} aria-hidden="true">
        ！
      </span>
      <span>{children}</span>
    </p>
  );
}
