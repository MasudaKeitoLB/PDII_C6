import calorieIcon from '../../assets/icon/calorie.svg';
import distanceIcon from '../../assets/icon/distance-small.svg';
import stepsIcon from '../../assets/icon/steps-small.svg';
import { Heading, Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useAppState, useUser } from '../../flow/AppState';
import { dayKey, formatMonthDay, lastDays, now } from '../../lib/dates';
import { caloriesKcal, distanceKm, formatKcal, formatKm, formatSteps } from '../../lib/health';
import { StepsChart } from './StepsChart';
import s from './records.module.css';

type Period = 'week' | 'month';

/**
 * R-01 記録（1週間）／ R-02 記録（1か月）（M-12・M-18）
 * 期間は 1週間と1か月の2つだけ（N-06）。その期間の 平均・距離・カロリーを まとめて出す。
 */
export function RecordsScreen({ period }: { period: Period }) {
  const { navigate } = useAppState();
  const user = useUser();
  const today = now();
  const dates = lastDays(today, period === 'week' ? 7 : 30);
  const days = dates.map((date) => ({ date, steps: user.days[dayKey(date)] ?? 0 }));
  const total = days.reduce((sum, d) => sum + d.steps, 0);
  const average = Math.round(total / days.length);

  return (
    <Screen title={period === 'week' ? '記録（1週間）' : '記録（1か月）'} onBack={() => navigate('home')} tab="records">
      <Heading className={s.heading}>歩いた記録</Heading>
      <SegmentedControl
        className={s.period}
        label="期間"
        options={[
          { value: 'week', label: '1週間' },
          { value: 'month', label: '1か月' },
        ]}
        value={period}
        onChange={(p) => navigate(p === 'week' ? 'records' : 'records-month')}
      />
      <p className={s.range}>
        {formatMonthDay(dates[0])} 〜 {formatMonthDay(today)}（今日）
      </p>
      <StepsChart days={days} goal={user.dailyGoalSteps} period={period} />
      <section className={s.summary} aria-label="この期間のまとめ">
        <div className={s.row}>
          <span className={s.icon}>
            <img src={stepsIcon} alt="" />
          </span>
          <p className={s.label}>1日の平均</p>
          <p className={s.value}>
            {formatSteps(average)}
            <small> 歩</small>
          </p>
        </div>
        <div className={s.row}>
          <span className={s.icon}>
            <img src={distanceIcon} alt="" />
          </span>
          <p className={s.label}>歩いた距離</p>
          <p className={s.value}>
            {formatKm(distanceKm(total, user.heightCm))}
            <small> km</small>
          </p>
        </div>
        <div className={s.row}>
          <span className={s.icon}>
            <img src={calorieIcon} alt="" />
          </span>
          <p className={s.label}>消費カロリー</p>
          <p className={s.value}>
            {formatKcal(caloriesKcal(total, user.weightKg))}
            <small> kcal</small>
          </p>
        </div>
      </section>
    </Screen>
  );
}
