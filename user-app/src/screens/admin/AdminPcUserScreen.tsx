import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl';
import pressable from '../../components/pressable.module.css';
import { useAppState } from '../../flow/AppState';
import { careLevelLabel, careManagerName, dayRecords } from '../../lib/admin';
import { formatDateTime, now, WEEKDAYS } from '../../lib/dates';
import { formatKcal, formatKm, formatSteps } from '../../lib/health';
import { DiffLabel } from './AdminBits';
import { AdminChart } from './AdminChart';
import { isPeriod, useAdminSelectedUser, useRemembered } from './adminData';
import { GoalDialog } from './GoalDialog';
import { PcLayout } from './PcLayout';
import s from './adminPc.module.css';

/**
 * AP-03 測定結果（PC）：グラフと 日ごとの表を 同時に見られる（M-17・M-18・M-19）。
 * 見られるのは 本人が共有に同意している間だけ（N-14）。データの時点を表示（N-19）。
 */
export function AdminPcUserScreen() {
  const { navigate } = useAppState();
  const { account, user, summary } = useAdminSelectedUser();
  const [period, setPeriod] = useRemembered('hoho.admin.pcPeriod', 'week', isPeriod);
  const [editingGoal, setEditingGoal] = useState(false);
  const toList = () => navigate('admin-pc-list');

  const breadcrumb = (current: string) => (
    <nav className={s.breadcrumb} aria-label="いまの場所">
      <a
        href="#admin-pc-list"
        onClick={(e) => {
          e.preventDefault();
          toList();
        }}
      >
        利用者の一覧
      </a>
      <span aria-hidden="true">＞</span>
      <span aria-current="page">{current}</span>
    </nav>
  );

  if (!user || !summary) {
    return (
      <PcLayout title="測定結果（PC）" account={account}>
        {breadcrumb('測定結果')}
        <p className={s.unavailable}>この方の記録は 見られません。本人が 記録を見せるのを やめたか、見られる方ではありません。</p>
      </PcLayout>
    );
  }

  const today = now();
  const days = dayRecords(user, today, period === 'week' ? 7 : 30);
  const cm = careManagerName(user.careManagerId);
  const lastIndex = days.length - 1;

  return (
    <PcLayout
      title="測定結果（PC）"
      account={account}
      overlay={editingGoal && <GoalDialog user={user} onClose={() => setEditingGoal(false)} />}
    >
      {breadcrumb(`${user.name} さん`)}
      <div className={s.userHead}>
        <h1 className={s.userName}>{user.name} さん</h1>
        <p className={s.userSub}>
          {summary.age}歳・{careLevelLabel(user)}・担当ケアマネージャー：{cm ?? 'なし'}
        </p>
        <p className={s.userStamp}>
          {summary.lastSyncAt ? `${formatDateTime(summary.lastSyncAt)} 時点のデータ` : 'まだ 記録が届いていません'}
        </p>
      </div>

      <div className={s.stats}>
        <section className={s.stat} aria-label="本日の歩数">
          <p className={s.statLabel}>本日の歩数</p>
          <p className={s.statValue}>
            {formatSteps(summary.todaySteps)}
            <span className={s.statUnit}> 歩</span>
          </p>
          <p className={s.statDiff}>
            {summary.diffFromLastWeek !== null ? (
              <>
                <DiffLabel diff={summary.diffFromLastWeek} className={s.statDiffValue} />
                <span className={s.statDiffNote}>先週の同じ曜日より</span>
              </>
            ) : (
              <span className={s.statDiffNote}>{summary.notReceivedToday ? '今日の記録が まだ届いていません' : '先週の同じ曜日の記録が ありません'}</span>
            )}
          </p>
        </section>
        <section className={s.stat} aria-label="移動距離">
          <p className={s.statLabel}>移動距離</p>
          <p className={s.statValue}>
            {formatKm(summary.distanceKm)}
            <span className={s.statUnit}> km</span>
          </p>
        </section>
        <section className={s.stat} aria-label="消費カロリー">
          <p className={s.statLabel}>消費カロリー</p>
          <p className={s.statValue}>
            {formatKcal(summary.kcal)}
            <span className={s.statUnit}> kcal</span>
          </p>
        </section>
        <section className={s.stat} aria-label="1日の目標歩数">
          <p className={s.statLabel}>1日の目標歩数</p>
          <p className={s.statValue}>
            {formatSteps(summary.goal)}
            <span className={s.statUnit}> 歩</span>
          </p>
          <button type="button" className={`${pressable.pressable} ${s.statChange}`} onClick={() => setEditingGoal(true)}>
            変更する
          </button>
        </section>
      </div>

      <section className={s.chartCard} aria-label="歩数の推移">
        <div className={s.chartHead}>
          <div>
            <h2 className={s.chartTitle}>歩数の推移（1日の合計）</h2>
            <p className={s.legend}>
              <span className={s.legendBar} aria-hidden="true" />
              歩数
              <span className={s.legendGoal} aria-hidden="true" />
              目標（{formatSteps(summary.goal)}歩）
            </p>
          </div>
          <SegmentedControl
            size="small"
            className={s.period}
            label="グラフの期間"
            options={[
              { value: 'week', label: '1週間' },
              { value: 'month', label: '1か月' },
            ]}
            value={period}
            onChange={setPeriod}
          />
        </div>
        <AdminChart days={days} goal={summary.goal} period={period} variant="pc" />
      </section>

      <section className={s.tableCard} aria-labelledby="daily-title">
        <h2 id="daily-title" className={s.tableTitle}>
          日ごとの記録
        </h2>
        <table className={s.daily}>
          <thead>
            <tr>
              <th scope="col">日付</th>
              <th scope="col">歩数</th>
              <th scope="col">移動距離</th>
              <th scope="col">消費カロリー</th>
              <th scope="col">目標まで</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d, i) => {
              const isToday = i === lastIndex;
              const left = summary.goal - d.steps;
              return (
                <tr key={d.date.getTime()} className={isToday ? s.dailyToday : undefined}>
                  <th scope="row">
                    {d.date.getMonth() + 1}月{d.date.getDate()}日（{WEEKDAYS[d.date.getDay()]}）{isToday && ' 今日'}
                  </th>
                  <td className={s.dailySteps}>{formatSteps(d.steps)}歩</td>
                  <td>{formatKm(d.distanceKm)} km</td>
                  <td>{formatKcal(d.kcal)} kcal</td>
                  {/* 過去の日も 今の目標と くらべる（目標の変更の記録は まだ持たない） */}
                  <td>{left <= 0 ? <span className={s.achieved}>達成</span> : <span className={s.left}>あと {formatSteps(left)}歩</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </PcLayout>
  );
}
