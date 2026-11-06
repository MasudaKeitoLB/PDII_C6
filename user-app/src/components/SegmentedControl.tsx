import styles from './SegmentedControl.module.css';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** large：記録（R-01 高さ62）／ medium：測定結果（AM-03 高さ48）／ small：一覧（AM-02 高さ44） */
  size?: 'large' | 'medium' | 'small';
  className?: string;
}

/** 切り替え：2つまで（N-06）。選んだ方が 緑の台になる（Figma 部品：選ぶ・期間の切り替え） */
export function SegmentedControl<T extends string>({ label, options, value, onChange, size = 'large', className }: SegmentedControlProps<T>) {
  return (
    <div className={[styles.control, styles[size], className].filter(Boolean).join(' ')} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`${styles.option} ${o.value === value ? styles.selected : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
