import { Chevron } from '../../components/Chevron';
import { ProgressBar } from '../../components/ProgressBar';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import pressable from '../../components/pressable.module.css';
import { useAppState } from '../../flow/AppState';
import { ageAndCare, sortSummaries } from '../../lib/admin';
import { formatDateTime } from '../../lib/dates';
import { formatSteps } from '../../lib/health';
import { setAdminSession } from '../../lib/store';
import type { AdminAccount } from '../../lib/types';
import { ReceivedLabel, WarnMark } from './AdminBits';
import { useAdminSnapshot, useRemembered } from './adminData';
import s from './adminPhone.module.css';

type PhoneSort = 'fewest' | 'name';
const isPhoneSort = (v: unknown): v is PhoneSort => v === 'fewest' || v === 'name';

/**
 * AM-02 利用者の一覧（スマホ）：1人ずつ大きなカード。
 * 「歩数が少ない順」で 声かけが必要そうな人を上に。記録が届いていない人に「！」。データの時点を表示（N-19）。
 */
export function AdminListScreen({ account }: { account: AdminAccount }) {
  const { navigate, setAdminUserId } = useAppState();
  const { fetchedAt, list, refresh } = useAdminSnapshot(account);
  const [sort, setSort] = useRemembered<PhoneSort>('hoho.admin.phoneSort', 'fewest', isPhoneSort);
  const sorted = sortSummaries(list, sort);
  const careManager = account.role === 'careManager';

  const logout = () => {
    setAdminSession(null);
    setAdminUserId(null);
    navigate('admin-login');
  };

  return (
    <Screen
      title="利用者の一覧（スマホ）"
      background="paper"
      scene={
        <>
          <div className={s.statusShade} aria-hidden="true" />
          <header className={s.listHeader}>
            <h1 className={s.listTitle}>
              {careManager ? '担当の利用者' : '利用者の一覧'} <span className={s.count}>{list.length}人</span>
            </h1>
            <div className={s.listSubRow}>
              <p className={s.listSub}>
                {account.name}（{careManager ? 'ケアマネージャー' : account.organization}）
              </p>
              <button type="button" className={s.logout} onClick={logout}>
                ログアウト
              </button>
            </div>
          </header>
          <div className={s.stampBar}>
            <p className={s.stamp} aria-live="polite">
              {formatDateTime(fetchedAt)} 時点のデータ
            </p>
            <button type="button" className={s.update} onClick={refresh}>
              更新
            </button>
          </div>
        </>
      }
    >
      <SegmentedControl
        size="small"
        className={s.sort}
        label="並び順"
        options={[
          { value: 'fewest', label: '歩数が少ない順' },
          { value: 'name', label: '名前順' },
        ]}
        value={sort}
        onChange={setSort}
      />

      {sorted.length > 0 ? (
        <ul className={s.cards} aria-label="利用者">
          {sorted.map((summary) => (
            <li key={summary.user.id}>
              <button
                type="button"
                className={`${pressable.pressable} ${s.card}`}
                onClick={() => {
                  setAdminUserId(summary.user.id);
                  navigate('admin-user');
                }}
              >
                <span className={s.cardName}>{summary.user.name}</span>
                <span className={s.cardAge}>{ageAndCare(summary)}</span>
                <ReceivedLabel summary={summary} prefix="受信 " className={s.cardReceived} />
                <span className={s.cardSteps}>
                  <span className={s.cardStepsNumber}>{formatSteps(summary.todaySteps)}</span>
                  <span className={s.cardStepsUnit}>歩</span>
                </span>
                <ProgressBar
                  variant="mini"
                  value={summary.goal > 0 ? summary.todaySteps / summary.goal : 0}
                  label={`目標の ${summary.ratio}%`}
                  className={s.cardBar}
                />
                <span className={s.cardGoal}>目標 {formatSteps(summary.goal)}</span>
                <Chevron size={18} className={s.cardChevron} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.empty}>
          見られる利用者は まだいません。
          <br />
          利用者が アプリで「記録を見せる」に 同意すると 出てきます
        </p>
      )}

      <p className={s.footNote}>共有に同意した利用者だけが 表示されます</p>
      <p className={s.footLegend}>
        <WarnMark size={14} />
        今日の記録が まだ届いていない人
      </p>
    </Screen>
  );
}
