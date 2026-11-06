import { Button } from '../../components/Button';
import { GoalPicker } from '../../components/GoalPicker';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import { useAppState, useStep } from '../../flow/AppState';
import s from '../screens.module.css';

/** U-07 登録⑦ 1日の目標歩数：体の調子に合わせて、スタッフと相談して決める（N-11） */
export function GoalScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-goal', registerOrder, 'register-weight', 'register-share');

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
      <GoalPicker value={registration.dailyGoalSteps} onChange={(dailyGoalSteps) => updateRegistration({ dailyGoalSteps })} />
      <Note className={s.goalNote}>あとから いつでも変えられます</Note>
    </Screen>
  );
}
