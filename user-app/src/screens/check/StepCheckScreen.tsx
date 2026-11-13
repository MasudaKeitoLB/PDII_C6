import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { Heading, Lead, Screen } from '../../components/Screen';
import { useAppState } from '../../flow/AppState';
import { listenMotion, type MotionSignal } from '../../lib/motion';
import { hasPermissionButton, queryAccelerometer, type MotionAccess, type SensorPermission } from '../../lib/permissions';
import { BROWSER_LABEL, detectBrowser, detectOs, OS_LABEL, type BrowserName } from '../../lib/platform';
import { createStepDetector, stepOptionsFor, type MotionOs, type StepDetector } from '../../lib/stepDetector';
import { readJson, removeKey, writeJson } from '../../lib/storage';
import s from './check.module.css';

// 歩数の精度を 確かめる記録。利用者のデータではないので store.ts（試作のサーバー）の外に置く
const TRIALS_KEY = 'hoho.check.stepTrials';

/** この端末で アプリが使う しきい値（端末の種類で選ぶ。いまは どれも 1.2） */
const APP_THRESHOLD = stepOptionsFor(detectOs()).threshold;

/** 同じ値を 3通りの しきい値で数えて くらべる（B が アプリと同じ） */
const VARIANTS = [
  { id: 'A', threshold: 1.0 },
  { id: 'B', threshold: APP_THRESHOLD },
  { id: 'C', threshold: 1.5 },
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
  /** 測った端末（Android版から。前の記録には ない） */
  env?: { os: MotionOs; browser: BrowserName; rate: number | null };
}

const ACCESS_LABEL: Record<MotionAccess, string> = {
  checking: '調べています',
  granted: '数えられます',
  'needs-button': '下のボタンで 許可が必要です',
  denied: '許可されていません（下の手順で 設定を 確かめてください）',
  unsupported: 'このブラウザでは 数えられません（HTTPS で開いているか 確かめてください）',
};

const SIGNAL_LABEL: Record<MotionSignal, string> = {
  unknown: 'まだ 分かりません',
  receiving: '届いています',
  silent: '届いていません',
};

const PERMISSION_LABEL: Record<SensorPermission, string> = {
  granted: '許可',
  denied: 'ブロック',
  prompt: '確認する',
  unknown: '調べられない（Firefox・Safari など）',
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
 * 実際に数えた歩数と、アプリが数えた歩数を くらべて 記録する。利用者の画面からは 入口を出さない（N-06）。
 * Android版：端末・ブラウザ・値の届き方も出して、記録にも残す
 */
export function StepCheckScreen() {
  const { navigate, motionAccess, allowMotion } = useAppState();
  const [running, setRunning] = useState(false);
  const [counts, setCounts] = useState<Counts>(ZERO);
  const [rate, setRate] = useState<number | null>(null);
  const [interval, setIntervalMs] = useState<number | null>(null);
  const [emptyEvents, setEmptyEvents] = useState(0);
  const [signal, setSignal] = useState<MotionSignal>('unknown');
  const [sensorPermission, setSensorPermission] = useState<SensorPermission>('unknown');
  const [actual, setActual] = useState('');
  const [carry, setCarry] = useState<Carry>('hand');
  const [trials, setTrials] = useState<Trial[]>(readTrials);
  const totals = useRef<Counts>({ ...ZERO });
  const runningRef = useRef(false);
  const detectors = useRef<{ id: VariantId; detector: StepDetector }[]>([]);
  const os = detectOs();
  const browser = detectBrowser();

  // 開いている間は ずっと聞いて、値が届いているか・1秒の回数・間隔を出す（「はじめる」の前から）
  useEffect(() => {
    // 聞きなおすときは 前の「届いていない」を 残さない
    setSignal('unknown');
    let valid = 0;
    let empty = 0;
    let lastInterval: number | null = null;
    let ticks = 0;
    const stop = listenMotion(
      (sample) => {
        if (!runningRef.current) return;
        for (const { id, detector } of detectors.current) totals.current[id] += detector.push(sample);
      },
      {
        onSignal: setSignal,
        onEvent: (info) => {
          if (info.valid) valid += 1;
          else empty += 1;
          lastInterval = info.interval;
        },
      },
    );
    // 表示は まとめて 0.25秒ごとに更新する。届いた値の数は 1秒ごと
    const timer = window.setInterval(() => {
      if (runningRef.current) setCounts({ ...totals.current });
      ticks += 1;
      if (ticks % 4 === 0) {
        setRate(valid);
        setIntervalMs(lastInterval);
        setEmptyEvents(empty);
        valid = 0;
      }
    }, 250);
    let alive = true;
    void queryAccelerometer().then((state) => {
      if (alive) setSensorPermission(state);
    });
    return () => {
      alive = false;
      stop();
      window.clearInterval(timer);
    };
  }, [motionAccess]);

  useEffect(() => {
    runningRef.current = running;
    if (!running) return;
    detectors.current = VARIANTS.map((v) => ({ id: v.id, detector: createStepDetector({ ...stepOptionsFor(os), threshold: v.threshold }) }));
    // 測っている間は 画面を消さない（できるブラウザだけ。できなくても 何も出さない）
    let wakeLock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request('screen')
      .then((lock) => {
        wakeLock = lock;
      })
      .catch(() => {});
    return () => {
      runningRef.current = false;
      detectors.current = [];
      void wakeLock?.release().catch(() => {});
    };
  }, [running, os]);

  const start = () => {
    totals.current = { ...ZERO };
    setCounts(ZERO);
    if (running) detectors.current.forEach(({ detector }) => detector.reset());
    setRunning(true);
  };

  const actualSteps = Number(actual);
  const canRecord = Number.isInteger(actualSteps) && actualSteps > 0;

  const record = () => {
    if (!canRecord) return;
    const next: Trial[] = [{ at: new Date().toISOString(), carry, actual: actualSteps, counts: { ...counts }, env: { os, browser, rate } }, ...trials];
    setTrials(next);
    writeJson(TRIALS_KEY, next);
    setActual('');
  };

  const clearTrials = () => {
    setTrials([]);
    removeKey(TRIALS_KEY);
  };

  const cannotCount = motionAccess === 'denied' || motionAccess === 'unsupported' || (motionAccess === 'granted' && signal === 'silent');

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
          値：<strong data-signal={signal}>{SIGNAL_LABEL[signal]}</strong>
        </p>
        <p className={s.row}>
          1秒に届いた値：<strong>{rate === null ? '―' : rate === 0 ? '値が届いていません' : `${rate}回`}</strong>
          {interval !== null && `（間隔 ${Math.round(interval)}ms）`}
        </p>
        {emptyEvents > 0 && <p className={s.row}>中身のない値：{emptyEvents}回（センサーを止めていると 1回だけ届きます）</p>}
        {cannotCount && (
          <div className={s.help}>
            <p>
              <strong>数えられないときの 確かめ方（スタッフ向け）</strong>
            </p>
            <ul>
              <li>アドレスが https で はじまっているか（http の Network のアドレスでは 数えられません）</li>
              <li>Android の Chrome・Samsung Internet：アドレスの左の アイコン →「権限」→「モーション センサー」を 許可</li>
              <li>iPhone の Safari：上の「数えはじめる（許可する）」を押す。だめなら Safari を 開きなおす</li>
              <li>Firefox：プライバシーの設定で 値が来ないことがあります。Chrome でも 試してください</li>
            </ul>
          </div>
        )}
      </section>

      <section className={s.section} aria-label="この端末">
        <dl className={s.env}>
          <dt>端末</dt>
          <dd data-os={os}>
            {OS_LABEL[os]}・{BROWSER_LABEL[browser]}
          </dd>
          <dt>許可の しくみ</dt>
          <dd>{hasPermissionButton() ? 'ボタンで許可（requestPermission あり）' : 'ボタンなし'}</dd>
          <dt>センサーの許可</dt>
          <dd>{PERMISSION_LABEL[sensorPermission]}</dd>
          <dt>HTTPS</dt>
          <dd>{window.isSecureContext ? 'はい' : 'いいえ（数えられません）'}</dd>
          <dt>アプリの しきい値</dt>
          <dd>{APP_THRESHOLD.toFixed(1)}</dd>
        </dl>
      </section>

      <section className={s.section} aria-label="数えた歩数">
        <ul className={s.counts}>
          {VARIANTS.map((v) => (
            <li key={v.id} className={`${s.count} ${v.id === 'B' ? s.countMain : ''}`}>
              <span className={s.countLabel}>
                {v.id}
                <small>
                  しきい値 {v.threshold.toFixed(1)}
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
                  <th>端末</th>
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
                    <td>
                      {t.env ? OS_LABEL[t.env.os] : '―'}
                      <small>{t.env ? `${BROWSER_LABEL[t.env.browser]}${t.env.rate ? `・${t.env.rate}回/秒` : ''}` : ''}</small>
                    </td>
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
