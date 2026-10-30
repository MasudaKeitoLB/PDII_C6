import pressable from './pressable.module.css';
import styles from './LetterGrid.module.css';

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface LetterGridProps {
  value: string | null;
  onChange: (letter: string) => void;
  label: string;
}

/** 合言葉の文字（案）：キーボードを使わず 大きなボタンから1文字選ぶ（L-03 注記） */
export function LetterGrid({ value, onChange, label }: LetterGridProps) {
  return (
    <div className={styles.grid} role="radiogroup" aria-label={label}>
      {LETTERS.map((letter) => {
        const selected = letter === value;
        return (
          <button
            key={letter}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${pressable.pressable} ${pressable.shallow} ${styles.letter} ${selected ? pressable.green : ''}`}
            onClick={() => onChange(letter)}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
