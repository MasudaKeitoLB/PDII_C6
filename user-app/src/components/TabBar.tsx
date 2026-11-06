import tabAdventure from '../assets/icon/tab-adventure.svg';
import tabMe from '../assets/icon/tab-me.svg';
import tabRecords from '../assets/icon/tab-records.svg';
import { useAppState } from '../flow/AppState';
import type { RouteId, TabId } from '../flow/routes';
import styles from './TabBar.module.css';

const TABS: { id: TabId; label: string; icon: string; route: RouteId }[] = [
  { id: 'adventure', label: '冒険', icon: tabAdventure, route: 'home' },
  { id: 'records', label: '記録', icon: tabRecords, route: 'records' },
  { id: 'me', label: 'わたし', icon: tabMe, route: 'me' },
];

/** 下のタブ（MVPは3つ・N-06）。名前は ふだんの言葉（ホーム→冒険／ヘルス→記録／マイページ→わたし） */
export function TabBar({ active }: { active: TabId }) {
  const { navigate } = useAppState();
  return (
    <nav className={styles.bar} aria-label="画面のきりかえ">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${styles.tab} ${tab.id === active ? styles.active : ''}`}
          aria-current={tab.id === active ? 'page' : undefined}
          onClick={() => navigate(tab.route)}
        >
          <span className={styles.icon}>
            <img src={tab.icon} alt="" />
          </span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
