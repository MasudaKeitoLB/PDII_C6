import type { CSSProperties } from 'react';
import starIcon from '../../assets/icon/star.svg';
import { monthLabelIndexes, WEEKDAYS } from '../../lib/dates';
import { formatSteps } from '../../lib/health';
import s from './chart.module.css';

export interface ChartDay {
  date: Date;
  steps: number;
}

interface StepsChartProps {
  days: ChartDay[];
  goal: number;
  period: 'week' | 'month';
}


/**
 * 歩数のグラフ（R-01・R-02）。目標のラインと、達成した日の★。届かない日も 色を変えない（N-11）
 */
export function StepsChart({ days, goal, period }: StepsChartProps) {
  const week = period === 'week';
  const maxValue = Math.max(goal, ...days.map((d) => d.steps), 1);
  const plotHeight = week ? 86 : 102;
  const px = (v: number) => (v / maxValue) * plotHeight;
  const achieved = days.filter((d) => d.steps >= goal && d.steps > 0).length;
  const last = days.length - 1;
  const spoken = days.map((d, i) => `${i === last ? '今日' : `${d.date.getMonth() + 1}月${d.date.getDate()}日`} ${d.steps}歩`).join('、');

  return (
    <section className={`${s.card} ${week ? s.week : s.month}`} aria-label="1日の歩数のグラフ">
      <div className={s.head}>
        <h2 className={s.title}>1日の歩数</h2>
        <p className={s.achieved}>
          <img src={starIcon} alt="" />
          目標を達成した日 {achieved}日
        </p>
      </div>
      <p className={s.legend}>
        <span className={s.legendLine} aria-hidden="true" />
        目標 {formatSteps(goal)}歩
      </p>
      <div
        className={s.plot}
        role="img"
        aria-label={`歩数のグラフ。目標は${goal}歩。${spoken}`}
        style={{ '--columns': days.length, '--goal-y': `${px(goal)}px` } as CSSProperties}
      >
        {days.map((d, i) => {
          const hit = d.steps >= goal && d.steps > 0;
          return (
            <div key={i} className={s.column}>
              {week && hit && <img className={s.star} src={starIcon} alt="" />}
              <span className={`${s.bar} ${i === last ? s.today : ''}`} style={{ height: `${px(d.steps)}px` }} />
            </div>
          );
        })}
        <span className={s.goalLine} aria-hidden="true" />
      </div>
      <div className={s.labels} style={{ '--columns': days.length } as CSSProperties} aria-hidden="true">
        {week
          ? days.map((d, i) => (
              <p key={i} className={i === last ? s.labelToday : undefined}>
                <span className={s.weekday}>{i === last ? '今日' : WEEKDAYS[d.date.getDay()]}</span>
                <span className={s.value}>{d.steps}</span>
              </p>
            ))
          : days.map((d, i) => {
              const labelIndexes = monthLabelIndexes(days.length);
              if (!labelIndexes.includes(i)) return <p key={i} />;
              const prev = labelIndexes[labelIndexes.indexOf(i) - 1];
              const monthChanged = prev !== undefined && days[prev].date.getMonth() !== d.date.getMonth();
              return (
                <p key={i} className={`${s.dateLabel} ${i === last ? s.labelToday : ''}`}>
                  <span>{i === last ? '今日' : `${d.date.getDate()}日`}</span>
                  {monthChanged && <span className={s.monthLabel}>{d.date.getMonth() + 1}月</span>}
                </p>
              );
            })}
      </div>
    </section>
  );
}
