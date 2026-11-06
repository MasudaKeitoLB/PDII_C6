import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { Heading, Lead, Screen } from '../../components/Screen';
import { useAppState } from '../../flow/AppState';
import { listenMotion } from '../../lib/motion';
import type { MotionAccess } from '../../lib/permissions';
import { createStepDetector, DEFAULT_STEP_OPTIONS } from '../../lib/stepDetector';
import { readJson, removeKey, writeJson } from '../../lib/storage';
import s from './check.module.css';

// 歩数の精度を 確かめる記録。利用者のデータではないので store.ts（試作のサーバー）の外に置く
const TRIALS_KEY = 'hoho.check.stepTrials';

/** 同じ値を 3通りの しきい値で数えて くらべる（B が アプリと同じ） */
const VARIANTS = [
  { id: 'A', threshold: 0.8 },
  { id: 'B', threshold: DEFAULT_STEP_OPTIONS.threshold },
  { id: 'C', threshold: 1.2 },
] as const;
type VariantId = (typeof VARIANTS)[number]['id'];
type Counts = Record<VariantId, number>;
const ZERO: Counts = { A: 0, B: 0, C: 0 };

const CARRY_LABEL = { hand: '手に持つ', pocket: 'ポケット', bag: 'かばん' } as const;
type Carry = keyof typeof CARRY_LABEL;

interface Trial {
  at: string;
  carry: Carry;
  actual: number;
  counts: Counts;
}

const ACCESS_LABEL: Record<MotionAccess, string> = {
  checking: '調べています',
  granted: '数えられます',
  'needs-button': '下のボタンで 許可が必要です',
  denied: '許可されていません（ブラウザの設定を 確かめてください）',
  unsupported: 'このブラウザでは 数えられません（HTTPS で開いているか 確かめてください）',
};

function readTrials(): Trial[] {
  const saved = readJson<unknown>(TRIALS_KEY, []);
  return Array.isArray(saved) ? (saved as Trial[]) : [];
}

function gapPercent(count: number, actual: number): string {
  const p = ((count - actual) / actual) * 100;
  return `${p > 0 ? '+' : ''}${p.toFixed(1)}%`;
}

/**
 * T-01 歩数の精度を確かめる（チーム用・N-17・15章）。
 * 実際に数えた歩数と、アプリが数えた歩数を くらべて 記録する。利用者の画面からは 入口を出さない（N-06）
 */
export function StepCheckScreen() {
  const { navigate, motionAccess, allowMotion } = useAppState();
  const [running, setRunning] = useState(false);
  const [counts, setCounts] = useState<Counts>(ZERO);
  const [rate, setRate] = useState<number | null>(null);
  const [actual, setActual] = useState('');
  const [carry, setCarry] = useState<Carry>('hand');
  const [trials, setTrials] = useState<Trial[]>(readTrials);
  const totals = useRef<Counts>({ ...ZERO });

  useEffect(() => {
    if (!running) return;
    const detectors = VARIANTS.map((v) => ({ id: v.id, detector: createStepDetector({ threshold: v.threshold }) }));
    let samples = 0;
    let ticks = 0;
    const stop = listenMotion((sample) => {
      samples += 1;
      for (const { id, detector } of detectors) totals.current[id] += detector.push(sample);
    });
    // 表示は まとめて 0.25秒ごとに更新する。届いた値の数は 1秒ごと
    const timer = window.setInterval(() => {
      setCounts({ ...totals.current });
      ticks += 1;
      if (ticks % 4 === 0) {
        setRate(samples);
        samples = 0;
      }
    }, 250);
    // 測っている間は 画面を消さない（できるブラウザだけ。できなくても 何も出さない）
    let wakeLock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request('screen')
      .then((lock) => {
        wakeLock = lock;
      })
      .catch(() => {});
    return () => {
      stop();
      window.clearInterval(timer);
      void wakeLock?.release().catch(() => {});
    };
  }, [running]);

  const start = () => {
    totals.current = { ...ZERO };
    setCounts(ZERO);
    setRate(null);
    setRunning(true);
  };

  const actualSteps = Number(actual);
  const canRecord = Number.isInteger(actualSteps) && actualSteps > 0;

  const record = () => {
    if (!canRecord) return;
    const next = [{ at: new Date().toISOString(), carry, actual: actualSteps, counts: { ...counts } }, ...trials];
    setTrials(next);
    writeJson(TRIALS_KEY, next);
    setActual('');
  };

  const clearTrials = () => {
    setTrials([]);
    removeKey(TRIALS_KEY);
  };

  return (
    <Screen title="歩数の精度を確かめる（チーム用）" onBack={() => navigate('start')}>
      <Heading>歩数の精度を 確かめる</Heading>
      <Lead>チーム用の画面です。実際に数えた歩数と、アプリが数えた歩数を くらべます（15章）</Lead>

      <section className={s.section} aria-label="いまの様子">
        <p className={s.row}>
          体の動き：<strong>{ACCESS_LABEL[motionAccess]}</strong>
        </p>
        {motionAccess === 'needs-button' && (
          <Button variant="secondary" onClick={() => void allowMotion()}>
            数えはじめる（許可する）
          </Button>
        )}
        <p className={s.row}>
          1秒に届いた値：<strong>{rate === null ? '―' : rate === 0 ? '値が届いていません' : `${rate}回`}</strong>
        </p>
      </section>

      <section className={s.section} aria-label="数えた歩数">
        <ul className={s.counts}>
          {VARIANTS.map((v) => (
            <li key={v.id} className={`${s.count} ${v.id === 'B' ? s.countMain : ''}`}>
              <span className={s.countLabel}>
                {v.id}
                <small>
                  しきい値 {v.threshold}
                  {v.id === 'B' && '（アプリと同じ）'}
                </small>
              </span>
              <strong className={s.countValue} data-variant={v.id}>
                {counts[v.id]}
              </strong>
            </li>
          ))}
        </ul>
        <div className={s.buttons}>
          <Button onClick={start}>{running ? '0に もどす' : 'はじめる'}</Button>
          <Button variant="secondary" onClick={() => setRunning(false)} disabled={!running}>
            おわる
          </Button>
        </div>
      </section>

      <section className={s.section} aria-label="記録する">
        <label className={s.field} htmlFor="check-actual">
          実際の歩数
          <input id="check-actual" className={s.input} inputMode="numeric" value={actual} onChange={(e) => setActual(e.target.value.replace(/[^0-9]/g, ''))} />
        </label>
        <label className={s.field} htmlFor="check-carry">
          持ち方
          <select id="check-carry" className={s.input} value={carry} onChange={(e) => setCarry(e.target.value as Carry)}>
            {Object.entries(CARRY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" onClick={record} disabled={!canRecord}>
          記録する
        </Button>
      </section>

      {trials.length > 0 && (
        <section className={s.section} aria-label="これまでの記録">
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>日時</th>
                  <th>持ち方</th>
                  <th>実際</th>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((t) => (
                  <tr key={t.at}>
                    <td>{new Date(t.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{CARRY_LABEL[t.carry]}</td>
                    <td>{t.actual}</td>
                    {VARIANTS.map((v) => (
                      <td key={v.id}>
                        {t.counts[v.id]}
                        <small>{gapPercent(t.counts[v.id], t.actual)}</small>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="secondary" onClick={clearTrials}>
            記録を消す
          </Button>
        </section>
      )}
    </Screen>
  );
}
