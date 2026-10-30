import stepsIcon from '../../assets/icon/steps.svg';
import { Button } from '../../components/Button';
import { IconItem, InfoCard } from '../../components/InfoCard';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import pressable from '../../components/pressable.module.css';
import { useAppState, useStep } from '../../flow/AppState';
import s from '../screens.module.css';

const STEP = 500; // 500歩ずつ変えられる（U-07 注記）
const MIN = 1000;
const MAX = 20000;
/** ゆっくりした散歩で 1分におよそ100歩 */
const STEPS_PER_MINUTE = 100;

const formatSteps = (n: number) => n.toLocaleString('ja-JP');

/** 歩数を「およそ50分の散歩」のように 時間に言いかえる（提案） */
export function walkingTimeLabel(steps: number): string {
  const minutes = Math.round(steps / STEPS_PER_MINUTE);
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/** U-07 登録⑦ 1日の目標歩数：体の調子に合わせて、スタッフと相談して決める（N-11） */
export function GoalScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-goal', registerOrder, 'register-weight', 'register-share');
  const goal = registration.dailyGoalSteps;
  const change = (diff: number) => updateRegistration({ dailyGoalSteps: Math.min(MAX, Math.max(MIN, goal + diff)) });

  return (
    <Screen
      title="登録⑦ 1日の目標歩数"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footer={
        <Button withArrow onClick={() => navigate(step.next)}>
          つぎへ
        </Button>
      }
    >
      <Heading>
        1日に歩く
        <br />
        目標を 決めましょう
      </Heading>
      <Lead>
        体の調子に合わせて、
        <br />
        スタッフと相談して 決めましょう
      </Lead>
      <p className={s.goalValue} aria-live="polite">
        <span>
          <span className={s.goalNumber}>{formatSteps(goal)}</span>
          <span className={s.goalUnit}> 歩</span>
        </span>
      </p>
      <div className={s.goalButtons}>
        <button type="button" className={`${pressable.pressable} ${s.goalButton}`} disabled={goal <= MIN} onClick={() => change(-STEP)}>
          － 500歩
        </button>
        <button type="button" className={`${pressable.pressable} ${s.goalButton}`} disabled={goal >= MAX} onClick={() => change(STEP)}>
          ＋ 500歩
        </button>
      </div>
      <InfoCard className={s.guide}>
        <IconItem icon={stepsIcon} title="めやす" iconGap={20.5} iconTop={4}>
          {formatSteps(goal)}歩は、
          <br />
          およそ{walkingTimeLabel(goal)}の散歩です
        </IconItem>
      </InfoCard>
      <Note className={s.goalNote}>あとから いつでも変えられます</Note>
    </Screen>
  );
}
