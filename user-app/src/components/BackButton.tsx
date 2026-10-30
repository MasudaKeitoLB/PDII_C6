import arrowLeft from '../assets/ui/arrow-left.svg';
import pressable from './pressable.module.css';
import styles from './BackButton.module.css';

interface BackButtonProps {
  onClick: () => void;
  /** 「一覧」など 行き先を書いてもよい（Figma 部品：戻る） */
  label?: string;
}

/** どの画面でも 左上の同じ位置に置く（N-07） */
export function BackButton({ onClick, label = '戻る' }: BackButtonProps) {
  return (
    <button type="button" className={`${pressable.pressable} ${pressable.shallow} ${styles.back}`} onClick={onClick}>
      <img className={styles.arrow} src={arrowLeft} alt="" />
      <span>{label}</span>
    </button>
  );
}
