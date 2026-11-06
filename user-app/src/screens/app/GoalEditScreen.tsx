import { useState } from 'react';
import { Button } from '../../components/Button';
import { GoalPicker } from '../../components/GoalPicker';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import { useAppState, useUser } from '../../flow/AppState';
import { setGoal } from '../../lib/store';
import screens from '../screens.module.css';

/** 1日の目標歩数を変える：登録（U-07）と同じ画面を使う（M-01 注記・M-19） */
export function GoalEditScreen() {
  const { navigate } = useAppState();
  const user = useUser();
  const [goal, setGoalDraft] = useState(user.dailyGoalSteps);

  return (
    <Screen
      title="1日の目標歩数を変える"
      onBack={() => navigate('me')}
      footer={
        <Button
          onClick={() => {
            setGoal(user.id, goal);
            navigate('me');
          }}
        >
          この目標にする
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
      <GoalPicker value={goal} onChange={setGoalDraft} />
      <Note className={screens.goalNote}>あとから いつでも変えられます</Note>
    </Screen>
  );
}
