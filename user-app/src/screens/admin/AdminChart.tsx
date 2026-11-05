import type { CSSProperties } from 'react';
import type { DayRecord } from '../../lib/admin';
import { monthLabelIndexes, WEEKDAYS } from '../../lib/dates';
import { formatSteps } from '../../lib/health';
import s from './adminChart.module.css';

interface AdminChartProps {
  days: DayRecord[];
  goal: number;
  period: 'week' | 'month';
  variant: 'phone' | 'pc';
}

/** 目盛りの間かくの候補（いちばん近いものを使う） */
const STEP_CANDIDATES = [500, 1000, 2000, 2500, 5000, 10000];

/**
 * 目盛り：3つの間で 目標と歩数が おさまるようにする（Figma：0・2,000・4,000・6,000）。
 * 少しだけ はみ出す日（6,020歩）は 目盛りを ふやさない。
 */
export function chartTicks(maxValue: number): number[] {
  const raw = Math.max(maxValue, 1) / 3;
  const step = STEP_CANDIDATES.reduce((best, c) => (Math.abs(c - raw) < Math.abs(best - raw) ? c : best));
  const count = Math.max(1, Math.ceil(maxValue / step - 0.05));
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}


/**
 * 歩数の推移のグラフ（AM-03・AP-03・M-17・M-18）：1日の合計歩数と 目標のライン。
 * 今日の棒だけ こい緑にして ふちをつける。PC の1週間は 棒の上に 数をそえる。
 */
export function AdminChart({ days, goal, period, variant }: AdminChartProps) {
  const pc = variant === 'pc';
  const week = period === 'week';
  const ticks = chartTicks(Math.max(goal, ...days.map((d) => d.steps)));
  const top = ticks[ticks.length - 1];
  const pct = (v: number) => `${(v / top) * 100}%`;
  const last = days.length - 1;
  const labelIndexes = week ? days.map((_, i) => i) : monthLabelIndexes(days.length);
  const spoken = days
    .map((d, i) => `${i === last ? '今日' : `${d.date.getMonth() + 1}月${d.date.getDate()}日`} ${d.steps}歩`)
    .join('、');

  return (
    <div className={`${s.chart} ${pc ? s.pc : s.phone} ${week ? s.week : s.month}`}>
      <div
        className={s.plot}
        role="img"
        aria-label={`1日の合計歩数のグラフ。目標は${goal}歩。${spoken}`}
        style={{ '--columns': days.length } as CSSProperties}
      >
        {ticks.map((t) => (
          <span key={t} className={t === 0 ? s.zero : s.grid} style={{ bottom: pct(t) }}>
            <span className={s.tick}>{formatSteps(t)}</span>
          </span>
        ))}
        <div className={s.bars}>
          {days.map((d, i) => (
            <span key={i} className={s.column}>
              <span
                className={`${s.bar} ${i === last ? s.today : ''}`}
                style={{ height: d.steps > 0 ? `min(${pct(d.steps)}, calc(100% + 10px))` : 0 }}
              >
                {pc && week && <span className={s.value}>{formatSteps(d.steps)}</span>}
              </span>
            </span>
          ))}
        </div>
        <span className={s.goalLine} style={{ bottom: pct(goal) }}>
          <span className={s.goalLabel}>
            目標
            <br />
            {formatSteps(goal)}
          </span>
        </span>
      </div>
      <div className={s.labels} style={{ '--columns': days.length } as CSSProperties} aria-hidden="true">
        {days.map((d, i) => {
          if (!labelIndexes.includes(i)) return <span key={i} />;
          const today = i === last;
          if (week) {
            return (
              <span key={i} className={`${s.label} ${today ? s.labelToday : ''}`}>
                <span className={s.weekday}>{WEEKDAYS[d.date.getDay()]}</span>
                <span className={s.date}>
                  {d.date.getDate()}
                  {pc ? '日' : ''}
                </span>
              </span>
            );
          }
          const prev = labelIndexes[labelIndexes.indexOf(i) - 1];
          const monthChanged = prev === undefined || days[prev].date.getMonth() !== d.date.getMonth();
          return (
            <span key={i} className={`${s.label} ${s.labelMonth} ${today ? s.labelToday : ''}`}>
              <span className={s.weekday}>{today ? '今日' : `${d.date.getDate()}日`}</span>
              <span className={s.date}>{monthChanged ? `${d.date.getMonth() + 1}月` : ' '}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
