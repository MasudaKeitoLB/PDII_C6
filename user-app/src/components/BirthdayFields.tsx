import type { ReactNode } from 'react';
import { daysInMonth, eraOfDate, eraOfYear } from '../lib/wareki';
import type { Birthday } from '../lib/types';
import { PickerSheet, type PickerOption } from './PickerSheet';
import { SelectField } from './SelectField';
import styles from './BirthdayFields.module.css';

const FIRST_YEAR = 1920;
const LAST_YEAR = new Date().getFullYear() - 10;
/** 一覧を開いたとき、まだ選んでいなければ この年のあたりを見せる */
const YEAR_TO_SHOW_FIRST = 1950;

type Part = 'year' | 'month' | 'day';

interface BirthdayFieldsProps {
  idPrefix: string;
  value: Birthday;
  onChange: (value: Birthday) => void;
  invalid?: boolean;
  /** 一覧を 画面全体に重ねて出す */
  renderOverlay: (overlay: ReactNode) => void;
}

/** 年・月・日の選ぶ欄。登録（U-02）とログイン（L-02）で同じ部品を使う */
export function BirthdayFields({ idPrefix, value, onChange, invalid, renderOverlay }: BirthdayFieldsProps) {
  const { year, month, day } = value;

  const open = (part: Part) => {
    const close = () => {
      renderOverlay(null);
      // 閉じたら 押した欄に戻る
      requestAnimationFrame(() => document.getElementById(`${idPrefix}-${part}`)?.focus({ preventScroll: true }));
    };
    const choose = (patch: Partial<Birthday>) => {
      const next = { ...value, ...patch };
      // 月や年を変えて その日がなくなったら（2月30日など）、日を選びなおしてもらう
      if (next.year && next.month && next.day && next.day > daysInMonth(next.year, next.month)) next.day = null;
      onChange(next);
      close();
    };

    if (part === 'year') {
      const options: PickerOption<number>[] = [];
      for (let y = LAST_YEAR; y >= FIRST_YEAR; y--) {
        const era = eraOfYear(y, month ?? undefined, day ?? undefined);
        options.push({
          value: y,
          label: (
            <>
              {era}
              <small>（{y}年）</small>
            </>
          ),
          spokenLabel: `${era}（${y}年）`,
        });
      }
      renderOverlay(
        <PickerSheet
          title={
            <>
              生まれた年を
              <br />
              選んでください
            </>
          }
          label="生まれた年を 選んでください"
          layout="list"
          options={options}
          selected={year}
          initialFocus={YEAR_TO_SHOW_FIRST}
          onSelect={(y) => choose({ year: y })}
          onClose={close}
        />,
      );
    } else if (part === 'month') {
      renderOverlay(
        <PickerSheet
          title={
            <>
              生まれた月を
              <br />
              選んでください
            </>
          }
          label="生まれた月を 選んでください"
          layout="grid"
          columns={3}
          options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` }))}
          selected={month}
          onSelect={(m) => choose({ month: m })}
          onClose={close}
        />,
      );
    } else {
      const count = year && month ? daysInMonth(year, month) : 31;
      renderOverlay(
        <PickerSheet
          title={
            <>
              生まれた日を
              <br />
              選んでください
            </>
          }
          label="生まれた日を 選んでください"
          layout="grid"
          columns={5}
          options={Array.from({ length: count }, (_, i) => ({ value: i + 1, label: `${i + 1}`, spokenLabel: `${i + 1}日` }))}
          selected={day}
          onSelect={(d) => choose({ day: d })}
          onClose={close}
        />,
      );
    }
  };

  const yearLabel =
    year === null ? null : (
      <>
        {month && day ? eraOfDate(year, month, day) : eraOfYear(year)}
        <small>（{year}年）</small>
      </>
    );

  return (
    <div className={styles.fields}>
      <SelectField id={`${idPrefix}-year`} label="年" value={yearLabel} placeholder="年を選ぶ" onOpen={() => open('year')} invalid={invalid && year === null} />
      <div className={styles.row}>
        <SelectField
          id={`${idPrefix}-month`}
          label="月"
          value={month === null ? null : `${month}月`}
          placeholder="月を選ぶ"
          onOpen={() => open('month')}
          invalid={invalid && month === null}
        />
        <SelectField
          id={`${idPrefix}-day`}
          label="日"
          value={day === null ? null : `${day}日`}
          placeholder="日を選ぶ"
          onOpen={() => open('day')}
          invalid={invalid && day === null}
        />
      </div>
    </div>
  );
}

export function isCompleteBirthday(b: Birthday): b is { year: number; month: number; day: number } {
  return b.year !== null && b.month !== null && b.day !== null;
}
