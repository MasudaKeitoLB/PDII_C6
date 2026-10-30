import pressable from './pressable.module.css';
import styles from './ChoiceGroup.module.css';

interface ChoiceGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}

/** 選択肢：選ぶと緑のふち＋●（Figma 部品：選ぶ） */
export function ChoiceGroup<T extends string>({ label, options, value, onChange }: ChoiceGroupProps<T>) {
  return (
    <div className={styles.group} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${pressable.pressable} ${pressable.shallow} ${styles.card} ${selected ? styles.selected : ''}`}
            onClick={() => onChange(option.value)}
          >
            <span className={styles.radio} aria-hidden="true">
              {selected && <span className={styles.dot} />}
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
