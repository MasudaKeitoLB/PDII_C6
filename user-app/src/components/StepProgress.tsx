import styles from './StepProgress.module.css';

interface StepProgressProps {
  current: number;
  total: number;
}

/** 進み具合：「1 / 8」と 区切りのバー。色だけで区別しないよう 数字もそえる（N-02） */
export function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className={styles.progress}>
      <p className={styles.count}>
        <span aria-hidden="true">
          {current} / {total}
        </span>
        <span className="visually-hidden">
          {total}つのうち {current}つめ
        </span>
      </p>
      <ol className={styles.bars} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={i < current ? styles.done : styles.todo} />
        ))}
      </ol>
    </div>
  );
}
