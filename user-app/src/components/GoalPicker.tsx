import stepsIcon from '../assets/icon/steps.svg';
import { formatSteps, walkingMinutes } from '../lib/health';
import { IconItem, InfoCard } from './InfoCard';
import pressable from './pressable.module.css';
import styles from './GoalPicker.module.css';

export const GOAL_STEP = 500; // 500歩ずつ変えられる（U-07 注記）
export const GOAL_MIN = 1000;
export const GOAL_MAX = 20000;

/** 歩数を「およそ50分の散歩」のように 時間に言いかえる（提案） */
export function walkingTimeLabel(steps: number): string {
  const minutes = Math.round(walkingMinutes(steps));
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export const clampGoal = (n: number) => Math.min(GOAL_MAX, Math.max(GOAL_MIN, n));

interface GoalPickerProps {
  value: number;
  onChange: (value: number) => void;
  /** めやす（時間への言いかえ）を出すか */
  withGuide?: boolean;
}

/** 1日の目標歩数を選ぶ：数の台・±500歩・めやす（U-07。登録・わたし・管理者画面で同じ部品を使う） */
export function GoalPicker({ value, onChange, withGuide = true }: GoalPickerProps) {
  return (
    <>
      <p className={styles.value} aria-live="polite">
        <span>
          <span className={styles.number}>{formatSteps(value)}</span>
          <span className={styles.unit}> 歩</span>
        </span>
      </p>
      <div className={styles.buttons}>
        <button
          type="button"
          className={`${pressable.pressable} ${styles.button}`}
          disabled={value <= GOAL_MIN}
          onClick={() => onChange(clampGoal(value - GOAL_STEP))}
        >
          － 500歩
        </button>
        <button
          type="button"
          className={`${pressable.pressable} ${styles.button}`}
          disabled={value >= GOAL_MAX}
          onClick={() => onChange(clampGoal(value + GOAL_STEP))}
        >
          ＋ 500歩
        </button>
      </div>
      {withGuide && (
        <InfoCard className={styles.guide}>
          <IconItem icon={stepsIcon} title="めやす" iconGap={20.5} iconTop={4}>
            {formatSteps(value)}歩は、
            <br />
            およそ{walkingTimeLabel(value)}の散歩です
          </IconItem>
        </InfoCard>
      )}
    </>
  );
}
