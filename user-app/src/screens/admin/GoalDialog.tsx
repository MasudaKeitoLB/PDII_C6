import { useState } from 'react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { GoalPicker } from '../../components/GoalPicker';
import { setGoal } from '../../lib/store';
import type { AppUser } from '../../lib/types';
import s from './adminPhone.module.css';

/**
 * 1日の目標歩数を 管理者画面から変える（AM-03・AP-03「変更する」・M-19）。
 * 利用者アプリと同じ部品（U-07）を使い、本人のアプリにも すぐ反映される。
 * だれが決めるかは まだ決まっていない（16章）ので、本人と相談して決める前提の文をそえる。
 */
export function GoalDialog({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const [goal, setGoalDraft] = useState(user.dailyGoalSteps);

  return (
    <Dialog label="1日の目標歩数を変える" onClose={onClose}>
      <div className={s.goalDialog}>
        <h2 className={s.goalDialogTitle}>
          {user.name} さんの
          <br />
          1日の目標歩数を変える
        </h2>
        <p className={s.goalDialogLead}>本人と相談して 決めてください。本人のアプリにも すぐ反映されます</p>
        <GoalPicker value={goal} onChange={setGoalDraft} withGuide={false} />
        <div className={s.goalDialogButtons}>
          <Button
            onClick={() => {
              setGoal(user.id, goal);
              onClose();
            }}
          >
            この目標にする
          </Button>
          <Button variant="secondary" onClick={onClose}>
            変えずに もどる
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
