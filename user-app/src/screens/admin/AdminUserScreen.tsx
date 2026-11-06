import { useState } from 'react';
import calorieIcon from '../../assets/icon/calorie.svg';
import distanceIcon from '../../assets/icon/distance-small.svg';
import { BackButton } from '../../components/BackButton';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import pressable from '../../components/pressable.module.css';
import { useAppState } from '../../flow/AppState';
import { ageAndCare, dayRecords } from '../../lib/admin';
import { formatDateTime, now } from '../../lib/dates';
import { formatKcal, formatKm, formatSteps } from '../../lib/health';
import { DiffLabel } from './AdminBits';
import { AdminChart } from './AdminChart';
import { isPeriod, useAdminSelectedUser, useRemembered } from './adminData';
import { GoalDialog } from './GoalDialog';
import s from './adminPhone.module.css';

/**
 * AM-03 測定結果（スマホ）：本日の歩数と 先週の同じ曜日との差・距離・カロリー・推移のグラフ（M-17・M-18・M-19）。
 * 見られるのは 本人が共有に同意している間だけ（N-14）。データの時点を表示（N-19）。
 */
export function AdminUserScreen() {
  const { navigate } = useAppState();
  const { user, summary } = useAdminSelectedUser();
  const [period, setPeriod] = useRemembered('hoho.admin.phonePeriod', 'week', isPeriod);
  const [editingGoal, setEditingGoal] = useState(false);
  const back = () => navigate('admin-list');

  if (!user || !summary) {
    return (
      <Screen title="測定結果（スマホ）" onBack={back} backLabel="一覧">
        <p className={s.unavailable}>
          この方の記録は 見られません。
          <br />
          本人が 記録を見せるのを やめたか、担当ではない方です
        </p>
      </Screen>
    );
  }

  const days = dayRecords(user, now(), period === 'week' ? 7 : 30);

  return (
    <Screen
      title="測定結果（スマホ）"
      scene={
        <>
          <div className={s.statusShade} aria-hidden="true" />
          <header className={s.userHeader}>
            <BackButton onClick={back} label="一覧" />
            <h1 className={s.userName}>{user.name} さん</h1>
            <p className={s.userSub}>{ageAndCare(summary)}</p>
            <p className={s.userStamp}>
              {summary.lastSyncAt ? `${formatDateTime(summary.lastSyncAt)} 時点のデータ` : 'まだ 記録が届いていません'}
            </p>
          </header>
        </>
      }
      overlay={editingGoal && <GoalDialog user={user} onClose={() => setEditingGoal(false)} />}
    >
      <section className={s.todayCard} aria-label="本日の歩数">
        <p className={s.cardLabel}>本日の歩数</p>
        <p className={s.todaySteps}>
          {formatSteps(summary.todaySteps)}
          <span className={s.todayUnit}> 歩</span>
        </p>
        <div className={s.todayDiff}>
          {summary.diffFromLastWeek !== null ? (
            <>
              <DiffLabel diff={summary.diffFromLastWeek} className={s.diffValue} />
              <p className={s.diffNote}>先週の同じ曜日より</p>
            </>
          ) : (
            <p className={s.diffNote}>{summary.notReceivedToday ? '今日の記録が まだ届いていません' : '先週の同じ曜日の記録が ありません'}</p>
          )}
        </div>
        <ProgressBar
          variant="card"
          value={summary.goal > 0 ? summary.todaySteps / summary.goal : 0}
          label={`目標 ${formatSteps(summary.goal)}歩 の ${summary.ratio}%`}
          className={s.todayBar}
        />
        <p className={s.todayGoal}>
          目標 {formatSteps(summary.goal)}歩 の {summary.ratio}%
        </p>
      </section>

      <div className={s.miniCards}>
        <section className={s.miniCard} aria-label="移動距離">
          <p className={s.miniHead}>
            <img className={s.miniIcon} src={distanceIcon} alt="" />
            移動距離
          </p>
          <p className={s.miniValue}>
            {formatKm(summary.distanceKm)}
            <span className={s.miniUnit}> km</span>
          </p>
        </section>
        <section className={s.miniCard} aria-label="消費カロリー">
          <p className={s.miniHead}>
            <img className={`${s.miniIcon} ${s.miniIconCalorie}`} src={calorieIcon} alt="" />
            消費カロリー
          </p>
          <p className={s.miniValue}>
            {formatKcal(summary.kcal)}
            <span className={s.miniUnit}> kcal</span>
          </p>
        </section>
      </div>

      <SegmentedControl
        size="medium"
        className={s.period}
        label="グラフの期間"
        options={[
          { value: 'week', label: '1週間' },
          { value: 'month', label: '1か月' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <section className={s.chartCard} aria-label="1日の合計歩数">
        <div className={s.chartHead}>
          <h2 className={s.chartTitle}>1日の合計歩数</h2>
          <p className={s.legend}>
            <span className={s.legendBar} aria-hidden="true" />
            歩数
            <span className={s.legendGoal} aria-hidden="true" />
            目標
          </p>
        </div>
        <AdminChart days={days} goal={summary.goal} period={period} variant="phone" />
      </section>

      <section className={s.goalCard} aria-label="1日の目標歩数">
        <div>
          <p className={s.cardLabel}>1日の目標歩数</p>
          <p className={s.goalValue}>
            {formatSteps(summary.goal)}
            <span className={s.goalUnit}> 歩</span>
          </p>
        </div>
        <button type="button" className={`${pressable.pressable} ${s.changeButton}`} onClick={() => setEditingGoal(true)}>
          変更する
        </button>
      </section>

      <p className={s.userNote}>本人が共有をやめると、この画面は見られなくなります</p>
    </Screen>
  );
}
