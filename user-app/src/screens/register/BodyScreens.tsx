import { Button } from '../../components/Button';
import { NumberStepper } from '../../components/NumberStepper';
import { Heading, Lead, Note, Screen } from '../../components/Screen';
import { useAppState, useStep } from '../../flow/AppState';
import { DEFAULT_HEIGHT_CM, DEFAULT_WEIGHT_KG } from '../../lib/bodyDefaults';
import s from '../screens.module.css';

/** U-05 登録⑤ 身長 */
export function HeightScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-height', registerOrder, 'register-gender', 'register-weight');
  const value = registration.heightCm ?? DEFAULT_HEIGHT_CM[registration.gender ?? 'female'];

  return (
    <Screen
      title="登録⑤ 身長"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footer={
        <Button
          withArrow
          onClick={() => {
            updateRegistration({ heightCm: value });
            navigate(step.next);
          }}
        >
          つぎへ
        </Button>
      }
    >
      <Heading>
        身長を
        <br />
        教えてください
      </Heading>
      {/* 「だいたいで大丈夫」と書いて 不安を減らす（U-05 注記） */}
      <Lead>
        歩いた距離の計算に 使います。
        <br />
        だいたいで 大丈夫です
      </Lead>
      <div className={s.stepper}>
        <NumberStepper
          id="register-height"
          label="身長"
          value={value}
          unit="cm"
          min={100}
          max={220}
          onChange={(heightCm) => updateRegistration({ heightCm })}
        />
      </div>
      <Note className={s.stepperNote}>
        ＋や－を押すと 1cmずつ変わります。
        <br />
        数字を押すと、入力もできます
      </Note>
    </Screen>
  );
}

/** U-06 登録⑥ 体重：身長と同じ形にして、覚えることを増やさない */
export function WeightScreen() {
  const { navigate, registration, updateRegistration, registerOrder } = useAppState();
  const step = useStep('register-weight', registerOrder, 'register-height', 'register-goal');
  const value = registration.weightKg ?? DEFAULT_WEIGHT_KG[registration.gender ?? 'female'];

  return (
    <Screen
      title="登録⑥ 体重"
      onBack={() => navigate(step.prev)}
      progress={step.progress}
      footer={
        <Button
          withArrow
          onClick={() => {
            updateRegistration({ weightKg: value });
            navigate(step.next);
          }}
        >
          つぎへ
        </Button>
      }
    >
      <Heading>
        体重を
        <br />
        教えてください
      </Heading>
      <Lead>
        消費カロリーの計算に 使います。
        <br />
        だいたいで 大丈夫です
      </Lead>
      <div className={s.stepper}>
        <NumberStepper
          id="register-weight"
          label="体重"
          value={value}
          unit="kg"
          min={25}
          max={150}
          onChange={(weightKg) => updateRegistration({ weightKg })}
        />
      </div>
      <Note className={s.stepperNote}>
        ＋や－を押すと 1kgずつ変わります。
        <br />
        数字を押すと、入力もできます
      </Note>
    </Screen>
  );
}
