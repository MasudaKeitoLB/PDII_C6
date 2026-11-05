import { useState } from 'react';
import arrowDown from '../../assets/ui/arrow-down.svg';
import { Chevron } from '../../components/Chevron';
import { ProgressBar } from '../../components/ProgressBar';
import pressable from '../../components/pressable.module.css';
import { useAppState } from '../../flow/AppState';
import { careLevelLabel, matchesName, SORT_LABEL, sortSummaries, type AdminSort } from '../../lib/admin';
import { formatDateTime } from '../../lib/dates';
import { formatSteps } from '../../lib/health';
import type { AdminAccount } from '../../lib/types';
import { DiffLabel, ReceivedLabel } from './AdminBits';
import { useAdminSnapshot, useRemembered } from './adminData';
import { PcLayout } from './PcLayout';
import s from './adminPc.module.css';

type Filter = 'all' | 'notReceived';
const SORTS = Object.keys(SORT_LABEL) as AdminSort[];
const isSort = (v: unknown): v is AdminSort => SORTS.includes(v as AdminSort);
const isFilter = (v: unknown): v is Filter => v === 'all' || v === 'notReceived';

/**
 * AP-02 利用者の一覧（PC）：表で 歩数・目標に対しての割合・前週との差・最終受信を ならべて比べる（M-16）。
 * 名前でさがす・並べかえる・記録が届いていない人だけ出す。データの時点を表示（N-19）。
 */
export function AdminPcListScreen({ account }: { account: AdminAccount }) {
  const { navigate, setAdminUserId } = useAppState();
  const { fetchedAt, list, refresh } = useAdminSnapshot(account);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useRemembered<AdminSort>('hoho.admin.pcSort', 'fewest', isSort);
  const [filter, setFilter] = useRemembered<Filter>('hoho.admin.pcFilter', 'all', isFilter);
  const notReceived = list.filter((x) => x.notReceivedToday).length;
  const rows = sortSummaries(
    list.filter((x) => (filter === 'all' || x.notReceivedToday) && matchesName(x.user, query)),
    sort,
  );

  const open = (id: string) => {
    setAdminUserId(id);
    navigate('admin-pc-user');
  };

  return (
    <PcLayout
      title="利用者の一覧（PC）"
      account={account}
      topBar={
        <header className={s.topBar}>
          <h1 className={s.pageTitle}>利用者の一覧</h1>
          <p className={s.countBadge}>{list.length}人</p>
          <p className={s.stamp} aria-live="polite">
            {formatDateTime(fetchedAt)} 時点のデータ
          </p>
          <button type="button" className={`${pressable.pressable} ${s.refresh}`} onClick={refresh}>
            最新にする
          </button>
        </header>
      }
    >
      <div className={s.tools}>
        <label className={s.search}>
          <span className={s.searchIcon} aria-hidden="true" />
          <span className="visually-hidden">名前でさがす</span>
          <input
            className={s.searchInput}
            type="search"
            value={query}
            placeholder="名前でさがす"
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className={s.select}>
          <span className={s.selectText} aria-hidden="true">
            並び順：{SORT_LABEL[sort]}
          </span>
          <img className={s.selectArrow} src={arrowDown} alt="" />
          <select className={s.selectNative} value={sort} aria-label="並び順" onChange={(e) => setSort(e.target.value as AdminSort)}>
            {SORTS.map((key) => (
              <option key={key} value={key}>
                {SORT_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        <div className={s.filters} role="radiogroup" aria-label="出す人">
          <button type="button" role="radio" aria-checked={filter === 'all'} className={s.filter} onClick={() => setFilter('all')}>
            すべて（{list.length}）
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={filter === 'notReceived'}
            className={s.filter}
            onClick={() => setFilter('notReceived')}
          >
            記録が届いていない（{notReceived}）
          </button>
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">お名前</th>
              <th scope="col">年齢</th>
              <th scope="col">介護レベル</th>
              <th scope="col" className={s.alignRight}>
                本日の歩数
              </th>
              <th scope="col">目標に対して</th>
              <th scope="col">先週の同じ曜日との差</th>
              <th scope="col">最終受信</th>
              <th scope="col">
                <span className="visually-hidden">詳しく見る</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              // 行のどこを押しても開く。キーボードでは 名前のリンクで開く
              <tr key={x.user.id} className={s.row} onClick={() => open(x.user.id)}>
                <th scope="row" className={s.nameCell}>
                  <a
                    className={s.rowLink}
                    href="#admin-pc-user"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      open(x.user.id);
                    }}
                  >
                    {x.user.name}
                  </a>
                </th>
                <td>{x.age}歳</td>
                <td>{careLevelLabel(x.user)}</td>
                <td className={s.alignRight}>
                  <span className={s.steps}>{formatSteps(x.todaySteps)}</span>
                  <span className={s.stepsUnit}>歩</span>
                </td>
                <td>
                  <span className={s.ratio}>
                    <ProgressBar variant="mini" value={x.goal > 0 ? x.todaySteps / x.goal : 0} className={s.ratioBar} />
                    <span className={s.ratioText}>{x.ratio}%</span>
                  </span>
                </td>
                <td>
                  {x.diffFromLastWeek === null ? (
                    <span className={s.noDiff}>
                      <span aria-hidden="true">―</span>
                      <span className="visually-hidden">比べられません</span>
                    </span>
                  ) : (
                    <DiffLabel diff={x.diffFromLastWeek} className={s.diff} />
                  )}
                </td>
                <td className={s.receivedCell}>
                  <ReceivedLabel summary={x} />
                </td>
                <td className={s.chevronCell}>
                  <Chevron size={14} className={s.rowChevron} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className={s.noRows}>{list.length === 0 ? '見られる利用者は まだいません' : 'この条件に合う人は いません'}</p>
        )}
      </div>

      <p className={s.footnote}>共有に同意した利用者だけが表示されます。「―」は今日の記録がまだ届いていないため比べられません。</p>
    </PcLayout>
  );
}
