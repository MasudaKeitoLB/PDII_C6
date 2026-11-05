import { formatReceived, now } from '../../lib/dates';
import { formatSteps } from '../../lib/health';
import type { UserSummary } from '../../lib/admin';
import s from './adminBits.module.css';

/**
 * 先週の同じ曜日との差（AM-03 の提案）。ふえた日は ▲＋（緑）、へった日は ▼－（墨）。
 * へった日も 赤くしない（N-11：責めない）。
 */
export function DiffLabel({ diff, className }: { diff: number; className?: string }) {
  const up = diff >= 0;
  return (
    <span className={[s.diff, up ? s.up : s.down, className].filter(Boolean).join(' ')}>
      <span className={up ? s.triangleUp : s.triangleDown} aria-hidden="true" />
      <span>
        {up ? '＋' : '－'}
        {formatSteps(Math.abs(diff))}歩
      </span>
    </span>
  );
}

/** 受信の注意の「！」（色だけに たよらない） */
export function WarnMark({ size = 16 }: { size?: 14 | 16 }) {
  return (
    <span className={`${s.warn} ${size === 14 ? s.warnSmall : ''}`} aria-hidden="true">
      !
    </span>
  );
}

/** 最終受信。今日の記録が まだ届いていない人は「！」と朱色（AM-02・AP-02） */
export function ReceivedLabel({ summary, prefix = '', className }: { summary: UserSummary; prefix?: string; className?: string }) {
  if (!summary.lastSyncAt) {
    return (
      <span className={[s.received, s.late, className].filter(Boolean).join(' ')}>
        <WarnMark />
        {prefix}まだ受信していません
      </span>
    );
  }
  const text = `${prefix}${formatReceived(summary.lastSyncAt, now())}`;
  if (!summary.notReceivedToday) return <span className={[s.received, className].filter(Boolean).join(' ')}>{text}</span>;
  return (
    <span className={[s.received, s.late, className].filter(Boolean).join(' ')}>
      <WarnMark />
      <span>
        {text}
        <span className="visually-hidden">（今日の記録が まだ届いていません）</span>
      </span>
    </span>
  );
}
