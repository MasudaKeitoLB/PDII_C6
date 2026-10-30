import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { BackButton } from './BackButton';
import pressable from './pressable.module.css';
import styles from './PickerSheet.module.css';

export interface PickerOption<T> {
  value: T;
  label: ReactNode;
  /** 読み上げ用の文。label が文字だけなら省略できる */
  spokenLabel?: string;
}

interface PickerSheetProps<T> {
  /** 見出し（改行の位置を <br /> で指定できる） */
  title: ReactNode;
  /** 読み上げ用の見出し */
  label: string;
  options: PickerOption<T>[];
  selected: T | null;
  /** まだ選んでいないとき、最初に見せる位置 */
  initialFocus?: T;
  layout: 'list' | 'grid';
  columns?: number;
  onSelect: (value: T) => void;
  onClose: () => void;
}

/** 押すと開く 大きな一覧（U-02 注記）。1つ押せば 決まって閉じる */
export function PickerSheet<T extends string | number>({
  title,
  label,
  options,
  selected,
  initialFocus,
  layout,
  columns = 3,
  onSelect,
  onClose,
}: PickerSheetProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = selected ?? initialFocus;
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${String(target)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.focus({ preventScroll: true });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // 開いたときに1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={label}>
      <div className={styles.header}>
        <BackButton label="閉じる" onClick={onClose} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <div
        ref={listRef}
        className={layout === 'grid' ? styles.grid : styles.list}
        style={{ '--columns': columns } as CSSProperties}
        role="radiogroup"
      >
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.spokenLabel}
              data-value={option.value}
              className={[
                pressable.pressable,
                layout === 'grid' ? pressable.shallow : undefined,
                layout === 'grid' ? styles.cell : styles.row,
                isSelected && (layout === 'grid' ? pressable.green : styles.rowSelected),
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(option.value)}
            >
              {layout === 'list' && (
                <span className={styles.radio} aria-hidden="true">
                  {isSelected && <span className={styles.dot} />}
                </span>
              )}
              <span className={styles.optionLabel}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
